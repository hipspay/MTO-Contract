const Order = artifacts.require('Order');

module.exports = function(deployer) {
    deployer.deploy(Order);
}