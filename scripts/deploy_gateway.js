const { ethers } = require("hardhat");

// const utilityToken = '0x8EDB4F5bde63B076861589c53C21Ff2cF366E655';
const utilityToken = '0x7FD8dA6A666AB6aCaDC4824a167197A840d744A7';

async function main(){
    const Gateway = await ethers.getContractFactory('Gateway');
    console.log('/n', '----Deploment started for Gateway');
    const getway = await Gateway.deploy(utilityToken);
    await getway.deployed();
    console.log('Gateway contract deplyed at: '+ getway.address);
}
main()
.then(() => process.exit(0)
.catch((error) => {
  console.error(error);
  process.exit(1);
}));