# Vycrypt

[![Quality gate](https://github.com/zeroledger/vycrypt/actions/workflows/quality-gate.yml/badge.svg)](https://github.com/zeroledger/vycrypt/actions/workflows/quality-gate.yml)

Crypto primitives for ZeroLedger Protocol - A comprehensive cryptographic library for stealth addresses and ECDH encryption. Pure ESM, optimized for modern JavaScript environments.

*Warning*: Software provided as is and has not passed any security checks and reviews.

## Features

- **Stealth Addresses**: Create and derive stealth addresses using secp256k1 public keys and random values
- **ECDH Encryption**: Asymmetric encryption using ephemeral key pairs and AES-256-GCM
- **Quantum-Resistant Encryption**: Post-quantum encryption using ML-KEM-768 (Kyber) in a separate module
- **Elliptic Curve Operations**: Secure multiplication of public and private keys on secp256k1 curve
- **Type Safety**: Full TypeScript support with comprehensive type definitions

## Security Features

- **Forward Secrecy**: Uses ephemeral keys for each encryption operation
- **Authenticated Encryption**: AES-256-GCM provides both confidentiality and integrity
- **Quantum Resistance**: Optional ML-KEM-768 (Kyber) for post-quantum security
- **Key Validation**: Comprehensive validation of private and public keys
- **Random IV**: Each encryption uses a cryptographically secure random IV
- **ECDH Key Agreement**: Secure key derivation using secp256k1 curve

## Installation

```bash
npm install @zeroledger/vycrypt
```

## Module Format

This library is **pure ESM** (ES Modules) and requires **Node.js 20.19.0 or later**.

**Import the library:**

```typescript
import { encrypt, decrypt } from "@zeroledger/vycrypt/crypt.js";
import { createStealth, deriveStealthAccount } from "@zeroledger/vycrypt/stealth.js";
```

### Build Output

The library builds directly to the root directory with ESM format:
- `*.js` - ES Module JavaScript files
- `*.d.ts` - TypeScript declaration files
- `stealth/` - Stealth address modules

All files include source maps (`.js.map`, `.d.ts.map`) for debugging.

## API Reference

### Encryption & Decryption

#### `encrypt(data: string, counterpartyPubKey: Hex): Hex`
Encrypts data for a specific recipient using their public key.

- **Parameters:**
  - `data`: String to encrypt (supports any UTF-8 data)
  - `counterpartyPubKey`: Recipient's uncompressed public key (0x-prefixed hex)
- **Returns:** Encrypted data as hex string with ABI encoding
- **Security:** Uses ephemeral ECDH + AES-256-GCM

#### `decrypt(privateKey: Hash, encodedData: Hex): string`
Decrypts data using your private key.

- **Parameters:**
  - `privateKey`: Your private key (0x-prefixed hex)
  - `encodedData`: Encrypted data from `encrypt()`
- **Returns:** Original decrypted string
- **Throws:** Error if decryption fails or keys are invalid

### Quantum-Resistant Encryption & Decryption

#### `generateQuantumKeyPair(seed?: string): QuantumKeyPair`
Generates a quantum-resistant key pair using ML-KEM-768.

- **Parameters:**
  - `seed`: Optional seed string for deterministic key generation (any string, including unicode)
- **Returns:** Object with `publicKey` and `secretKey` (both Hex strings)
  - `publicKey`: 0x-prefixed hex string (1184 bytes / 2368 hex chars)
  - `secretKey`: 0x-prefixed hex string (2400 bytes / 4800 hex chars)
- **Security:** 
  - Without seed: Uses cryptographically secure random generation
  - With seed: Derives deterministic 64-byte seed using SHA-512 hashing

#### `encryptQuantum(data: string, publicKey: Hex): Hex`
Encrypts data using quantum-resistant ML-KEM-768.

- **Parameters:**
  - `data`: String to encrypt (supports any UTF-8 data)
  - `publicKey`: Recipient's ML-KEM-768 public key (0x-prefixed hex string, 1184 bytes)
- **Returns:** Encrypted data as hex string
- **Security:** Uses ML-KEM-768 key encapsulation + AES-256-GCM

#### `decryptQuantum(secretKey: Hex, encodedData: Hex): string`
Decrypts data encrypted with quantum-resistant encryption.

- **Parameters:**
  - `secretKey`: Your ML-KEM-768 secret key (0x-prefixed hex string, 2400 bytes)
  - `encodedData`: Encrypted data from `encryptQuantum()`
- **Returns:** Original decrypted string
- **Throws:** Error if decryption fails or keys are invalid

### Stealth Addresses

#### `createStealth(publicKey: Hex): { stealthAddress: string, random: bigint }`
Creates a stealth address from a public key.

- **Parameters:**
  - `publicKey`: Uncompressed public key (0x-prefixed hex)
- **Returns:** Object containing stealth address and random value
- **Security:** Uses cryptographically secure random values

#### `deriveStealthAccount(privateKey: Hex, random: Hex): Account`
Derives the private key for a stealth address.

- **Parameters:**
  - `privateKey`: Your private key (0x-prefixed hex)
  - `random`: Random value from `createStealth()`
- **Returns:** Viem account object with address matching stealth address

### Elliptic Curve Operations

#### `mulPublicKey(publicKey: Hex, number: bigint, isCompressed?: boolean): Hex`
Multiplies a public key by a scalar value.

- **Parameters:**
  - `publicKey`: Uncompressed public key (0x-prefixed hex)
  - `number`: Scalar to multiply by
  - `isCompressed`: Whether to return compressed format (default: false)
- **Returns:** New public key (0x-prefixed hex)

#### `mulPrivateKey(privateKey: Hex, number: bigint): Hex`
Multiplies a private key by a scalar value.

- **Parameters:**
  - `privateKey`: Private key (0x-prefixed hex)
  - `number`: Scalar to multiply by
- **Returns:** New private key (0x-prefixed hex)
- **Security:** Automatically applies modulo operation to stay within curve order

## Usage Examples

### Basic Encryption/Decryption (Classic)

```typescript
import { encrypt, decrypt } from "@zeroledger/vycrypt/crypt.js";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

// Generate key pair
const privKey = generatePrivateKey();
const account = privateKeyToAccount(privKey);

// Encrypt data
const data = "Hello, World!";
const encryptedData = encrypt(data, account.publicKey);

// Decrypt data
const decryptedData = decrypt(privKey, encryptedData);
console.log(decryptedData); // "Hello, World!"
```

### Quantum-Resistant Encryption/Decryption

```typescript
import { encryptQuantum, decryptQuantum, generateQuantumKeyPair } from "@zeroledger/vycrypt";

// Generate random quantum-resistant key pair
const keyPair = generateQuantumKeyPair();

// Or generate deterministic key pair from a seed string
const deterministicKeyPair = generateQuantumKeyPair("my-secret-passphrase");

// Encrypt data
const data = "Secret message protected from quantum computers";
const encryptedData = encryptQuantum(data, keyPair.publicKey);

// Decrypt data
const decryptedData = decryptQuantum(keyPair.secretKey, encryptedData);
console.log(decryptedData); // "Secret message protected from quantum computers"
```

### Stealth Address Creation

```typescript
import { createStealth, deriveStealthAccount } from "@zeroledger/vycrypt/stealth.js";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { toHex } from "viem";

// Generate key pair
const privateKey = generatePrivateKey();
const pubKey = privateKeyToAccount(privateKey).publicKey;

// Create stealth address
const { stealthAddress, random } = createStealth(pubKey);
console.log("Stealth Address:", stealthAddress);

// Derive private key for stealth address
const account = deriveStealthAccount(privateKey, toHex(random));
console.log("Derived Address:", account.address); // Same as stealthAddress
```

### Elliptic Curve Operations

```typescript
import { mulPublicKey, mulPrivateKey } from "@zeroledger/vycrypt/stealth.js";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const privateKey = generatePrivateKey();
const pubKey = privateKeyToAccount(privateKey).publicKey;
const multiplier = 123n;

// Multiply public key
const newPublicKey = mulPublicKey(pubKey, multiplier);

// Multiply private key
const newPrivateKey = mulPrivateKey(privateKey, multiplier);

// Verify they correspond
const newAccount = privateKeyToAccount(newPrivateKey);
console.log(newAccount.publicKey === newPublicKey); // true
```

### Advanced: Encrypting Large Data

```typescript
import { encrypt, decrypt } from "@zeroledger/vycrypt/crypt.js";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const privKey = generatePrivateKey();
const account = privateKeyToAccount(privKey);

// Encrypt large JSON data
const largeData = JSON.stringify({
  transaction: {
    hash: "0x1234567890abcdef...",
    value: "1000000000000000000",
    // ... more data
  }
});

const encrypted = encrypt(largeData, account.publicKey);
const decrypted = decrypt(privKey, encrypted);
console.log(JSON.parse(decrypted)); // Original object
```

## Security Considerations

### Key Management
- **Never share private keys**: Keep private keys secure and never transmit them
- **Use secure random generation**: Always use cryptographically secure random number generators
- **Validate inputs**: The library validates keys, but ensure your application validates all inputs

### Encryption Best Practices
- **Ephemeral keys**: Each encryption uses a new ephemeral key pair for forward secrecy
- **Random IVs**: Each encryption uses a cryptographically secure random IV
- **Authenticated encryption**: AES-GCM provides both confidentiality and integrity

### Stealth Address Security
- **Random values**: Each stealth address uses a cryptographically secure random value
- **Deterministic derivation**: Same inputs always produce the same stealth address
- **No correlation**: Different random values produce uncorrelated stealth addresses

### Quantum-Resistant Encryption
- **ML-KEM-768 (Kyber)**: NIST-standardized post-quantum key encapsulation mechanism (FIPS 203)
- **Post-quantum security**: Protects against both classical and quantum computer attacks
- **Separate module**: Keep quantum encryption isolated in `qcrypt.ts` for clarity
- **Larger keys**: ML-KEM keys are ~1-2KB compared to ~33 bytes for secp256k1
- **Hybrid approach**: Combines post-quantum KEM with classical AES-256-GCM

## Error Handling

The library throws descriptive errors for invalid inputs:

```typescript
try {
  const encrypted = encrypt("data", "0xinvalid");
} catch (error) {
  console.log(error.message); // "Must provide uncompressed public key as hex string"
}

try {
  const decrypted = decrypt("0xinvalid", encryptedData);
} catch (error) {
  console.log(error.message); // "Must provide private key as hash string"
}
```

## Testing

The library includes comprehensive tests covering:

- **Classic Encryption/Decryption**: Round-trip operations with various data types
- **Quantum-Resistant Encryption**: ML-KEM-768 encryption and decryption
- **Error handling**: Invalid inputs and malformed data
- **Edge cases**: Empty strings, large data, unicode, binary data
- **Security properties**: Non-deterministic encryption, different outputs for different keys
- **Stealth addresses**: Address generation, derivation, and validation
- **Elliptic operations**: Key multiplication and validation

Run tests with:
```bash
npm test
```

Validate build output and ESM imports:
```bash
npm run test:build
```

This command:
1. Builds the library
2. Validates all expected files are created
3. Verifies built modules can be imported as ESM
4. Confirms the API works as documented

## Dependencies

- **@noble/ciphers** (v2.0.1): AES-256-GCM authenticated encryption
- **viem** (v2.38.6): Ethereum-compatible utilities, types, and hashing (SHA-256)

**Note:** Viem internally uses and re-exports `@noble/curves` (secp256k1) and `@noble/hashes`, ensuring compatibility across the ecosystem.

All dependencies are ESM-compatible and actively maintained.

## Contributing

Contributions are always welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

### Development Setup

```bash
git clone <repository>
cd vycrypt
npm install
npm test
```

### Building

To build the ESM output:

```bash
npm run build
```

This creates:
- `*.js` files in the root directory (ESM format)
- `stealth/` directory with stealth modules
- TypeScript declaration files (`.d.ts`) and source maps

### Type Checking

```bash
npm run typecheck
```

## License

SEE LICENSE IN LICENSE

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing issues for similar problems
- Review the test files for usage examples
