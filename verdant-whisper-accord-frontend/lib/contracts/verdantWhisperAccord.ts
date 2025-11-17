import { Contract, ethers } from "ethers";
import { VerdantWhisperAccordABI } from "../../abi/VerdantWhisperAccordABI";
import { VerdantWhisperAccordAddresses } from "../../abi/VerdantWhisperAccordAddresses";

export type InitiativeStatus = "Pending" | "Approved" | "Rejected" | "Unknown";

const STATUS_LABELS: InitiativeStatus[] = ["Pending", "Approved", "Rejected", "Unknown"];

export const resolveAccordAddress = (chainId?: number): `0x${string}` | undefined => {
  if (!chainId) return undefined;
  const lookupOrder: Array<keyof typeof VerdantWhisperAccordAddresses> = [
    chainId.toString() as keyof typeof VerdantWhisperAccordAddresses,
    chainId === 1337 ? ("31337" as keyof typeof VerdantWhisperAccordAddresses)
      : (chainId === 31337 ? ("1337" as keyof typeof VerdantWhisperAccordAddresses) : undefined),
    "localhost",
  ].filter(Boolean) as Array<keyof typeof VerdantWhisperAccordAddresses>;

  let entry;
  for (const key of lookupOrder) {
    entry = VerdantWhisperAccordAddresses[key];
    if (entry) break;
  }
  if (!entry) return undefined;
  if (!("address" in entry) || !entry.address || entry.address === ethers.ZeroAddress) {
    return undefined;
  }
  return entry.address as `0x${string}`;
};

export const createAccordContract = (
  runner: ethers.ContractRunner | ethers.Signer,
  chainId?: number,
): Contract | undefined => {
  const address = resolveAccordAddress(chainId);
  if (!address) return undefined;
  return new Contract(address, VerdantWhisperAccordABI, runner);
};

export const toInitiativeStatus = (raw: number): InitiativeStatus => {
  if (raw === 0) return "Pending";
  if (raw === 1) return "Approved";
  if (raw === 2) return "Rejected";
  return "Unknown";
};

