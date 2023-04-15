require('dotenv').config();
const apiKey = process.env.apiKey;
const Web3 = require("web3");
const web3 = new Web3("https://mainnet.infura.io/v3/" + apiKey);

const ftokenABI = require("./abi/ftoken.json");
const comptrollerABI = require("./abi/comptroller.json");
const masteroracleABI = require("./abi/masteroracle.json");
const univ3oracleABI = require("./abi/univ3oracle.json");

const fETH = "0x6d8260fff752ba01bcf76c919e9e3d328971152e";
const fUSDC = "0x35036a4b7b012331f23f2945c08a5274ced38ac2";
const fTXJP = "0x0028A459D6705B30333E98d5bCb34DD1B21e2A89";

const comptroller = new web3.eth.Contract(comptrollerABI, "0xADE98A1a7cA184E886Ab4968e96DbCBEe48D9596");
const univ3Oracle = new web3.eth.Contract(univ3oracleABI, "0xC230CA97b4E88338B87C06E9f3a252710949A060");
const masterOracle = new web3.eth.Contract(masteroracleABI, "0x1887118e49e0f4a78bd71b792a49de03504a764d");

const fETHcontract = new web3.eth.Contract(ftokenABI, fETH);
const fUSDCcontract = new web3.eth.Contract(ftokenABI, fUSDC);
const fTXJPcontract = new web3.eth.Contract(ftokenABI, fTXJP);

async function getdata() {

    const getAllBorrowers = await comptroller.methods.getAllBorrowers().call();
    const priceUSDC = await masterOracle.methods.getUnderlyingPrice(fUSDC).call() / 10 ** 30;
    const priceTXJP = await univ3Oracle.methods.getUnderlyingPrice(fTXJP).call() / 10 ** 28;

    for (let i = 0; i < getAllBorrowers.length; i++) {
        const getAccountLiquidity = await comptroller.methods.getAccountLiquidity(getAllBorrowers[i]).call();
        const supplyETH = await fETHcontract.methods.balanceOfUnderlying(getAllBorrowers[i]).call() / 10 ** 18;
        const supplyUSDC = await fUSDCcontract.methods.balanceOfUnderlying(getAllBorrowers[i]).call() / 10 ** 6;
        const supplyTXJP = await fTXJPcontract.methods.balanceOfUnderlying(getAllBorrowers[i]).call() / 10 ** 8;
        const borrowETH = await fETHcontract.methods.borrowBalanceStored(getAllBorrowers[i]).call() / 10 ** 18 * -1;
        const borrowUSDC = await fUSDCcontract.methods.borrowBalanceStored(getAllBorrowers[i]).call() / 10 ** 6 * -1;
        const badDebt = (getAccountLiquidity['2'] !== '0') ? 1 : 0;
        const healthrate = (supplyETH + supplyUSDC * priceUSDC * 0.85 + supplyTXJP * priceTXJP * 0.85) / (borrowETH * -1 + borrowUSDC * -1 * priceUSDC);
        console.log(
            getAllBorrowers[i],
            'Error:', getAccountLiquidity['0'],
            'baddebt:', badDebt,
            'healthrate:', healthrate.toFixed(2),
            'TXJP:', supplyTXJP.toFixed(2),
            'ETH:', supplyETH.toFixed(2),
            'USDC:', supplyUSDC.toFixed(2),
            'ETH:', borrowETH.toFixed(2),
            'USDC:', borrowUSDC.toFixed(2)
        );
    };
}

getdata();
