const { ethers } = require("hardhat");
const { expect } = require("chai");

const ipfsMasterCard = "https://ipfs/.json";

describe("Testcase of NFT MasterCard: ", () => {
  beforeEach(async () => {
    const accounts = await ethers.getSigners();
    owner = accounts[0];
    user1 = accounts[1];
    user2 = accounts[2];
    const Ticket = await ethers.getContractFactory("MasterCard");
    ticket = await Ticket.deploy("MasterCard", "MTCASH");
  });

  describe("Deployment", async () => {
    it("should be deployed with correct name and symbol", async () => {
      expect(await ticket.name()).to.equal("MasterCard");
      expect(await ticket.symbol()).to.equal("MTCASH");
    });

    it("should balance of owner equal to total supply of ticket", async () => {
      const ownerBalance = await ticket.balanceOf(owner.address);
      expect(await ticket.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe("Function: _baseURI", async () => {
    it("should return hollow string when just init ticket", async () => {
      const baseURI = await ticket.baseUri();
      expect(baseURI).to.equal("");
    });
  });

  describe("Function: setBaseURI", async () => {
    it("should be set base uri success by only owner", async () => {
      const tx = await ticket.setBaseURI(ipfsMasterCard);
      await tx.wait();
      const baseURI = await ticket.baseUri();
      expect(baseURI).to.equal(ipfsMasterCard);
    });
  });

  describe("Function: extend", async () => {
    it("should show message: 'You not have a ticket !' whem sender not have a ticket", async () => {
      await expect(ticket.extend(user2.address)).to.be.revertedWith(
        "You not have a ticket !"
      );
    });
    it("should show message: 'This ticket is not expired !' whem sender have a ticket expired", async () => {
      const txm = await ticket.mint(user1.address);
      await txm.wait();
      await expect(ticket.extend(user1.address)).to.be.revertedWith(
        "This ticket is not expired !"
      );
    });
    it("should extend success when sender have a ticket expired", async () => {
      const thirtyDays = 30 * 24 * 60 * 60;
      const txm = await ticket.mint(user1.address);
      await txm.wait();
      await ethers.provider.send("evm_increaseTime", [thirtyDays + 1999]);
      await ethers.provider.send("evm_mine");
      const tx = await ticket.extend(user1.address);
      await tx.wait();
      const timestamp = (await ethers.provider.getBlock(tx.blockNumber))
        .timestamp;
      const newDueDate = await ticket.getDueDate(1);
      expect(newDueDate.toString()).to.equal(
        (timestamp + thirtyDays).toString()
      );
    });
  });

  describe("Function: mint", async () => {
    it("should show message: 'You have a ticket !' whem sender have a ticket", async () => {
      const txm = await ticket.mint(user1.address);
      await txm.wait();
      await expect(ticket.mint(user1.address)).to.be.revertedWith(
        "You have a ticket !"
      );
    });
    it("should mint success when sender not have a ticket", async () => {
      const tx = await ticket.mint(user1.address);
      await tx.wait();
      const totalSupply = await ticket.totalSupply();
      expect(await ticket.balanceOf(user1.address)).to.equal(totalSupply);
    });
  });

  describe("Function: getDueDate", async () => {
    it("should return correct value expired day", async () => {
      const thirtyDays = 30 * 24 * 60 * 60;
      const tx = await ticket.mint(user1.address);
      await tx.wait();
      const timestamp = (await ethers.provider.getBlock(tx.blockNumber))
        .timestamp;
      const dueDate = await ticket.getDueDate(1);
      expect(dueDate.toString()).to.equal((timestamp + thirtyDays).toString());
    });
  });
});
