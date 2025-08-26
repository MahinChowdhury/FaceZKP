// ============================
// Imports & Setup (ES Module syntax)
// ============================
import crypto from "crypto";
import { ethers, keccak256, toUtf8Bytes } from "ethers";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// CSV file path
const csvFilePath = path.resolve("./gas_benchmarks.csv");
// Write CSV headers
fs.writeFileSync(csvFilePath, "Registered Users,Gas Used (units),Gas Cost (Gwei),Gas Cost (USD)\n");
dotenv.config();

// ============================
// Config & Blockchain Setup
// ============================
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const CONTRACT_ABI = [
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "nidHash",
				"type": "bytes32"
			},
			{
				"indexed": false,
				"internalType": "bytes32",
				"name": "Sx",
				"type": "bytes32"
			},
			{
				"indexed": false,
				"internalType": "bytes32",
				"name": "Sy",
				"type": "bytes32"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "salt",
				"type": "string"
			}
		],
		"name": "Registered",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "getAllRegistered",
		"outputs": [
			{
				"internalType": "bytes32[]",
				"name": "",
				"type": "bytes32[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "index",
				"type": "uint256"
			}
		],
		"name": "getRegisteredAt",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getRegisteredCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "nidHash",
				"type": "bytes32"
			}
		],
		"name": "getUserData",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "Sx",
				"type": "bytes32"
			},
			{
				"internalType": "bytes32",
				"name": "Sy",
				"type": "bytes32"
			},
			{
				"internalType": "string",
				"name": "salt",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "nidHash",
				"type": "bytes32"
			},
			{
				"internalType": "bytes32",
				"name": "Sx",
				"type": "bytes32"
			},
			{
				"internalType": "bytes32",
				"name": "Sy",
				"type": "bytes32"
			},
			{
				"internalType": "string",
				"name": "salt",
				"type": "string"
			}
		],
		"name": "register",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];


const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);


// Replace with current ETH price
const ETH_PRICE_USD = 4710;

// Helper to generate dummy user
function generateDummyUser() {
    return {
        nidHash: "0x" + crypto.randomBytes(32).toString("hex"),
        Sx: crypto.randomBytes(32).toString("hex"),
        Sy: crypto.randomBytes(32).toString("hex"),
        salt: crypto.randomBytes(16).toString("hex")
    };
}

async function registerUser(user) {
    const tx = await contract.register(user.nidHash, `0x${user.Sx}`, `0x${user.Sy}`, user.salt);
    const receipt = await tx.wait();

    const gasUsed = receipt.gasUsed; // BigInt

    // Get current gas price
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice; // BigInt

    const gasCostWei = gasUsed * gasPrice;
    const gasCostGwei = Number(gasCostWei) / 1e9;

    
    const gasCostUSD = Number(gasCostWei) / 1e18 * ETH_PRICE_USD;

    // console.log(`Gas Used: ${gasUsed} units`);
    // console.log(`Gas Cost: ${gasCostGwei.toFixed(2)} Gwei`);
    // console.log(`Gas Cost USD: $${gasCostUSD.toFixed(2)}`);

    return {
        gasUsed : gasUsed,
        gasCostGwei : gasCostGwei.toFixed(2),
        gasCostUSD : gasCostUSD.toFixed(2)
    }
}

async function registerMultipleUsersCSV(userCounts = [1, 5, 10]) {
    for (let count of userCounts) {
        let totalGasUsed = 0n; // BigInt
        let totalGasCostWei = 0n;

        for (let i = 0; i < count; i++) {
            const dummyUser = generateDummyUser();
            const result = await registerUser(dummyUser);

            totalGasUsed += result.gasUsed; // If result.gasUsed is BigInt
            totalGasCostWei += BigInt(Math.round(Number(result.gasCostUSD) * 1e18 / ETH_PRICE_USD)); // convert back to Wei for sum
        }

        const totalGasCostGwei = Number(totalGasCostWei) / 1e9;
        const totalGasCostUSD = Number(totalGasCostWei) / 1e18 * ETH_PRICE_USD;

        console.log(`${count},${totalGasUsed},${totalGasCostGwei.toFixed(2)},${totalGasCostUSD.toFixed(2)}`);

        //Append a line to the CSV
        const line = `${count},${totalGasUsed},${totalGasCostGwei.toFixed(2)},${totalGasCostUSD.toFixed(2)}\n`;
        fs.appendFileSync(csvFilePath, line);
    }

    console.log(`CSV file created at: ${csvFilePath}`);
}


//registerMultipleUsersCSV();