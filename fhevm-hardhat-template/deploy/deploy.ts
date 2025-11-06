import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedAccord = await deploy("VerdantWhisperAccord", {
    from: deployer,
    log: true,
  });

  console.log(`VerdantWhisperAccord contract: `, deployedAccord.address);
};
export default func;
func.id = "deploy_verdant_whisper_accord"; // id required to prevent reexecution
func.tags = ["VerdantWhisperAccord"];
