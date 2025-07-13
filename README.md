# Flankk-SDK

TS Development Kit for Flankk Protocol

## Features

- Channel management
- Stealth Addresses & SSTLC
- ECDH Encryption with Ephemeral PK

## Installation

1. setup .npmrc

```text
//npm.pkg.github.com/:_authToken=_VALUE_
@dgma:registry=https://npm.pkg.github.com
always-auth=true
```

2. run `npm install @dgma/flankk-sdk.git`

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

### Channels

```ts
export const flankk = "0x1E0fFf8037C7E6c2Da4fD65DFD749751b5f48f0c";
export const token = "0xb42660F4582133bB92f70f36B5B4A66C2Ee122F2";

const domain = {
  name: "Flankk",
  version: "0.0.5",
  chainId: arbitrumSepolia.id,
  verifyingContract: flankk,
} as const;

const client0 = createWalletClient({
  account: privateKeyToAccount(generatePrivateKey()),
  chain: arbitrumSepolia,
  transport: http(),
}).extend(publicActions);

const client1 = createWalletClient({
  account: privateKeyToAccount(generatePrivateKey()),
  chain: arbitrumSepolia,
  transport: http(),
}).extend(publicActions);

const channel = new Channel(
  token,
  domain,
  // user0 (operator) address
  client0.account.address,
  // user1 (counterparty) address
  client1.account.address,
  // operator client instance
  client0,
);
```

## Contributing

Contributions are always welcome! Open a PR or an issue!
