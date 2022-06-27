import { Contract, ethers } from "ethers";
import "dotenv/config";
import * as ballotJson from "../../artifacts/contracts/Ballot.sol/Ballot.json";
// eslint-disable-next-line node/no-missing-import
import { Ballot } from "../../typechain";

// This key is already public on Herong's Tutorial Examples - v1.03, by Dr. Herong Yang
// Do never expose your keys like this
const EXPOSED_KEY =
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

async function main() {
  const wallet =
    process.env.MNEMONIC && process.env.MNEMONIC.length > 0
      ? ethers.Wallet.fromMnemonic(process.env.MNEMONIC)
      : new ethers.Wallet(process.env.PRIVATE_KEY ?? EXPOSED_KEY);
  console.log(`Using address ${wallet.address}`);
  const provider = ethers.providers.getDefaultProvider("goerli");
  const signer = wallet.connect(provider);
  const balanceBN = await signer.getBalance();
  const balance = Number(ethers.utils.formatEther(balanceBN));
  console.log(`Wallet balance ${balance}`);
  if (balance < 0.01) {
    throw new Error("Not enough ether");
  }
  if (process.argv.length < 3) throw new Error("Ballot address missing");
  const ballotAddress = process.argv[2];
  if (process.argv.length < 4) throw new Error("proposal missing");
  const proposalToVote = process.argv[3];
  console.log(
    `Attaching ballot contract interface to address ${ballotAddress}`
  );

  const ballotContract: Ballot = new Contract(
    ballotAddress,
    ballotJson.abi,
    signer
  ) as Ballot;
  const chairpersonAddress = await ballotContract.chairperson();
  if (chairpersonAddress !== signer.address)
    throw new Error("Caller is not the chairperson for this contract");
  const chairPersonVoteStatus = await ballotContract.voters(chairpersonAddress);
  if (chairPersonVoteStatus.voted) {
    console.log("This user already voted");
    return;
  }
  const tx = await ballotContract.vote(proposalToVote);
  console.log(`Vote completed! for ${chairpersonAddress}`);
  console.log("Awaiting confirmations");
  await tx.wait();
  console.log(`Transaction completed. Hash: ${tx.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// Contract 0x87D9DBeD8af47F33D7B47b5c27d21D6E2883FA30
// Account 2 deployed contract 0xE54e5e482cA5dA6d4E73Aa3Ea46FaB041AF17c1C
// Account 1 0x5F7E13a6bD7A6394D96aaE6e45356aE729Ef644a :has vote right
// Account 3 0x59Bc318e11A769E61Da3886F00C04eE095c9906e :has vote right
// Account 4 0xE2B18559dF90Ee5c7A3Ac6Fe001986AFd0D26EaC  : has vote right
