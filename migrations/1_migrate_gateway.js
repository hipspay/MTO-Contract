const Gateway = artifacts.require('Gateway');
module.exports = function (deployer){
    deployer.deploy(Gateway, '0x490470e36CcE7928BD09a4afe81D6C5a023AC112');
}