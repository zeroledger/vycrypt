export const fundChannelTypes = {
  FundChannelConf: [
    { name: "channelId", type: "bytes32" },
    { name: "userPermitHash", type: "bytes32" },
  ],
} as const;

export const openChannelTypes = {
  OpenChannelConf: [
    { name: "channelId", type: "bytes32" },
    { name: "userPermitHash", type: "bytes32" },
    { name: "nodeType", type: "bool" },
  ],
} as const;

export const updateChannelTypes = {
  UpdateChannelConf: [
    { name: "channelId", type: "bytes32" },
    { name: "state", type: "bytes32" },
  ],
} as const;

export const settleChannelTypes = {
  SettlementConf: [
    { name: "channelId", type: "bytes32" },
    { name: "state", type: "bytes32" },
  ],
} as const;

export const collaborativeWithdrawTypes = {
  CollaborativeWithdrawConf: [
    { name: "channelId", type: "bytes32" },
    { name: "state", type: "bytes32" },
    { name: "user0Balance", type: "uint240" },
    { name: "user1Balance", type: "uint240" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

export const ERC_20_PERMIT_ABI = [
  { type: "error", inputs: [], name: "ECDSAInvalidSignature" },
  {
    type: "error",
    inputs: [
      {
        name: "length",
        type: "uint256",
        baseType: "uint256",
      },
    ],
    name: "ECDSAInvalidSignatureLength",
  },
  {
    type: "error",
    inputs: [
      {
        name: "s",
        type: "bytes32",
        baseType: "bytes32",
      },
    ],
    name: "ECDSAInvalidSignatureS",
  },
  {
    type: "error",
    inputs: [
      {
        name: "spender",
        type: "address",
        baseType: "address",
      },
      {
        name: "allowance",
        type: "uint256",
        baseType: "uint256",
      },
      {
        name: "needed",
        type: "uint256",
        baseType: "uint256",
      },
    ],
    name: "ERC20InsufficientAllowance",
  },
  {
    type: "error",
    inputs: [
      {
        name: "sender",
        type: "address",
        baseType: "address",
      },
      {
        name: "balance",
        type: "uint256",
        baseType: "uint256",
      },
      {
        name: "needed",
        type: "uint256",
        baseType: "uint256",
      },
    ],
    name: "ERC20InsufficientBalance",
  },
  {
    type: "error",
    inputs: [
      {
        name: "approver",
        type: "address",
        baseType: "address",
      },
    ],
    name: "ERC20InvalidApprover",
  },
  {
    type: "error",
    inputs: [
      {
        name: "receiver",
        type: "address",
        baseType: "address",
      },
    ],
    name: "ERC20InvalidReceiver",
  },
  {
    type: "error",
    inputs: [
      {
        name: "sender",
        type: "address",
        baseType: "address",
      },
    ],
    name: "ERC20InvalidSender",
  },
  {
    type: "error",
    inputs: [
      {
        name: "spender",
        type: "address",
        baseType: "address",
      },
    ],
    name: "ERC20InvalidSpender",
  },
  {
    type: "error",
    inputs: [
      {
        name: "deadline",
        type: "uint256",
        baseType: "uint256",
      },
    ],
    name: "ERC2612ExpiredSignature",
  },
  {
    type: "error",
    inputs: [
      {
        name: "signer",
        type: "address",
        baseType: "address",
      },
      {
        name: "owner",
        type: "address",
        baseType: "address",
      },
    ],
    name: "ERC2612InvalidSigner",
  },
  {
    type: "error",
    inputs: [
      {
        name: "account",
        type: "address",
        baseType: "address",
      },
      {
        name: "currentNonce",
        type: "uint256",
        baseType: "uint256",
      },
    ],
    name: "InvalidAccountNonce",
  },
  { type: "error", inputs: [], name: "InvalidShortString" },
  {
    type: "error",
    inputs: [
      {
        name: "str",
        type: "string",
        baseType: "string",
      },
    ],
    name: "StringTooLong",
  },
  {
    type: "event",
    inputs: [
      {
        name: "owner",
        type: "address",
        baseType: "address",
        indexed: true,
      },
      {
        name: "spender",
        type: "address",
        baseType: "address",
        indexed: true,
      },
      {
        name: "value",
        type: "uint256",
        baseType: "uint256",
        indexed: false,
      },
    ],
    name: "Approval",
    anonymous: false,
  },
  { type: "event", inputs: [], name: "EIP712DomainChanged", anonymous: false },
  {
    type: "event",
    inputs: [
      {
        name: "from",
        type: "address",
        baseType: "address",
        indexed: true,
      },
      {
        name: "to",
        type: "address",
        baseType: "address",
        indexed: true,
      },
      {
        name: "value",
        type: "uint256",
        baseType: "uint256",
        indexed: false,
      },
    ],
    name: "Transfer",
    anonymous: false,
  },
  {
    type: "function",
    inputs: [],
    name: "DOMAIN_SEPARATOR",
    constant: true,
    outputs: [
      {
        name: "",
        type: "bytes32",
        baseType: "bytes32",
      },
    ],
    stateMutability: "view",
    payable: false,
  },
  {
    type: "function",
    inputs: [
      {
        name: "owner",
        type: "address",
        baseType: "address",
      },
      {
        name: "spender",
        type: "address",
        baseType: "address",
      },
    ],
    name: "allowance",
    constant: true,
    outputs: [
      {
        name: "",
        type: "uint256",
        baseType: "uint256",
      },
    ],
    stateMutability: "view",
    payable: false,
  },
  {
    type: "function",
    inputs: [
      {
        name: "spender",
        type: "address",
        baseType: "address",
      },
      {
        name: "value",
        type: "uint256",
        baseType: "uint256",
      },
    ],
    name: "approve",
    constant: false,
    outputs: [
      {
        name: "",
        type: "bool",
        baseType: "bool",
      },
    ],
    stateMutability: "nonpayable",
    payable: false,
  },
  {
    type: "function",
    inputs: [
      {
        name: "account",
        type: "address",
        baseType: "address",
      },
    ],
    name: "balanceOf",
    constant: true,
    outputs: [
      {
        name: "",
        type: "uint256",
        baseType: "uint256",
      },
    ],
    stateMutability: "view",
    payable: false,
  },
  {
    type: "function",
    inputs: [],
    name: "decimals",
    constant: true,
    outputs: [
      {
        name: "",
        type: "uint8",
        baseType: "uint8",
      },
    ],
    stateMutability: "view",
    payable: false,
  },
  {
    type: "function",
    inputs: [],
    name: "eip712Domain",
    constant: true,
    outputs: [
      {
        name: "fields",
        type: "bytes1",
        baseType: "bytes1",
      },
      {
        name: "name",
        type: "string",
        baseType: "string",
      },
      {
        name: "version",
        type: "string",
        baseType: "string",
      },
      {
        name: "chainId",
        type: "uint256",
        baseType: "uint256",
      },
      {
        name: "verifyingContract",
        type: "address",
        baseType: "address",
      },
      {
        name: "salt",
        type: "bytes32",
        baseType: "bytes32",
      },
      {
        name: "extensions",
        type: "uint256[]",
        baseType: "array",

        arrayLength: -1,
        arrayChildren: {
          name: "",
          type: "uint256",
          baseType: "uint256",
        },
      },
    ],
    stateMutability: "view",
    payable: false,
  },
  {
    type: "function",
    inputs: [],
    name: "name",
    constant: true,
    outputs: [
      {
        name: "",
        type: "string",
        baseType: "string",
      },
    ],
    stateMutability: "view",
    payable: false,
  },
  {
    type: "function",
    inputs: [
      {
        name: "owner",
        type: "address",
        baseType: "address",
      },
    ],
    name: "nonces",
    constant: true,
    outputs: [
      {
        name: "",
        type: "uint256",
        baseType: "uint256",
      },
    ],
    stateMutability: "view",
    payable: false,
  },
  {
    type: "function",
    inputs: [
      {
        name: "owner",
        type: "address",
        baseType: "address",
      },
      {
        name: "spender",
        type: "address",
        baseType: "address",
      },
      {
        name: "value",
        type: "uint256",
        baseType: "uint256",
      },
      {
        name: "deadline",
        type: "uint256",
        baseType: "uint256",
      },
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
    name: "permit",
    constant: false,
    outputs: [],
    stateMutability: "nonpayable",
    payable: false,
  },
  {
    type: "function",
    inputs: [],
    name: "symbol",
    constant: true,
    outputs: [
      {
        name: "",
        type: "string",
        baseType: "string",
      },
    ],
    stateMutability: "view",
    payable: false,
  },
  {
    type: "function",
    inputs: [],
    name: "totalSupply",
    constant: true,
    outputs: [
      {
        name: "",
        type: "uint256",
        baseType: "uint256",
      },
    ],
    stateMutability: "view",
    payable: false,
  },
  {
    type: "function",
    inputs: [
      {
        name: "to",
        type: "address",
        baseType: "address",
      },
      {
        name: "value",
        type: "uint256",
        baseType: "uint256",
      },
    ],
    name: "transfer",
    constant: false,
    outputs: [
      {
        name: "",
        type: "bool",
        baseType: "bool",
      },
    ],
    stateMutability: "nonpayable",
    payable: false,
  },
  {
    type: "function",
    inputs: [
      {
        name: "from",
        type: "address",
        baseType: "address",
      },
      {
        name: "to",
        type: "address",
        baseType: "address",
      },
      {
        name: "value",
        type: "uint256",
        baseType: "uint256",
      },
    ],
    name: "transferFrom",
    constant: false,
    outputs: [
      {
        name: "",
        type: "bool",
        baseType: "bool",
      },
    ],
    stateMutability: "nonpayable",
    payable: false,
  },
] as const;
