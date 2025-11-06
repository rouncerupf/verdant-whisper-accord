import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

const CONTRACT_NAME = "VerdantWhisperAccord";

task("task:accord-address", "Prints the Verdant Whisper Accord contract address").setAction(
  async function (_taskArguments: TaskArguments, hre) {
    const { deployments } = hre;
    const deployment = await deployments.get(CONTRACT_NAME);
    console.log(`${CONTRACT_NAME} address is ${deployment.address}`);
  },
);

task("task:accord-global-totals", "Decrypts the global encrypted totals")
  .addOptionalParam("address", "Optionally specify a VerdantWhisperAccord contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;
    await fhevm.initializeCLIApi();

    const deployment = taskArguments.address ? { address: taskArguments.address } : await deployments.get(CONTRACT_NAME);
    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt(CONTRACT_NAME, deployment.address);

    const [totalRequested, totalAllocated, totalPriority] = await contract.getGlobalTotals();

    const requested = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      totalRequested,
      deployment.address,
      signer,
    );
    const allocated = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      totalAllocated,
      deployment.address,
      signer,
    );
    const priority = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      totalPriority,
      deployment.address,
      signer,
    );

    console.log(`Total requested (clear): ${requested}`);
    console.log(`Total allocated (clear): ${allocated}`);
    console.log(`Global priority weight (clear): ${priority}`);
  });

task("task:accord-snapshot", "Decrypt the latest allocation snapshot for the caller")
  .addOptionalParam("address", "Optionally specify a VerdantWhisperAccord contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;
    await fhevm.initializeCLIApi();

    const deployment = taskArguments.address ? { address: taskArguments.address } : await deployments.get(CONTRACT_NAME);
    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt(CONTRACT_NAME, deployment.address);

    const snapshot = await contract.getAllocationSnapshot(signer.address);

    const totalRequested = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      snapshot.totalRequested,
      deployment.address,
      signer,
    );
    const totalAllocated = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      snapshot.totalAllocated,
      deployment.address,
      signer,
    );
    const remaining = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      snapshot.remaining,
      deployment.address,
      signer,
    );

    console.log(`Snapshot totals -> requested: ${totalRequested}, allocated: ${totalAllocated}, remaining: ${remaining}`);
  });

