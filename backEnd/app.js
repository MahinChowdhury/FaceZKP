// ============================
// Imports & Setup
// ============================
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const QRCode = require("qrcode");
const Jimp = require("jimp");
const jsQR = require("jsqr");
const axios = require("axios");
const FormData = require("form-data");
const { ethers, keccak256, toUtf8Bytes } = require("ethers");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

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

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

// ============================
// Middleware
// ============================
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// ============================
// Utility Functions
// ============================

// Hash a NID string
function hashNidNumber(nidNumber) {
  return keccak256(toUtf8Bytes(nidNumber.trim()));
}

// Encrypt JSON payload with AES-256-CBC
function encryptPayload(payload, password) {
  const key = crypto.createHash("sha256").update(password).digest();
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(JSON.stringify(payload), "utf8", "base64");
  encrypted += cipher.final("base64");

  return {
    iv: iv.toString("base64"),
    data: encrypted,
  };
}

// Decrypt payload from AES-256-CBC
function decryptPayload(encryptedPayload, password) {
  const { iv, data } = JSON.parse(encryptedPayload);
  const key = crypto.createHash("sha256").update(password).digest();
  const ivBuffer = Buffer.from(iv, "base64");

  const decipher = crypto.createDecipheriv("aes-256-cbc", key, ivBuffer);
  let decrypted = decipher.update(data, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return JSON.parse(decrypted);
}

// Call Python API to get face embedding
async function getFaceEmbedding(file) {
  const form = new FormData();
  form.append("file", file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype,
  });

  const response = await axios.post("http://localhost:8000/get-embedding", form, {
    headers: form.getHeaders(),
  });

  return response.data.embedding_compressed;
}

// Compare embeddings via Python API
async function compareEmbeddings(faceLogin, faceReg, threshold = 30) {
  const response = await axios.post("http://localhost:8000/compare-embeddings", {
    face_login: faceLogin,
    face_reg: faceReg,
    threshold,
  });

  return response.data.match;
}

// Decode QR from uploaded image
async function decodeQRCode(file) {
  const image = await Jimp.read(file.buffer || file.path);
  const { data, width, height } = image.bitmap;
  const code = jsQR(new Uint8ClampedArray(data), width, height);
  if (!code) throw new Error("Unable to decode QR code");
  return code.data;
}

// ============================
// Routes
// ============================

// ---- Register ----
app.post("/api/v1/register", upload.single("faceImg"), async (req, res) => {
  try {
    const { nidNumber, password } = req.body;
    const faceFile = req.file;

    if (!nidNumber || !password || !faceFile) {
      return res.status(400).json({ ok: false, error: "Missing required fields" });
    }

    // 1. Hash NID
    const nidHash = hashNidNumber(nidNumber);

    // 2. Get embedding from Python
    const faceEmbedding = await getFaceEmbedding(faceFile);

    // 3. Create face hash
    const faceHash = keccak256(toUtf8Bytes(JSON.stringify(faceEmbedding)));

    // 4. Register on blockchain
    const tx = await contract.register(nidHash, faceHash);
    const receipt = await tx.wait();

    // 5. Prepare QR payload
    const qrPayload = {
      txHash: receipt.hash,
      nidHash,
      faceHash,
      face_reg: faceEmbedding,
    };

    // 6. Encrypt QR payload
    const encryptedPayload = encryptPayload(qrPayload, password);

    // 7. Generate QR code
    const qrBuffer = await QRCode.toBuffer(JSON.stringify(encryptedPayload));

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `attachment; filename=${crypto.randomBytes(6).toString("hex")}.png`);
    res.send(qrBuffer);

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message || "Unknown error" });
  }
});

// ---- Login ----
app.post("/api/v1/login", upload.fields([{ name: "qrCode" }, { name: "faceImg" }]), async (req, res) => {
  try {
    const { password } = req.body;
    const qrFile = req.files?.qrCode?.[0];
    const faceFile = req.files?.faceImg?.[0];

    if (!password || !qrFile || !faceFile) {
      return res.status(400).json({ ok: false, error: "Missing required fields" });
    }

    // 1. Decode QR & decrypt
    const encryptedPayload = await decodeQRCode(qrFile);
    const qrData = decryptPayload(encryptedPayload, password);

    // 2. Get login face embedding
    const faceLogin = await getFaceEmbedding(faceFile);

    // 3. Compare embeddings
    const isMatch = await compareEmbeddings(faceLogin, qrData.face_reg);

    res.json({
      ok: true,
      message: "QR decrypted and face verified",
      isMatch,
      qrData,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message || "Unknown error" });
  }
});

// ============================
// Server
// ============================
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
