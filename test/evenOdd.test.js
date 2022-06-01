const { ethers } = require("hardhat");
const { expect } = require("chai");

const ONE_ETHER    = "1000000000000000000";
const TWO_ETHERS   = "2000000000000000000";
const THREE_ETHERS = "3000000000000000000";
const FOUR_ETHERS  = "4000000000000000000";
const MORE_ETHERS  = "1999000000000000000000";

describe("Testcase of EvenOdd: ", () => {
  beforeEach(async () => {
    const accounts = await ethers.getSigners();
    owner = accounts[0];
    user1 = accounts[1];
    user2 = accounts[2];

    const Token = await ethers.getContractFactory("TokenCash");
    token = await Token.deploy("Cash Coin", "CASH");

    const Ticket = await ethers.getContractFactory("MasterCard");
    ticket = await Ticket.deploy("MasterCard", "MTCASH");

    const EvenOdd = await ethers.getContractFactory("EvenOdd");
    evenOdd = await EvenOdd.deploy(owner.address, ticket.address, token.address);
  });

  describe("Deployment", async () => {
    it("should be deployed with correct token and ticket", async () => {
      expect(await evenOdd._cash()).to.equal(token.address);
      expect(await evenOdd._ticket()).to.equal(ticket.address);
    });
  });

  describe("1 Function: transfer", () => {
    it("should show message: ... when not owner call transfer", async () => {
      await token.mint(owner.address, TWO_ETHERS);
      await token.approve(evenOdd.address, MORE_ETHERS);
      await expect(
        evenOdd.connect(user1).transfer(THREE_ETHERS)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should transfer success when owner call transfer", async () => {
      expect(await evenOdd.getDealerBalance()).to.equal(0);

      await token.mint(owner.address, TWO_ETHERS);
      await token.approve(evenOdd.address, MORE_ETHERS);
      await evenOdd.connect(owner).transfer(THREE_ETHERS);

      expect(await evenOdd.getDealerBalance()).to.equal(THREE_ETHERS);
    });
  });

  describe("2 Function: withdraw", () => {
    it("should return fail if amount withdraw equal to zero", async () => {
      await expect(evenOdd.withdraw(0)).to.be.revertedWith("Amount must be not zero");
    });

    it("shoulld return fail when amount exceeds balance", async () => {
      await token.mint(owner.address, TWO_ETHERS);
      const tx = await token.approve(evenOdd.address, MORE_ETHERS);
      await tx.wait();
      await evenOdd.transfer(THREE_ETHERS);
      await expect(evenOdd.withdraw(FOUR_ETHERS)).to.be.revertedWith("Amount exceeds balance");
    });

    it("should withdraw success when 0 < amount < onwer transfer", async () => {
      expect(await token.balanceOf(owner.address)).to.equal(MORE_ETHERS);
      await token.mint(owner.address, TWO_ETHERS);

      await token.approve(evenOdd.address, MORE_ETHERS);
      await evenOdd.transfer(THREE_ETHERS);

      expect(await token.balanceOf(evenOdd.address)).to.equal(THREE_ETHERS);

      await evenOdd.connect(owner).withdraw(TWO_ETHERS);
      expect(await token.balanceOf(evenOdd.address)).to.equal(ONE_ETHER);
    });
  });

  describe("3 Function: bet", () => {
    it("should return fail when sender not have ticket", async () => {
      await token.mint(owner.address, TWO_ETHERS);
      await token.approve(evenOdd.address, MORE_ETHERS);
      await evenOdd.transfer(MORE_ETHERS);
      //step 2: mint token
      await token.mint(user1.address, ONE_ETHER);
      //step 3: player bet
      await token.connect(user1).approve(evenOdd.address, MORE_ETHERS);
      await expect(evenOdd.connect(user1).bet(true, ONE_ETHER)).to.be.revertedWith("You need to buy a ticket to play this game");
    });

    it("should return fail when sender have a ticket expired", async () => {
      await token.mint(owner.address, TWO_ETHERS);
      await token.approve(evenOdd.address, MORE_ETHERS);
      await evenOdd.transfer(MORE_ETHERS);
      //step 2: mint token and mint ticket for user1
      await token.mint(user1.address, ONE_ETHER);
      await ticket.mint(user1.address);
      // adjust time
      const thirtyDays = 30 * 24 * 60 * 60;
      await ethers.provider.send("evm_increaseTime", [thirtyDays + 1999]);
      await ethers.provider.send("evm_mine");
      //step 3: player bet
      await token.connect(user1).approve(evenOdd.address, MORE_ETHERS);
      //check
      await expect(evenOdd.connect(user1).bet(true, ONE_ETHER)).to.be.revertedWith("Your ticket is expired");
    });

    it("should return fail when sender has ever bet before in same rollId", async () => {
      await token.mint(owner.address, TWO_ETHERS);
      await token.approve(evenOdd.address, MORE_ETHERS);
      await evenOdd.transfer(MORE_ETHERS);
      //step 2: mint token and mint ticket for user1
      await token.mint(user1.address, ONE_ETHER);
      await ticket.mint(user1.address);
      //step 3: player bet
      await token.connect(user1).approve(evenOdd.address, MORE_ETHERS);
      // try {
      await evenOdd.connect(user1).bet(true, ONE_ETHER);
      //check
      await expect(evenOdd.connect(user1).bet(true, ONE_ETHER)).to.be.revertedWith("Already bet");
    });

    it("should return fail when sender bet amount = 0", async () => {
      await token.mint(owner.address, TWO_ETHERS);
      await token.approve(evenOdd.address, MORE_ETHERS);
      await evenOdd.transfer(MORE_ETHERS);
      //step 2: mint token and mint ticket for user1
      await token.mint(user1.address, ONE_ETHER);
      await ticket.mint(user1.address);
      //step 3: player bet
      await token.connect(user1).approve(evenOdd.address, MORE_ETHERS);
      //check
      await expect(evenOdd.connect(user1).bet(true, 0)).to.be.revertedWith("minimum amount needed to play the game");
    });

    it("should return fail when total bet amount exceeds dealer balance", async () => {
      await token.mint(owner.address, TWO_ETHERS);
      await token.approve(evenOdd.address, MORE_ETHERS);
      await evenOdd.transfer(TWO_ETHERS);
      //step 2: mint token and mint ticket for user1
      await token.mint(user1.address, ONE_ETHER);
      await ticket.mint(user1.address);
      await token.mint(user2.address, THREE_ETHERS);
      await ticket.mint(user2.address);
      //step 3: player bet
      await token.connect(user1).approve(evenOdd.address, MORE_ETHERS);
      await token.connect(user2).approve(evenOdd.address, MORE_ETHERS);
      await evenOdd.connect(user1).bet(true, ONE_ETHER);
      //check
      await expect(evenOdd.connect(user2).bet(true, THREE_ETHERS)).to.be.revertedWith("total bet amount exceeds dealer balance");
    });

    it("should return success when player transfer cash", async () => {
      await token.mint(owner.address, TWO_ETHERS);
      await token.approve(evenOdd.address, MORE_ETHERS);
      await evenOdd.transfer(MORE_ETHERS);
      //step 2: mint token and mint ticket for user1
      await token.mint(user1.address, ONE_ETHER);
      await ticket.mint(user1.address);
      await token.mint(user2.address, THREE_ETHERS);
      await ticket.mint(user2.address);
      //step 3: player bet
      await token.connect(user1).approve(evenOdd.address, MORE_ETHERS);
      await token.connect(user2).approve(evenOdd.address, MORE_ETHERS);
      //step 4: bet
      await evenOdd.connect(user1).bet(true, ONE_ETHER);
      await evenOdd.connect(user2).bet(true, THREE_ETHERS);
      //check
      expect(await evenOdd.totalBetAmountPerRoll()).to.equal(FOUR_ETHERS);
    });
  });

  describe("4 Function: rollDice", () => {
    it("should show message: ... when not owner call transfer", async () => {
      await token.mint(owner.address, TWO_ETHERS);
      await token.approve(evenOdd.address, MORE_ETHERS);
      await evenOdd.transfer(MORE_ETHERS);
      //step 2: mint token and mint ticket for user1
      await token.mint(user1.address, ONE_ETHER);
      await ticket.mint(user1.address);
      //step 3: player bet
      await token.connect(user1).approve(evenOdd.address, MORE_ETHERS);
      await evenOdd.connect(user1).bet(true, ONE_ETHER);
      //step 4: roll dice
      //check
      await expect(evenOdd.connect(user1).rollDice()).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should return fail when no one place bet", async () => {
      await token.mint(owner.address, TWO_ETHERS);
      await token.approve(evenOdd.address, MORE_ETHERS);
      await evenOdd.transfer(MORE_ETHERS);
      //step 4: roll dice
      //check
      await expect(evenOdd.rollDice()).to.be.revertedWith("No one place bet");
    });

    it("should roll success when owner call", async () => {
      await token.mint(owner.address, TWO_ETHERS);
      await token.approve(evenOdd.address, MORE_ETHERS);
      await evenOdd.transfer(MORE_ETHERS);
      //step 2: mint token and mint ticket for user1
      await token.mint(user1.address, ONE_ETHER);
      await ticket.mint(user1.address);
      //step 3: player bet
      await token.connect(user1).approve(evenOdd.address, MORE_ETHERS);
      await evenOdd.connect(user1).bet(true, ONE_ETHER);
      //step 4: roll dice
      await evenOdd.rollDice();
      //check
      expect(await evenOdd.rollId()).to.equal(2);
    });
  });

  describe("5 Function: isAlreadyBet", () => {
    it("should return false when player has never bet in this rollId", async () => {
      await token.mint(owner.address, TWO_ETHERS);
      const tx = await token.approve(evenOdd.address, MORE_ETHERS);
      await tx.wait();
      await evenOdd.transfer(MORE_ETHERS);
      //step 2: mint token and mint ticket for user1
      await token.mint(user1.address, ONE_ETHER);
      await ticket.mint(user1.address);
      //check
      expect(await evenOdd.isAlreadyBet(user1.address)).to.equal(false);
    });

    it("should return true when player has ever bet in this rollId", async () => {
      await token.mint(owner.address, TWO_ETHERS);
      await token.approve(evenOdd.address, MORE_ETHERS);
      await evenOdd.transfer(MORE_ETHERS);
      //step 2: mint token and mint ticket for user1
      await token.mint(user1.address, ONE_ETHER);
      await ticket.mint(user1.address);
      //step 3: player bet
      await token.connect(user1).approve(evenOdd.address, MORE_ETHERS);
      await evenOdd.connect(user1).bet(true, ONE_ETHER);
      //check
      expect(await evenOdd.isAlreadyBet(user1.address)).to.equal(true);
    });
  });

  describe("6 Function: getDealerBalance", () => {
    it("should return a mount of cash that onwer allow player bet", async () => {
      await token.mint(owner.address, TWO_ETHERS);
      await token.approve(evenOdd.address, MORE_ETHERS);
      await evenOdd.transfer(MORE_ETHERS);
      expect(await evenOdd.getDealerBalance()).to.equal(MORE_ETHERS);
    });
  });

  describe("7 Function: getBetAmountOf", () => {
    it("should return a number of cash that player bet", async () => {
      await token.mint(owner.address, TWO_ETHERS);
      await token.approve(evenOdd.address, MORE_ETHERS);
      await evenOdd.transfer(MORE_ETHERS);
      //step 2: mint token and mint ticket for user1
      await token.mint(user1.address, ONE_ETHER);
      await ticket.mint(user1.address);

      await token.mint(user2.address, TWO_ETHERS);
      await ticket.mint(user2.address);
      //step 3: player bet
      await token.connect(user1).approve(evenOdd.address, MORE_ETHERS);
      await evenOdd.connect(user1).bet(true, ONE_ETHER);

      await token.connect(user2).approve(evenOdd.address, MORE_ETHERS);
      await evenOdd.connect(user2).bet(true, TWO_ETHERS);
      //check
      expect(await evenOdd.getBetAmountOf(user1.address)).to.equal(ONE_ETHER);
      expect(await evenOdd.getBetAmountOf(user2.address)).to.equal(TWO_ETHERS);
    });
  });

  describe("8 Function: getPlayerInfo", () => {
    it("should return information of player", async () => {
      //step 1: mint token for owner and owner transfer
      await token.mint(owner.address, TWO_ETHERS);
      await token.approve(evenOdd.address, MORE_ETHERS);
      await evenOdd.transfer(THREE_ETHERS);
      //step 2: mint token and mint ticket for user1
      await token.mint(user1.address, ONE_ETHER);
      await ticket.mint(user1.address);

      await token.mint(user2.address, ONE_ETHER);
      await ticket.mint(user2.address);
      //step 3: player bet
      await token.connect(user1).approve(evenOdd.address, MORE_ETHERS);
      await evenOdd.connect(user1).bet(true, ONE_ETHER);
      //check
      const info = await evenOdd.getPlayerInfo(user1.address);
      expect(info.isEven).to.equal(true);
      expect(info.betAmount).to.equal(ONE_ETHER);
    });
  });

  describe("9 Function: resetBoard", () => {
    it("should reset all initial data when start new roll", async () => {
      //step 1: mint token for owner and owner transfer
      await token.mint(owner.address, TWO_ETHERS);
      await token.approve(evenOdd.address, MORE_ETHERS);
      await evenOdd.transfer(TWO_ETHERS);
      //step 2: mint token and mint ticket for user1
      await token.mint(user1.address, ONE_ETHER);
      await ticket.mint(user1.address);
      //step 3: player bet
      await token.connect(user1).approve(evenOdd.address, MORE_ETHERS);
      await evenOdd.connect(user1).bet(true, ONE_ETHER);
      //step 4: owner roll dice
      await evenOdd.rollDice();
      //check
      expect(await evenOdd.rollId()).to.equal(2);
      expect(await evenOdd.totalBetAmountPerRoll()).to.equal(0);
    });
  });
});
