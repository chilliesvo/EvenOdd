const contract = require('../contracts.json');
const hre = require('hardhat');

async function main() {
  console.log('=====================================================================================');
  console.log('VERIFY:');
  console.log('=====================================================================================');

  const [deployer] = await ethers.getSigners();

  try {
    await hre.run("verify:verify", {
      address: contract.Cash,
      constructorArguments: ["CASHCOIN", "CASH"]
    });
    await hre.run("verify:verify", {
      address: contract.Ticket,
      constructorArguments: ["Mastercard VIP", "MTCASH"]
    });
    await hre.run("verify:verify", {
      address: contract.EvenOdd,
      constructorArguments: [deployer.address, contract.Ticket, contract.Cash]
    });
  } catch (e) {
    console.log(e.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
