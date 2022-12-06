import "@nomiclabs/hardhat-waffle";
import "solidity-coverage";
import '@typechain/hardhat'

/** @type import('hardhat/config').HardhatUserConfig */
require("dotenv").config();
const { PRIVATE_KEY, POLYSCAN_API_KEY, ETHERSCAN_API_KEY, BSC_API_KEY } = process.env;
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          }},
      },
      {
        version: "0.8.1",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          }},
      },
    ],
  },
  networks: {
    hardhat: {},
    mumbai:{
      url: 'https://rpc-mumbai.maticvigil.com',
      accounts: [`0x${PRIVATE_KEY}`],
    },
    bsctestnet:{
      url: 'https://data-seed-prebsc-1-s1.binance.org:8545',
      accounts: [`0x${PRIVATE_KEY}`],
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/29f0131a60c4424bb401b8834c78585f`,
      accounts: [`0x${PRIVATE_KEY}`],
    },
    goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/iN-PGlLtC7flU86i-tx2WaGkp3Nz-J2_`,
      accounts: [`0x${PRIVATE_KEY}`],
    }
   },
   etherscan: {
    apiKey: {
      rinkeby: ETHERSCAN_API_KEY,
      polygonMumbai: POLYSCAN_API_KEY,
      goerli:ETHERSCAN_API_KEY,
      bscTestnet:BSC_API_KEY
    }
  }
};
