export const TLC_ABI = [
  {
    name: "TLCParams",
    type: "tuple",
    components: [{ name: "deadline", type: "uint256" }],
  },
] as const;

export const SSTLC_ABI = [
  {
    name: "SSTLCParams",
    type: "tuple",
    components: [
      {
        name: "stealthUser",
        type: "address",
      },
      {
        name: "deadline",
        type: "uint256",
      },
    ],
  },
] as const;

export const CTLC_ABI = [
  {
    name: "CTLCParams",
    type: "tuple",
    components: [
      {
        name: "roothash",
        type: "bytes32",
      },
      {
        name: "alrtRoothash",
        type: "bytes32",
      },
      {
        name: "deadline",
        type: "uint256",
      },
    ],
  },
] as const;

export const CDTLC_ABI = [
  {
    name: "CDTLCParams",
    type: "tuple",
    components: [
      {
        name: "flankkLog",
        type: "address",
      },
      {
        name: "proof",
        type: "bytes32",
      },
      {
        name: "deadline",
        type: "uint256",
      },
    ],
  },
] as const;

export const FUNDING_PROOF_ABI = [
  {
    name: "fundSignature",
    type: "tuple",
    baseType: "tuple",
    components: [
      {
        name: "v",
        type: "uint8",
        baseType: "uint8",
      },
      {
        name: "r",
        type: "bytes32",
        baseType: "bytes32",
      },
      {
        name: "s",
        type: "bytes32",
        baseType: "bytes32",
      },
    ],
  },
  {
    name: "permit",
    type: "tuple",
    baseType: "tuple",
    components: [
      {
        name: "v",
        type: "uint8",
        baseType: "uint8",
      },
      {
        name: "r",
        type: "bytes32",
        baseType: "bytes32",
      },
      {
        name: "s",
        type: "bytes32",
        baseType: "bytes32",
      },
    ],
  },
] as const;
