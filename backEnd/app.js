const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { ethers } = require('ethers');
require('dotenv').config();
const app = express();
const port = 3000;
const crypto = require('crypto');
const QRCode = require('qrcode');

app.use(cors());
app.use(express.json());

// multer to handle file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`)
  }
});

const PORT = process.env.PORT || 3000;
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
				"name": "faceHash",
				"type": "bytes32"
			}
		],
		"name": "Registered",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "nidHash",
				"type": "bytes32"
			}
		],
		"name": "getFaceHash",
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
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "nidHash",
				"type": "bytes32"
			},
			{
				"internalType": "bytes32",
				"name": "faceHash",
				"type": "bytes32"
			}
		],
		"name": "register",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];


//Ethereum setup
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

const upload = multer({ storage });

function hashNidNumber(nidNumber) {
  return ethers.keccak256(ethers.toUtf8Bytes(nidNumber.trim()));
}


// Registration endpoint
app.post('/api/v1/register', async (req, res) => {
  try {
    const { nidNumber, faceHash, password } = req.body;

    if (!nidNumber) return res.status(400).json({ ok: false, error: "nidNumber is required" });
    if (!faceHash) return res.status(400).json({ ok: false, error: "faceHash is required" });
    if (!password) return res.status(400).json({ ok: false, error: "password is required" });

    // 1) Hash NID
    const nidHash = hashNidNumber(nidNumber);

    // 2) Call contract
    const tx = await contract.register(nidHash, faceHash);
    const receipt = await tx.wait();

    // 3) Prepare QR code payload
    const qrData = JSON.stringify({
      txHash: receipt.hash,
      nidHash,
      faceHash
    });

    // 4) Encrypt QR data with password (AES-256-CBC)
    const key = crypto.createHash('sha256').update(password).digest(); // 32-byte key
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(qrData, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const encryptedPayload = JSON.stringify({
      iv: iv.toString('base64'),
      data: encrypted
    });

    // 5) Generate QR code as Buffer
    const qrBuffer = await QRCode.toBuffer(encryptedPayload);

    // 6) Send QR as downloadable PNG
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'attachment; filename=qr.png');
    res.send(qrBuffer);

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message || "Unknown error" });
  }
});


function decryptQR(encryptedPayload, password) {
  // Parse the JSON from QR code
  const { iv, data } = JSON.parse(encryptedPayload);

  // Recreate the key from password
  const key = crypto.createHash('sha256').update(password).digest(); // 32-byte key

  // Decode IV from base64
  const ivBuffer = Buffer.from(iv, 'base64');

  // Create decipher
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, ivBuffer);
  let decrypted = decipher.update(data, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  // Parse JSON
  const qrData = JSON.parse(decrypted);
  return qrData; // { txHash, nidHash, faceHash }
}



//Login
const fs = require('fs');
const Jimp = require('jimp');
const QrCode = require('qrcode-reader');

app.post('/v1/login', upload.single('qrCode'), async (req, res) => {
  try {
    const password = req.body.password;
    if (!password) return res.status(400).json({ ok: false, error: 'Password is required' });

    const qrFile = req.file;
    if (!qrFile) return res.status(400).json({ ok: false, error: 'QR code is required' });

    // 1) Read QR code from uploaded buffer
    const qrImage = await Jimp.read(qrFile.buffer);
    const qr = new QrCode();
    const encryptedPayload = await new Promise((resolve, reject) => {
      qr.callback = (err, value) => {
        if (err) reject(err);
        else resolve(value.result); // this is the encrypted JSON payload
      };
      qr.decode(qrImage.bitmap);
    });

    // 2) Decrypt payload
    const { iv, data } = JSON.parse(encryptedPayload);
    const key = crypto.createHash('sha256').update(password).digest();
    const ivBuffer = Buffer.from(iv, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, ivBuffer);
    let decrypted = decipher.update(data, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    const qrData = JSON.parse(decrypted); // { txHash, nidHash, faceHash }

    // 3) Return decrypted data
    res.json({
      ok: true,
      message: 'QR decrypted successfully',
      qrData
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message || 'Unknown error' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});