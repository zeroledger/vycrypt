# Vycrypt

[![Quality gate](https://github.com/zeroledger/vycrypt/actions/workflows/quality-gate.yml/badge.svg)](https://github.com/zeroledger/vycrypt/actions/workflows/quality-gate.yml)

Crypto primitives for ZeroLedger Protocol - ECDH encryption, stealth addresses, and post-quantum security.

> ⚠️ **Warning**: Software provided as-is. Not audited for production use.

## Features

- 🔐 **ECDH Encryption** - Ephemeral key pairs + AES-256-GCM
- 🛡️ **Post-Quantum Encryption** - ML-KEM-768 (Kyber) resistant to quantum attacks
- 👻 **Stealth Addresses** - Privacy-preserving address generation
- 🔢 **Elliptic Operations** - secp256k1 key multiplication
- 📦 **Pure ESM** - Modern JavaScript, TypeScript-native

## Requirements

- **Node.js** ≥ 20.19.0
- **Pure ESM** - No CommonJS support

## Installation

```bash
npm install @zeroledger/vycrypt
```

## Quick Start

### Classic Encryption

```typescript
import { encrypt, decrypt } from "@zeroledger/vycrypt/crypt.js";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const privKey = generatePrivateKey();
const account = privateKeyToAccount(privKey);

const encrypted = encrypt("Hello, World!", account.publicKey);
const decrypted = decrypt(privKey, encrypted);
```

### Quantum-Resistant Encryption

```typescript
import { generateQuantumKeyPair, encryptQuantum, decryptQuantum } from "@zeroledger/vycrypt/qcrypt.js";

// Random key pair
const keyPair = generateQuantumKeyPair();

// Or deterministic from seed
const keys = generateQuantumKeyPair("my-passphrase");

const encrypted = encryptQuantum("Secret data", keyPair.publicKey);
const decrypted = decryptQuantum(keyPair.secretKey, encrypted);
```

### Stealth Addresses

```typescript
import { createStealth, deriveStealthAccount } from "@zeroledger/vycrypt/stealth/index.js";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { toHex } from "viem";

const privateKey = generatePrivateKey();
const pubKey = privateKeyToAccount(privateKey).publicKey;

const { stealthAddress, random } = createStealth(pubKey);
const account = deriveStealthAccount(privateKey, toHex(random));
```

## API Reference

### Classic Encryption (`/crypt.js`)

#### `encrypt(data: string, publicKey: Hex): Hex`
ECDH encryption with ephemeral keys and AES-256-GCM. **Max 254 bytes input.**
- All ciphertexts are fixed-length (255 bytes padded) for perfect length obfuscation.

#### `decrypt(privateKey: Hash, encodedData: Hex): string`
Decrypt data encrypted with `encrypt()`.

### Quantum Encryption (`/qcrypt.js`)

#### `generateQuantumKeyPair(seed?: string): QuantumKeyPair`
Generate ML-KEM-768 key pair. Optional seed for deterministic generation.
- **Returns:** `{ publicKey: Hex, secretKey: Hex }`
- **Key sizes:** 1184 bytes (public), 2400 bytes (secret)

#### `encryptQuantum(data: string, publicKey: Hex): Hex`
Quantum-resistant encryption using ML-KEM-768 + AES-256-GCM. **Max 254 bytes input.**
- All ciphertexts are fixed-length (255 bytes padded) for perfect length obfuscation.

#### `decryptQuantum(secretKey: Hex, encodedData: Hex): string`
Decrypt quantum-encrypted data.

### Stealth Addresses (`/stealth/index.js`)

#### `createStealth(publicKey: Hex): { stealthAddress: string, random: bigint }`
Generate a stealth address with cryptographically secure random.

#### `deriveStealthAccount(privateKey: Hex, random: Hex): Account`
Derive private key for stealth address. Returns viem Account.

#### `mulPublicKey(publicKey: Hex, scalar: bigint, isCompressed?: boolean): Hex`
Multiply public key by scalar on secp256k1 curve.

#### `mulPrivateKey(privateKey: Hex, scalar: bigint): Hex`
Multiply private key by scalar (modulo curve order).

## Security

### Classic Encryption
- ✅ Forward secrecy (ephemeral keys)
- ✅ Authenticated encryption (AES-256-GCM)
- ✅ Random IVs per operation
- ✅ ECDH on secp256k1 curve
- ✅ Fixed-length ciphertexts (length obfuscation)

### Quantum Encryption
- ✅ ML-KEM-768 (NIST FIPS 203)
- ✅ Post-quantum secure
- ✅ Hybrid encryption (KEM + AES-GCM)
- ✅ Non-deterministic by default
- ✅ Fixed-length ciphertexts (length obfuscation)

### Best Practices
- Never share or transmit private keys
- Use cryptographically secure random generation
- Validate all inputs in your application
- Consider quantum resistance for long-term secrets

## Module Exports

```json
{
  ".": "./index.js",                    // Main exports
  "./crypt.js": "./crypt.js",           // Classic encryption
  "./qcrypt.js": "./qcrypt.js",         // Quantum encryption
  "./stealth/index.js": "./stealth/index.js"  // Stealth addresses
}
```

## Testing

```bash
# Run all tests
npm test

# Validate build and ESM imports
npm run test:build

# Type checking
npm run typecheck

# Linting
npm run lint
```

**Test coverage:** 128 tests covering encryption, stealth addresses, edge cases, and build validation.

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@noble/ciphers` | ^2.0.1 | AES-256-GCM encryption |
| `@noble/post-quantum` | ^0.5.2 | ML-KEM-768 (Kyber) |
| `viem` | ^2.38.6 | Ethereum utilities, secp256k1, hashing |

> **Note:** vycryp re-exports `@noble/curves` and `@noble/hashes` from Viem for compatibility.

## Build

```bash
npm run build
```

Outputs:
- `index.js`, `crypt.js`, `qcrypt.js` - Main modules
- `stealth/` - Stealth address modules
- `*.d.ts` - TypeScript declarations
- `*.js.map` - Source maps

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure `npm test` and `npm run test:build` pass
5. Submit a pull request

## License

SEE LICENSE IN LICENSE
