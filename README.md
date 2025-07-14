# Vycryp

TS Development Kit for ZeroLeger Protocol

*Warning*: Software provided as is and did not passed any security checks and reviews. Please do not use it in production.

## Features

- Stealth Addresses creation using secp256k1 pubKey and random
- ECDH Encryption via ephemeral pk

## Installation

1. setup .npmrc

```text
//npm.pkg.github.com/:_authToken=_VALUE_
@zeroledger:registry=https://npm.pkg.github.com
always-auth=true
```

2. run `npm install @zeroledger/vycrypt.git`

## Usage

Note: All utils requires a [checksum encoded](https://eips.ethereum.org/EIPS/eip-55) [EIP-1191](https://eips.ethereum.org/EIPS/eip-1191) compatible EVM Addresses.

### Elliptic

```ts
import { mulPublicKey, mulPrivateKey } from "@dgma/flankk-sdk";
import { isAddress, toHex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { randomBytes } from "@noble/hashes/utils";
import { bytesToNumberBE } from "@noble/curves/abstract/utils";

const privateKey = generatePrivateKey();
const pubKey = privateKeyToAccount(privateKey).publicKey;
const random = bytesToNumberBE(randomBytes(16));

const stealthPublicKey = mulPublicKey(pubKey, random);
const stealthPrivateKey = mulPrivateKey(privateKey, random);
```

### Stealth Addresses

```ts
import { createStealth, deriveStealthAccount } from "@dgma/flankk-sdk";
import { isAddress, toHex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const privateKey = generatePrivateKey();
const pubKey = privateKeyToAccount(privateKey).publicKey;

const { stealthAddress, random } = createStealth(pubKey);
const account = deriveStealthAccount(privateKey, toHex(random)); // account.address === stealthAddress
```

### AES-256-GCM string Encryption & Decryption with Ephemeral PK and Public Key

```ts
import { encrypt, decrypt } from "@dgma/flankk-sdk";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const privKey = generatePrivateKey();
const account = privateKeyToAccount(privKey);

const data = `0xa5eaba8f6b292d059d9e8c3a2f1b16af`;

const encryptedData = encrypt(data, account.publicKey);
decrypt(privKey, encryptedData); // === data
```

## Contributing

Contributions are always welcome! Open a PR or an issue!
