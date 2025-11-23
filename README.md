# Verdant Whisper Accord

A privacy-preserving initiative approval workflow for environmental organizations using Fully Homomorphic Encryption Virtual Machine (FHEVM).

## Overview

Verdant Whisper Accord enables environmental organizations to submit, vote on, and approve initiatives while keeping sensitive financial data encrypted throughout the process. The system uses FHEVM to perform computations on encrypted data without decryption, ensuring privacy and transparency.

## Features

- **Encrypted Submissions**: Initiatives are submitted with encrypted budget and priority data
- **Weighted Voting**: Organizations cast votes with encrypted weights
- **Budget Simulation**: Simulate budget allocation without revealing actual values
- **Approval Workflow**: Secure approval process with encrypted totals
- **Decryption Authorization**: Controlled decryption with ACL (Access Control List)
- **Multi-Network Support**: Works with local Hardhat node (mock mode) and Sepolia testnet (production mode)

## Project Structure

```
.
├── fhevm-hardhat-template/    # Smart contracts and Hardhat configuration
│   ├── contracts/            # Solidity smart contracts
│   ├── deploy/               # Deployment scripts
│   ├── tasks/                # Hardhat tasks
│   └── test/                 # Contract tests
└── verdant-whisper-accord-frontend/  # Next.js frontend application
    ├── app/                  # Next.js app directory
    ├── components/           # React components
    ├── hooks/                # Custom React hooks
    ├── lib/                  # Utility libraries
    └── scripts/              # Build and deployment scripts
```

## Prerequisites

- Node.js >= 20
- npm >= 7.0.0
- Hardhat node (for local development)

## Getting Started

### Smart Contracts

1. Navigate to the Hardhat template directory:
```bash
cd fhevm-hardhat-template
```

2. Install dependencies:
```bash
npm install
```

3. Compile contracts:
```bash
npx hardhat compile
```

4. Run tests:
```bash
npx hardhat test
```

5. Deploy to local network:
```bash
npx hardhat node
# In another terminal:
npx hardhat deploy --network localhost
```

6. Deploy to Sepolia:
```bash
npx hardhat deploy --network sepolia
```

### Frontend

1. Navigate to the frontend directory:
```bash
cd verdant-whisper-accord-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server (mock mode with local Hardhat node):
```bash
npm run dev:mock
```

4. Start development server (production mode with Sepolia):
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

## Development Modes

### Mock Mode (`dev:mock`)
- Uses local Hardhat node
- Uses `@fhevm/mock-utils` for FHEVM simulation
- Automatically deploys contracts if not found
- Chain ID: 31337 (localhost)

### Production Mode (`dev`)
- Connects to Sepolia testnet
- Uses `@zama-fhe/relayer-sdk` for real FHEVM
- Requires deployed contracts on Sepolia
- Chain ID: 11155111 (Sepolia)

## Smart Contract

### VerdantWhisperAccord

Main contract implementing the initiative approval workflow.

**Key Functions:**
- `submitInitiative`: Submit a new initiative with encrypted budget and priority
- `castVote`: Cast a weighted vote on an initiative
- `simulateAllocation`: Simulate budget allocation without revealing values
- `simulateApproval`: Simulate approval decision
- `approveInitiative`: Approve an initiative
- `requestDecryption`: Request decryption of encrypted data
- `authorizeDetailHandle`: Authorize decryption of specific handles

## Frontend Features

- **Wallet Integration**: EIP-6963 wallet discovery and connection
- **Wallet Persistence**: Automatic reconnection on page refresh
- **Theme Support**: Light/dark theme with compact/comfortable density
- **Static Export**: Fully static Next.js export for easy deployment
- **Responsive Design**: Mobile-friendly UI with accessibility support

## Deployment

### Vercel

The frontend is configured for static export and can be deployed to Vercel:

```bash
cd verdant-whisper-accord-frontend
vercel --prod
```

### Manual Static Hosting

After building:
```bash
cd verdant-whisper-accord-frontend
npm run build
```

The `out/` directory contains the static files ready for deployment to any static hosting service.

## Testing

### Contract Tests
```bash
cd fhevm-hardhat-template
npx hardhat test
```

### Frontend Static Checks
```bash
cd verdant-whisper-accord-frontend
npm run check:static
```

## License

See LICENSE files in respective directories.

## Contributing

This is a private project. For questions or issues, please contact the maintainers.


