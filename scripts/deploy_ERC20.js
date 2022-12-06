const { ethers } = require("hardhat");
const initialSupply = '1000000000000000000000000000';
async function main(){
    const MTOToken = await ethers.getContractFactory('MTOToken');
    console.log('/n', '----Deploment started for erc20');
    const erc20 = await MTOToken.deploy(initialSupply);
    await erc20.deployed();
    console.log('erc20 contract deplyed at: '+ erc20.address);
}
main()
.then(() => process.exit(0)
.catch((error) => {
  console.error(error);
  process.exit(1);
}));