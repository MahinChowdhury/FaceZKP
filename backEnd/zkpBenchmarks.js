const crypto = require("crypto");
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const BN = require('bn.js');
const { keccak256, toUtf8Bytes } = require("ethers");
const { performance } = require('perf_hooks');
const fs = require("fs");
const plotly = require("plotly")("username", "apiKey"); // Put any strings here, not used for local export

function benchmarkZKP(n_tests = 100) {
    const proofTimes = [];
    const verifyTimes = [];

    for (let i = 0; i < n_tests; i++) {
        const tStart = performance.now();
        const r = new BN(crypto.randomBytes(32));
        const R = ec.g.mul(r);
        const cHex = keccak256(toUtf8Bytes("tHex" + Buffer.from(R.encode('array')).toString('hex') + "salt"));
        const cBN  = new BN(cHex.slice(2), 16).umod(ec.curve.n);
        const k = new BN(crypto.randomBytes(32));
        const m = r.add(cBN.mul(k)).umod(ec.curve.n);
        const tProof = performance.now() - tStart;
        proofTimes.push(tProof);

        const tVerifyStart = performance.now();
        const S = ec.g.mul(k);
        const M = ec.g.mul(m);
        const C = S.mul(cBN);
        const MC = M.add(C.neg());
        const MChex = Buffer.from(MC.encode('array')).toString('hex');
        const checkHex = keccak256(toUtf8Bytes("tHex" + MChex + "salt"));
        const tVerify = performance.now() - tVerifyStart;
        verifyTimes.push(tVerify);
    }

    return { proofTimes, verifyTimes };
}

// Run benchmark
const { proofTimes, verifyTimes } = benchmarkZKP(100);

function calculateStats(times) {
    const n = times.length;
    const avg = times.reduce((a, b) => a + b, 0) / n;
    const min = Math.min(...times);
    const max = Math.max(...times);
    const variance = times.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    return {
        min: min.toFixed(4),
        max: max.toFixed(4),
        avg: avg.toFixed(4),
        stdDev: stdDev.toFixed(4)
    };
}

const proofStats = calculateStats(proofTimes);
const verifyStats = calculateStats(verifyTimes);

console.log("=== ZKP Benchmark Statistics ===");
console.log("Proof Generation (ms):", proofStats);
console.log("Verification (ms):", verifyStats);

// --- Save raw times to CSV ---
let csvRaw = "Run,ProofTime_ms,VerifyTime_ms\n";
for (let i = 0; i < proofTimes.length; i++) {
    csvRaw += `${i+1},${proofTimes[i].toFixed(6)},${verifyTimes[i].toFixed(6)}\n`;
}

fs.writeFileSync("zkp_benchmark_raw.csv", csvRaw);
console.log("✅ Raw benchmark data saved to zkp_benchmark_raw.csv");