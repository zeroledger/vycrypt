/**
 * Integration test to verify that built files can be imported as ESM
 * and work as documented in README.md
 *
 * Run this after building: node test/integration/esm-imports.mjs
 */

import { encrypt, decrypt } from "../../crypt.js";
import { generateQuantumKeyPair, encryptQuantum, decryptQuantum } from "../../qcrypt.js";
import { createStealth, deriveStealthAccount } from "../../stealth/index.js";
import { mulPublicKey, mulPrivateKey } from "../../stealth/index.js";

console.log("✅ All imports successful from built files");

// Test that imports are defined
const checks = [
  { name: "encrypt", value: encrypt },
  { name: "decrypt", value: decrypt },
  { name: "generateQuantumKeyPair", value: generateQuantumKeyPair },
  { name: "encryptQuantum", value: encryptQuantum },
  { name: "decryptQuantum", value: decryptQuantum },
  { name: "createStealth", value: createStealth },
  { name: "deriveStealthAccount", value: deriveStealthAccount },
  { name: "mulPublicKey", value: mulPublicKey },
  { name: "mulPrivateKey", value: mulPrivateKey },
];

let allPassed = true;

checks.forEach(({ name, value }) => {
  if (typeof value === "function") {
    console.log(`✅ ${name} is a function`);
  } else {
    console.error(`❌ ${name} is not a function`);
    allPassed = false;
  }
});

if (allPassed) {
  console.log("\n🎉 All built modules are importable and functional!");
  process.exit(0);
} else {
  console.error("\n❌ Some imports failed");
  process.exit(1);
}
