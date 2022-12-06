const { ethers } = require("hardhat");
async function main(){
    const order = await ethers.getContractFactory('Order');
    console.log('/n', '----Deploment started for Order');
    const getway = await order.deploy();
    await order.deployed();
    console.log('Order contract deplyed at: '+ order.address);
}
main()
.then(() => process.exit(0)
.catch((error) => {
  console.error(error);
  process.exit(1);
}));