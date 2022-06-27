import { BytesLike, Contract, ethers } from "ethers";
import "dotenv/config";
import * as ballotJson from "../../artifacts/contracts/Ballot.sol/Ballot.json";
// eslint-disable-next-line node/no-missing-import
import { Ballot } from "../../typechain";

// This key is already public on Herong's Tutorial Examples - v1.03, by Dr. Herong Yang
// Do never expose your keys like this
const EXPOSED_KEY =
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
interface proposals {
  name: string; // short name (up to 32 bytes)
  voteCount: ethers.BigNumber;
}

function convertBytes32ToString(array: proposals) {
  let { name, voteCount } = array;
  name = ethers.utils.parseBytes32String(name);
  const convertedVoteCount: number = voteCount.toNumber();
  return { name, convertedVoteCount };
}
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
  console.log(
    `Attaching ballot contract interface to address ${ballotAddress}`
  );

  const ballotContract: Ballot = new Contract(
    ballotAddress,
    ballotJson.abi,
    signer
  ) as Ballot;
  let totalVotes = [];
  const proposalLength = await ballotContract.getProposalCount()
  for (let i = 0; i < proposalLength.toNumber(); i++) {
    const vote = await ballotContract.proposals(i);
    totalVotes.push(convertBytes32ToString(vote));
  }
  console.log(totalVotes);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
