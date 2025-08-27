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
const {Jimp }= require("jimp");
const jsQR = require("jsqr");
const axios = require("axios");
const FormData = require("form-data");
const { ethers, keccak256, toUtf8Bytes } = require("ethers");
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const BN = require('bn.js');

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

  return response.data.reduced_emb;
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

    // Step 2: derive k from faceHash + salt
    const salt = crypto.randomBytes(16).toString('hex');
    const kHash = keccak256(toUtf8Bytes(faceHash + salt));
    const kBN = ec.keyFromPrivate(kHash.slice(2), 'hex').getPrivate();

    // // Step 3: compute S = k·G
    const pubPoint = ec.g.mul(kBN);
    const Sx = pubPoint.getX().toString(16);
    const Sy = pubPoint.getY().toString(16);

    console.log(faceHash);
    console.log(Sx);
    console.log(Sy);
    console.log(salt);

    //4. Register on blockchain
    const tx = await contract.register(nidHash, `0x${Sx}`, `0x${Sy}`, salt);
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

    const filename = `${crypto.randomBytes(6).toString("hex")}.png`;
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.setHeader("X-Filename", filename); // custom header for frontend
    res.send(qrBuffer);

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message || "Unknown error" });
  }
});

function deriveK_sameAsRegistration(faceHashStr, saltStr) {
  // IMPORTANT: faceHashStr must be the same string format as at registration (including '0x' and casing)
  const kHashHex = keccak256(toUtf8Bytes(faceHashStr + saltStr)); // <-- string concat, UTF-8
  let kBN = new BN(kHashHex.slice(2), 16).umod(ec.curve.n);
  if (kBN.isZero()) kBN = kBN.iaddn(1); // avoid zero
  return kBN;
}

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

    console.log("qrDate : ",qrData);
    // 3. Compare embeddings
    const isMatch = await compareEmbeddings(faceLogin, qrData.face_reg);

    const [Sx, Sy, salt] = await contract.getUserData(qrData.nidHash);

    console.log("FaceHash : ", qrData.faceHash);
    console.log("Sx:", Sx);
    console.log("Sy:", Sy);
    console.log("Salt:", salt);

    // On server after retrieving pub key (Sx, Sy, salt) from chain
    const S = ec.curve.point(
      new BN(Sx.slice(2), 16),
      new BN(Sy.slice(2), 16)
    );

    const k = deriveK_sameAsRegistration(qrData.faceHash, salt);

    const Sprime = ec.g.mul(k);
    const SxChain = new BN(Sx.slice(2), 16);
    const SyChain = new BN(Sy.slice(2), 16);
    if (!Sprime.getX().eq(SxChain) || !Sprime.getY().eq(SyChain)) {
      console.error('k derivation mismatch vs chain S. Check faceHash/salt formatting!');
      throw new Error('ZKP key derivation does not match registration');
    }

    // 2. Create challenge t
    const t = crypto.randomBytes(32);
    const tHex = t.toString('hex');
    // 4) Prover creates r, R
    const r = new BN(crypto.randomBytes(32));       // BN random
    const R = ec.g.mul(r);
    const Rhex = Buffer.from(R.encode('array')).toString('hex');  // uncompressed 04||X||Y as hex

    // 5) Compute c using the SAME style for both sides (we'll use hex-string concat here)
    const cHex = keccak256(toUtf8Bytes(tHex + Rhex + salt));
    const cBN  = new BN(cHex.slice(2), 16).umod(ec.curve.n);

    // 6) m = r + c*k mod n
    const m = r.add(cBN.mul(k)).umod(ec.curve.n);
    // 7) Verifier side (still same request)
  //Compute M - C, encode to hex, and hash the same way
    const M = ec.g.mul(m);
    const C = S.mul(cBN);
    const MC = M.add(C.neg());
    const MChex = Buffer.from(MC.encode('array')).toString('hex');

    const checkHex = keccak256(toUtf8Bytes(tHex + MChex + salt));

    // 8) Compare
    let IsVerified = false;
    if (checkHex.toLowerCase() === cHex.toLowerCase()) {
      console.log('✅ Valid proof');
      IsVerified = true;
    } else {
      console.log('❌ Not a valid proof');
      IsVerified = false;
    }

    ok = (isMatch & IsVerified);

    res.json({
      ok,
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
