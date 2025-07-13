import { encodeAbiParameters, type Hex, slice, hexToBigInt, toHex } from "viem";

import { hardhat } from "viem/chains";

import { type NormalizedSignature, type Client } from "../channel.types";

export const serialize = <T>(value: object): T =>
  JSON.parse(
    JSON.stringify(value, (_, v) => (typeof v === "bigint" ? toHex(v) : v)),
  );

export const toViemSignature = (serializedSignature: Hex) => {
  const [r, s, v] = [
    slice(serializedSignature, 0, 32),
    slice(serializedSignature, 32, 64),
    slice(serializedSignature, 64, 65),
  ];
  return { r, s, v: hexToBigInt(v), yParity: undefined };
};

export const toSignature = (serializedSignature: Hex): NormalizedSignature => ({
  r: slice(serializedSignature, 0, 32),
  s: slice(serializedSignature, 32, 64),
  v: parseInt(slice(serializedSignature, 64, 65)),
});

export const patchClient = (client: Client) => {
  if (client.chain?.id !== hardhat.id) {
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const multicall: any = (confugure: { contracts: any[] }) => {
    console.warn("promise.all used instead of multicall");
    return Promise.all(
      confugure.contracts.map(async (paramas) => {
        const result = await client.readContract(paramas);
        return {
          result,
        };
      }),
    );
  };
  client.multicall = multicall;
};

export const encodeAbiSignature = (viemSignatureHex: Hex) =>
  encodeAbiParameters(
    [
      {
        type: "tuple",
        name: "signature",
        components: [
          { name: "v", type: "uint8" },
          { name: "r", type: "bytes32" },
          { name: "s", type: "bytes32" },
        ],
      },
    ],
    [toSignature(viemSignatureHex)],
  );
