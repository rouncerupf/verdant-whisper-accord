import { expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";
import {
  VerdantWhisperAccord,
  VerdantWhisperAccord__factory,
} from "../types";

type Signers = {
  deployer: HardhatEthersSigner;
  proposer: HardhatEthersSigner;
  committee: HardhatEthersSigner;
  reviewer: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory(
    "VerdantWhisperAccord",
  )) as VerdantWhisperAccord__factory;
  const contract = (await factory.deploy()) as VerdantWhisperAccord;
  const address = await contract.getAddress();
  return { contract, address };
}

describe("VerdantWhisperAccord", function () {
  let signers: Signers;
  let contract: VerdantWhisperAccord;
  let contractAddress: string;

  before(async function () {
    const [deployer, proposer, committee, reviewer] =
      await ethers.getSigners();
    signers = { deployer, proposer, committee, reviewer };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      this.skip();
    }

    ({ contract, address: contractAddress } = await deployFixture());
    await contract
      .connect(signers.deployer)
      .setCommitteeMember(signers.committee.address, true);
  });

  async function encrypt64(
    value: number | bigint,
    owner: HardhatEthersSigner,
  ) {
    return fhevm
      .createEncryptedInput(contractAddress, owner.address)
      .add64(value)
      .encrypt();
  }

  async function encrypt32(
    value: number | bigint,
    owner: HardhatEthersSigner,
  ) {
    return fhevm
      .createEncryptedInput(contractAddress, owner.address)
      .add32(value)
      .encrypt();
  }

  it("allows initiative submission and updates global aggregates", async function () {
    const summaryCiphertext = ethers.toUtf8Bytes("encrypted-summary");
    const resourcesCiphertext = ethers.toUtf8Bytes("resources-bundle");

    const budget = await encrypt64(250, signers.proposer);
    const priority = await encrypt32(80, signers.proposer);
    const detail = await encrypt32(12345, signers.proposer);

    await expect(
      contract.connect(signers.proposer).submitInitiative({
        summaryCiphertext,
        resourcesCiphertext,
        requestedBudgetCipher: budget.handles[0],
        requestedBudgetProof: budget.inputProof,
        basePriorityCipher: priority.handles[0],
        basePriorityProof: priority.inputProof,
        detailHandleCipher: detail.handles[0],
        detailHandleProof: detail.inputProof,
      }),
    )
      .to.emit(contract, "InitiativeSubmitted")
      .withArgs(0, signers.proposer.address);

    expect(await contract.initiativeCount()).to.equal(1n);

    const [totalRequested, totalAllocated, totalPriority] = await contract.getGlobalTotals();

    const requestedClear = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      totalRequested,
      contractAddress,
      signers.deployer,
    );
    const allocatedClear = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      totalAllocated,
      contractAddress,
      signers.deployer,
    );
    const priorityClear = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      totalPriority,
      contractAddress,
      signers.deployer,
    );

    expect(requestedClear).to.equal(250n);
    expect(allocatedClear).to.equal(0n);
    expect(priorityClear).to.equal(80n);
  });

  it("supports committee voting and allocation simulations", async function () {
    // proposer submits two initiatives
    const init1Budget = await encrypt64(300, signers.proposer);
    const init1Priority = await encrypt32(60, signers.proposer);
    const init1Detail = await encrypt32(1111, signers.proposer);

    await contract.connect(signers.proposer).submitInitiative({
      summaryCiphertext: ethers.toUtf8Bytes("summary-1"),
      resourcesCiphertext: ethers.toUtf8Bytes("resources-1"),
      requestedBudgetCipher: init1Budget.handles[0],
      requestedBudgetProof: init1Budget.inputProof,
      basePriorityCipher: init1Priority.handles[0],
      basePriorityProof: init1Priority.inputProof,
      detailHandleCipher: init1Detail.handles[0],
      detailHandleProof: init1Detail.inputProof,
    });

    const reviewerBudget = await encrypt64(120, signers.reviewer);
    const reviewerPriority = await encrypt32(40, signers.reviewer);
    const reviewerDetail = await encrypt32(2222, signers.reviewer);

    await contract.connect(signers.reviewer).submitInitiative({
      summaryCiphertext: ethers.toUtf8Bytes("summary-2"),
      resourcesCiphertext: ethers.toUtf8Bytes("resources-2"),
      requestedBudgetCipher: reviewerBudget.handles[0],
      requestedBudgetProof: reviewerBudget.inputProof,
      basePriorityCipher: reviewerPriority.handles[0],
      basePriorityProof: reviewerPriority.inputProof,
      detailHandleCipher: reviewerDetail.handles[0],
      detailHandleProof: reviewerDetail.inputProof,
    });

    const voteWeight = await encrypt32(25, signers.committee);
    await expect(
      contract
        .connect(signers.committee)
        .castVote(0, voteWeight.handles[0], voteWeight.inputProof),
    )
      .to.emit(contract, "VoteCast")
      .withArgs(0, signers.committee.address);

    const budgetPool = await encrypt64(600, signers.committee);
    await contract
      .connect(signers.committee)
      .simulateAllocation([0, 1], budgetPool.handles[0], budgetPool.inputProof);

    const snapshot = await contract.getAllocationSnapshot(
      signers.committee.address,
    );
    const requestedClear = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      snapshot.totalRequested,
      contractAddress,
      signers.committee,
    );
    const allocatedClear = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      snapshot.totalAllocated,
      contractAddress,
      signers.committee,
    );
    const remainingClear = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      snapshot.remaining,
      contractAddress,
      signers.committee,
    );

    expect(requestedClear).to.equal(420n);
    expect(allocatedClear).to.equal(0n);
    expect(remainingClear).to.equal(180n);

    await contract.connect(signers.committee).simulateApproval([0, 1]);
    const combinedPriority = await contract.getApprovalSimulation(
      signers.committee.address,
    );
    const combinedPriorityClear = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      combinedPriority,
      contractAddress,
      signers.committee,
    );

    // base priorities: 60 + 40, vote adds 25 to init1
    expect(combinedPriorityClear).to.equal(125n);
  });

  it("allows approval flow and decryption authorization", async function () {
    const budget = await encrypt64(280, signers.proposer);
    const priority = await encrypt32(55, signers.proposer);
    const detail = await encrypt32(9999, signers.proposer);

    await contract.connect(signers.proposer).submitInitiative({
      summaryCiphertext: ethers.toUtf8Bytes("summary-final"),
      resourcesCiphertext: ethers.toUtf8Bytes("resources-final"),
      requestedBudgetCipher: budget.handles[0],
      requestedBudgetProof: budget.inputProof,
      basePriorityCipher: priority.handles[0],
      basePriorityProof: priority.inputProof,
      detailHandleCipher: detail.handles[0],
      detailHandleProof: detail.inputProof,
    });

    const allocation = await encrypt64(200, signers.committee);
    await expect(
      contract
        .connect(signers.committee)
        .approveInitiative(0, allocation.handles[0], allocation.inputProof),
    )
      .to.emit(contract, "InitiativeApproved")
      .withArgs(0, signers.committee.address);

    const [_, status] = await contract.getInitiative(0);
    expect(status).to.equal(1); // Approved

    const [, allocatedBudget] = await contract.getInitiativeBudgets(0);
    const allocatedClear = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      allocatedBudget,
      contractAddress,
      signers.proposer,
    );
    expect(allocatedClear).to.equal(200n);

    await expect(contract.connect(signers.proposer).requestDecryption(0))
      .to.emit(contract, "DecryptionRequested")
      .withArgs(0, signers.proposer.address);

    await contract
      .connect(signers.committee)
      .authorizeDetailHandle(0, signers.committee.address);

    const detailHandle = await contract.getDetailHandle(0);
    const detailClear = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      detailHandle,
      contractAddress,
      signers.committee,
    );
    expect(detailClear).to.equal(9999n);

    const [, totalAllocated] = await contract.getGlobalTotals();
    const totalAllocatedClear = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      totalAllocated,
      contractAddress,
      signers.proposer,
    );
    expect(totalAllocatedClear).to.equal(200n);
  });
});


