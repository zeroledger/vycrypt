# Vycrypt

TypeScript Development Kit for ZeroLedger Protocol - A comprehensive cryptographic library for stealth addresses and ECDH encryption.

*Warning*: Software provided as is and has not passed any security checks and reviews.

## Features

- **Stealth Addresses**: Create and derive stealth addresses using secp256k1 public keys and random values
- **ECDH Encryption**: Asymmetric encryption using ephemeral key pairs and AES-256-GCM
- **Elliptic Curve Operations**: Secure multiplication of public and private keys on secp256k1 curve
- **Type Safety**: Full TypeScript support with comprehensive type definitions

## Security Features

- **Forward Secrecy**: Uses ephemeral keys for each encryption operation
- **Authenticated Encryption**: AES-256-GCM provides both confidentiality and integrity
- **Key Validation**: Comprehensive validation of private and public keys
- **Random IV**: Each encryption uses a cryptographically secure random IV
- **ECDH Key Agreement**: Secure key derivation using secp256k1 curve

## Installation

```bash
npm install @zeroledger/vycrypt
```

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

### Basic Encryption/Decryption

```typescript
import { encrypt, decrypt } from "@zeroledger/vycrypt";
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

### Stealth Address Creation

```typescript
import { createStealth, deriveStealthAccount } from "@zeroledger/vycrypt";
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
import { mulPublicKey, mulPrivateKey } from "@zeroledger/vycrypt";
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
import { encrypt, decrypt } from "@zeroledger/vycrypt";
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

- **Encryption/Decryption**: Round-trip operations with various data types
- **Error handling**: Invalid inputs and malformed data
- **Edge cases**: Empty strings, large data, unicode, binary data
- **Security properties**: Non-deterministic encryption, different outputs for different keys
- **Stealth addresses**: Address generation, derivation, and validation
- **Elliptic operations**: Key multiplication and validation

Run tests with:
```bash
npm test
```

## Dependencies

- **@noble/curves**: For secp256k1 elliptic curve operations
- **@noble/ciphers**: For AES-256-GCM encryption
- **@noble/hashes**: For SHA-256 hashing
- **viem**: For Ethereum-compatible utilities and types

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

## License

SEE LICENSE IN LICENSE

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing issues for similar problems
- Review the test files for usage examples
