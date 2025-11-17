export const VerdantWhisperAccordABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "ZamaProtocolUnsupported",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      }
    ],
    "name": "CommitteeUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "requester",
        "type": "address"
      }
    ],
    "name": "DecryptionRequested",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "DetailHandleAuthorized",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "approver",
        "type": "address"
      }
    ],
    "name": "InitiativeApproved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "proposer",
        "type": "address"
      }
    ],
    "name": "InitiativeSubmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "voter",
        "type": "address"
      }
    ],
    "name": "VoteCast",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "admin",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "initiativeId",
        "type": "uint256"
      },
      {
        "internalType": "externalEuint64",
        "name": "allocationCipher",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "allocationProof",
        "type": "bytes"
      }
    ],
    "name": "approveInitiative",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "initiativeId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "authorizeDetailHandle",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "initiativeId",
        "type": "uint256"
      },
      {
        "internalType": "externalEuint32",
        "name": "voteWeightCipher",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "voteProof",
        "type": "bytes"
      }
    ],
    "name": "castVote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "committeeMembers",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "confidentialProtocolId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "getAllocationSnapshot",
    "outputs": [
      {
        "internalType": "euint64",
        "name": "totalRequested",
        "type": "bytes32"
      },
      {
        "internalType": "euint64",
        "name": "totalAllocated",
        "type": "bytes32"
      },
      {
        "internalType": "euint64",
        "name": "remaining",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "getApprovalSimulation",
    "outputs": [
      {
        "internalType": "euint32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "initiativeId",
        "type": "uint256"
      }
    ],
    "name": "getDetailHandle",
    "outputs": [
      {
        "internalType": "euint32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getGlobalTotals",
    "outputs": [
      {
        "internalType": "euint64",
        "name": "totalRequested",
        "type": "bytes32"
      },
      {
        "internalType": "euint64",
        "name": "totalAllocated",
        "type": "bytes32"
      },
      {
        "internalType": "euint32",
        "name": "globalPriority",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "initiativeId",
        "type": "uint256"
      }
    ],
    "name": "getInitiative",
    "outputs": [
      {
        "internalType": "address",
        "name": "proposer",
        "type": "address"
      },
      {
        "internalType": "enum VerdantWhisperAccord.InitiativeStatus",
        "name": "status",
        "type": "uint8"
      },
      {
        "internalType": "bytes",
        "name": "summaryCiphertext",
        "type": "bytes"
      },
      {
        "internalType": "bytes",
        "name": "resourcesCiphertext",
        "type": "bytes"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "initiativeId",
        "type": "uint256"
      }
    ],
    "name": "getInitiativeBudgets",
    "outputs": [
      {
        "internalType": "euint64",
        "name": "requestedBudget",
        "type": "bytes32"
      },
      {
        "internalType": "euint64",
        "name": "allocatedBudget",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "initiativeId",
        "type": "uint256"
      }
    ],
    "name": "getInitiativePriority",
    "outputs": [
      {
        "internalType": "euint32",
        "name": "basePriority",
        "type": "bytes32"
      },
      {
        "internalType": "euint32",
        "name": "voteTally",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "initiativeCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "initiativeId",
        "type": "uint256"
      }
    ],
    "name": "requestDecryption",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "enabled",
        "type": "bool"
      }
    ],
    "name": "setCommitteeMember",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256[]",
        "name": "initiativeIds",
        "type": "uint256[]"
      },
      {
        "internalType": "externalEuint64",
        "name": "budgetPoolCipher",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "budgetPoolProof",
        "type": "bytes"
      }
    ],
    "name": "simulateAllocation",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256[]",
        "name": "initiativeIds",
        "type": "uint256[]"
      }
    ],
    "name": "simulateApproval",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "bytes",
            "name": "summaryCiphertext",
            "type": "bytes"
          },
          {
            "internalType": "bytes",
            "name": "resourcesCiphertext",
            "type": "bytes"
          },
          {
            "internalType": "externalEuint64",
            "name": "requestedBudgetCipher",
            "type": "bytes32"
          },
          {
            "internalType": "bytes",
            "name": "requestedBudgetProof",
            "type": "bytes"
          },
          {
            "internalType": "externalEuint32",
            "name": "basePriorityCipher",
            "type": "bytes32"
          },
          {
            "internalType": "bytes",
            "name": "basePriorityProof",
            "type": "bytes"
          },
          {
            "internalType": "externalEuint32",
            "name": "detailHandleCipher",
            "type": "bytes32"
          },
          {
            "internalType": "bytes",
            "name": "detailHandleProof",
            "type": "bytes"
          }
        ],
        "internalType": "struct VerdantWhisperAccord.InitiativeSubmission",
        "name": "submission",
        "type": "tuple"
      }
    ],
    "name": "submitInitiative",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
export type VerdantWhisperAccordABIType = typeof VerdantWhisperAccordABI;
