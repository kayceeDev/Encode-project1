import { expect } from "chai";
import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import { Ballot } from "../../typechain";

const PROPOSALS = ["Proposal 1", "Proposal 2", "Proposal 3"];

function convertStringArrayToBytes32(array: string[]) {
  const bytes32Array = [];
  for (let index = 0; index < array.length; index++) {
    bytes32Array.push(ethers.utils.formatBytes32String(array[index]));
  }
  return bytes32Array;
}

function convertBytes32ToString(str: string) {
  return ethers.utils.parseBytes32String(str);
}

async function giveRightToVote(ballotContract: Ballot, voterAddress: any) {
  const tx = await ballotContract.giveRightToVote(voterAddress);
  await tx.wait();
}

async function vote(ballotContract: Ballot, proposal: number) {
  const tx = await ballotContract.vote(proposal);
  await tx.wait();
}

async function delegate(ballotContract: Ballot, to: any) {
  const tx = await ballotContract.delegate(to);
  await tx.wait();
}
describe("Ballot", function () {
  let ballotContract: Ballot;
  let accounts: any[];

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    const ballotFactory = await ethers.getContractFactory("Ballot");
    ballotContract = await ballotFactory.deploy(
      convertStringArrayToBytes32(PROPOSALS)
    );
    await ballotContract.deployed();
  });

  describe("when the contract is deployed", function () {
    it("has the provided proposals", async function () {
      for (let index = 0; index < PROPOSALS.length; index++) {
        const proposal = await ballotContract.proposals(index);
        expect(ethers.utils.parseBytes32String(proposal.name)).to.eq(
          PROPOSALS[index]
        );
      }
    });

    it("has zero votes for all proposals", async function () {
      for (let index = 0; index < PROPOSALS.length; index++) {
        const proposal = await ballotContract.proposals(index);
        expect(proposal.voteCount.toNumber()).to.eq(0);
      }
    });

    it("sets the deployer address as chairperson", async function () {
      const chairperson = await ballotContract.chairperson();
      expect(chairperson).to.eq(accounts[0].address);
    });

    it("sets the voting weight for the chairperson as 1", async function () {
      const chairpersonVoter = await ballotContract.voters(accounts[0].address);
      expect(chairpersonVoter.weight.toNumber()).to.eq(1);
    });
  });

  describe("when the chairperson interacts with the giveRightToVote function in the contract", function () {
    it("gives right to vote for another address", async function () {
      const voterAddress = accounts[1].address;
      const tx = await ballotContract.giveRightToVote(voterAddress);
      await tx.wait();
      const voter = await ballotContract.voters(voterAddress);
      expect(voter.weight.toNumber()).to.eq(1);
    });

    it("can not give right to vote for someone that has voted", async function () {
      const voterAddress = accounts[1].address;
      await giveRightToVote(ballotContract, voterAddress);
      await ballotContract.connect(accounts[1]).vote(0);
      await expect(
        giveRightToVote(ballotContract, voterAddress)
      ).to.be.revertedWith("The voter already voted.");
    });

    it("can not give right to vote for someone that already has voting rights", async function () {
      const voterAddress = accounts[1].address;
      await giveRightToVote(ballotContract, voterAddress);
      await expect(
        giveRightToVote(ballotContract, voterAddress)
      ).to.be.revertedWith("");
    });
  });

  describe("when the voter interact with the vote function in the contract", function () {
    // TODO
    it("Voter with voting right can vote", async function () {
      const chairpersonVoter = accounts[0].address;
      await vote(ballotContract, 0);
      const voter = await ballotContract.voters(chairpersonVoter);
      expect(voter.voted).eq(true);
    });

    it("Voter without voting rights can't vote", async function () {
      const proposal: number = 0;
      await vote(ballotContract, proposal);
      const voter = await ballotContract.voters(accounts[0].address);
      expect(voter.vote.toNumber()).eq(proposal);
    });

    it("Already voted can't vote", async function () {
      await vote(ballotContract, 0);
      await expect(vote(ballotContract, 0)).to.be.revertedWith("Already voted");
    });
  });

  describe("when the voter interact with the delegate function in the contract", function () {
    // TODO
    it("An eligible voter can delegate", async function () {
      const fromAddress = accounts[0].address;
      await ballotContract.giveRightToVote(accounts[1].address);
      await delegate(ballotContract, accounts[1].address);
      const sender = await ballotContract.voters(fromAddress);
      expect(sender.voted).eq(true);
    });

    it("A voter can't self delegate", async function () {
      const fromAddress = accounts[0].address;
      await expect(delegate(ballotContract, fromAddress)).to.be.revertedWith(
        "Self-delegation is disallowed."
      );
    });

    it("A voter who already voted can't delegate", async function () {
      const toAddress = accounts[1].address;
      const propsalToVote = 1;
      await ballotContract.vote(propsalToVote);
      await expect(delegate(ballotContract, toAddress)).to.be.revertedWith(
        "You already voted."
      );
    });

    it("Voters cannot delegate to wallets that cannot vote", async function () {
      const toAddress = accounts[1].address;
      await expect(delegate(ballotContract, toAddress)).to.be.revertedWith("");
    });
  });

  describe("when the an attacker interact with the giveRightToVote function in the contract", function () {
    // TODO
    it("A attacker doesn't have the chairperson right", async function () {
      await expect(
        ballotContract.connect(accounts[1]).giveRightToVote(accounts[2].address)
      ).to.be.revertedWith("Only chairperson can give right to vote.");
    });
  });

  describe("when the an attacker interact with the vote function in the contract", function () {
    // TODO
    it("An attacker doesn't have the chairperson right can't vote", async function () {
      await expect(
        ballotContract.connect(accounts[1]).vote(0)
      ).to.be.revertedWith("Has no right to vote");
    });
  });

  describe("when the an attacker interact with the delegate function in the contract", function () {
    // TODO
    it("Attacker without chairperson right can't delegate", async function () {
      await expect(
        ballotContract.connect(accounts[1]).delegate(accounts[2].address)
      ).to.be.revertedWith("");
    });
  });

  describe("when someone interact with the winningProposal function before any votes are cast", function () {
    // TODO
    it("A voter interact with winningPropsal before votes are cast", async function () {
      const expected = 0;
      const actual = await ballotContract.winningProposal();
      expect(actual).eq(expected);
    });
  });

  describe("when someone interact with the winningProposal function after one vote is cast for the first proposal", function () {
    // TODO
    it("First vote is cast for the first proposal", async function () {
      const expected = 0;
      await ballotContract.vote(0);
      const actual = await ballotContract.winningProposal();
      expect(actual).eq(expected);
    });
  });

  describe("when someone interact with the winnerName function before any votes are cast", function () {
    // TODO
    it(" Someone interact with the winnerName function before any votes are cast", async function () {
      const expected = "Proposal 1";
      const actual = await ballotContract.winnerName();
      expect(convertBytes32ToString(actual)).eq(expected);
    });
  });

  describe("when someone interact with the winnerName function after one vote is cast for the first proposal", function () {
    // TODO
    it("when someone interact with the winnerName function after one vote is cast for the first proposal", async function () {
      const expected = "Proposal 1";
      await ballotContract.vote(0);
      const actual = await ballotContract.winnerName();
      expect(convertBytes32ToString(actual)).eq(expected);
    });
  });

  describe("when someone interact with the winningProposal function and winnerName after 5 random votes are cast for the proposals", function () {
    // TODO
    it("is not implemented", async function () {
      const expected = "Proposal 3";
      const proposalIndexes = [0, 1, 2, 2, 2, 0];
      for (
        let account: number = 1;
        account < accounts.slice(1, 6).length;
        account++
      ) {
        await ballotContract.giveRightToVote(accounts[account].address);
        await ballotContract
          .connect(accounts[account])
          .vote(proposalIndexes[account]);
      }
      const actual = await ballotContract.winnerName();
      expect(convertBytes32ToString(actual)).eq(expected);
    });
  });
});

// function beforeEach(arg0: () => Promise<void>) {
//   throw new Error("Function not implemented.");
// }
