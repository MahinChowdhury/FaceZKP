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
const fs = require('fs');
const { Jimp } = require('jimp');
const jsQR = require('jsqr');
const { keccak256, toUtf8Bytes } = require("ethers");
const axios = require('axios');
const FormData = require('form-data');

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

const upload = multer({ storage: multer.memoryStorage() });

function hashNidNumber(nidNumber) {
  return ethers.keccak256(ethers.toUtf8Bytes(nidNumber.trim()));
}


// Registration endpoint
app.post(
  '/api/v1/register',
  upload.single('faceImg'),
  async (req, res) => {
    try {
      const { nidNumber, password } = req.body;
      const faceFile = req.file;

      if (!nidNumber) return res.status(400).json({ ok: false, error: "nidNumber is required" });
      if (!faceFile) return res.status(400).json({ ok: false, error: "faceImg is required" });
      if (!password) return res.status(400).json({ ok: false, error: "password is required" });

      // 1) Hash NID
      const nidHash = hashNidNumber(nidNumber);

      // 2) Call Python /get-embedding API
      const FormData = require('form-data');
      const form = new FormData();
      form.append('file', faceFile.buffer, {
        filename: faceFile.originalname,
        contentType: faceFile.mimetype
      });

      const response = await axios.post(
        'http://localhost:8000/get-embedding', // Python API endpoint
        form,
        { headers: form.getHeaders() }
      );

      const face_reg = response.data.embedding_compressed;

      // Convert to hash (string) to store in blockchain
      const faceHash = keccak256(
        toUtf8Bytes(JSON.stringify(face_reg))
      );

      // 3) Call contract
      const tx = await contract.register(nidHash, faceHash);
      const receipt = await tx.wait();

      // 4) Prepare QR code payload
      const qrData = JSON.stringify({
        txHash: receipt.hash,
        nidHash,
        faceHash,
        face_reg
      });

      // 5) Encrypt QR data with password (AES-256-CBC)
      const key = crypto.createHash('sha256').update(password).digest(); // 32-byte key
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      let encrypted = cipher.update(qrData, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      const encryptedPayload = JSON.stringify({
        iv: iv.toString('base64'),
        data: encrypted
      });

      // 6) Generate QR code as Buffer
      const qrBuffer = await QRCode.toBuffer(encryptedPayload);

      // 7) Send QR as downloadable PNG
      res.setHeader('Content-Type', 'image/png');
      const random = crypto.randomBytes(10).toString('hex');
      res.setHeader('Content-Disposition', `attachment; filename=${random}qr.png`);
      res.send(qrBuffer);

    } catch (err) {
      console.error(err);
      res.status(500).json({ ok: false, error: err.message || "Unknown error" });
    } finally {
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting faceImg:', err);
        });
      }
    }
  }
);


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

app.post('/api/v1/login', 
  upload.fields([
    { name: 'qrCode', maxCount: 1 },
    { name: 'faceImg', maxCount: 1 }
  ]), 
  async (req, res) => {
    try {
      const qrFile = req.files?.qrCode?.[0];
      const faceFile = req.files?.faceImg?.[0];

      if (!qrFile) return res.status(400).json({ ok: false, error: 'QR code is required' });
      if (!faceFile) return res.status(400).json({ ok: false, error: 'Face image is required' });

      // 1) Process QR code
      const image = await Jimp.read(qrFile.buffer || qrFile.path);
      const { data, width, height } = image.bitmap;
      const code = jsQR(new Uint8ClampedArray(data), width, height);
      if (!code) return res.status(400).json({ ok: false, error: 'Unable to decode QR code' });

      const encryptedPayload = code.data;
      const { iv, data: encryptedData } = JSON.parse(encryptedPayload);
      const key = crypto.createHash('sha256').update(req.body.password).digest();
      const ivBuffer = Buffer.from(iv, 'base64');
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, ivBuffer);
      let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      const qrData = JSON.parse(decrypted);

      // 2) Send faceImg to Python API
      const formData = new FormData();
      formData.append('file', faceFile.buffer, {
        filename: faceFile.originalname, // must provide
        contentType: faceFile.mimetype
      });

      const response1 = await axios.post(
        'http://localhost:8000/get-embedding',
        formData,
        { headers: formData.getHeaders() } // VERY IMPORTANT
      );

      const face_login = response1.data.embedding_compressed;
      const face_reg = qrData.face_reg;

      const response2 = await axios.post(
        "http://localhost:8000/compare-embeddings",
        {
          face_login: face_login,
          face_reg: face_reg,
          threshold: 30  // optional
        }
      );

      const IsMatch = response2.data.match;

      res.json({
        ok: true,
        message: 'QR decrypted and face embedding retrieved',
        qrData,
        IsMatch
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ ok: false, error: err.message || 'Unknown error' });
    } finally {
      // Delete uploaded files if diskStorage
      [req.files?.qrCode?.[0], req.files?.faceImg?.[0]].forEach(file => {
        if (file && file.path) fs.unlink(file.path, () => {});
      });
    }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});