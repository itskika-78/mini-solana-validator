# Mini Solana Validator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![Solana](https://img.shields.io/badge/Solana-Compatible-blue.svg)](https://solana.com/)

A high-performance, single-node, in-memory Solana-compatible JSON-RPC server implementation. Built for educational purposes and to demonstrate core Solana blockchain architecture including transaction processing, ed25519 signature verification, and SPL Token program logic.

## 🚀 Features

- **🏗️ In-Memory Ledger**: Full state management for accounts, tokens, and mints
- **🔐 Protocol Compliance**: Strictly follows Solana transaction serialization and ed25519 signature verification
- **🪙 SPL Token Support**: Implements MintTo, Transfer, and ATA creation with bit-perfect account layouts
- **🔄 Rolling Blockhash System**: Maintains a 150-blockhash sliding window for replay protection
- **🌐 JSON-RPC 2.0**: Compatible with `@solana/web3.js` and standard RPC clients
- **✅ Account Validation**: Comprehensive validation utilities for account existence, balance, and ownership
- **🛡️ Replay Protection**: Prevents duplicate transaction processing
- **⚠️ Error Handling**: Proper JSON-RPC error codes and messages

## 📋 Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [Transaction Processing](#transaction-processing)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## 🛠️ Installation

### Prerequisites
- Node.js 16.0.0 or higher
- npm or yarn

### Install Dependencies
```bash
git clone https://github.com/your-username/solana-mini-validator.git
cd solana-mini-validator
npm install
```

## 🚀 Quick Start

### Running the Server
```bash
npm start
```

The validator will start on port `3000` and be ready to accept JSON-RPC requests.

### Basic Test
```bash
npm test
```

## 🏗️ Architecture Overview

### Core Components

1. **Server Layer** (`src/server.js`)
   - Express.js HTTP server on port 3000
   - JSON-RPC 2.0 request routing
   - Error handling middleware

2. **RPC Router** (`src/rpcRouter.js`)
   - Method dispatch and parameter validation
   - Standardized error responses
   - JSON-RPC 2.0 compliance

3. **Ledger System** (`src/ledger/`)
   - `ledger.js`: Account state management
   - `blockhash.js`: Rolling blockhash queue (150 entries)
   - `signatures.js`: Transaction status tracking
   - `validation.js`: Account validation utilities

4. **Transaction Processing** (`src/transaction/`)
   - `processor.js`: Transaction deserialization, signature verification, and instruction execution

5. **Program Implementations** (`src/programs/`)
   - `systemProgram.js`: System Program (CreateAccount, Transfer)
   - `tokenProgram.js`: SPL Token Program (InitializeMint, InitializeAccount, MintTo, Transfer)
   - `ataProgram.js`: Associated Token Account Program

## 🔄 Transaction Processing

The validator processes transactions through a structured pipeline:

1. **📥 Deserialization**: Parse base64-encoded transaction using `@solana/web3.js`
2. **🛡️ Replay Protection**: Check if transaction signature was already processed
3. **🔐 Signature Verification**: Validate ed25519 signatures for all required signers
4. **🔗 Blockhash Validation**: Ensure transaction uses a valid, recent blockhash
5. **⚡ Instruction Execution**: Process each instruction sequentially
6. **💾 State Commitment**: Update account states and increment slot
7. **📊 Status Tracking**: Record transaction status with slot and confirmation details

### Security Features

- **Signature Verification**: All transactions require valid ed25519 signatures
- **Replay Protection**: Duplicate transactions are rejected
- **Blockhash Validation**: Only transactions with recent blockhashes are accepted
- **Account Validation**: Comprehensive checks for account existence, ownership, and balances
- **Parameter Validation**: All RPC inputs are validated before processing

## 📚 API Reference

### Cluster Info
- `getVersion` → `{ "solana-core": "1.17.0", "feature-set": 1 }`
- `getSlot` → `<number>` - Current slot
- `getBlockHeight` → `<number>` - Current block height
- `getHealth` → `"ok"`

### Blockhash Management
- `getLatestBlockhash` → `{ context: { slot }, value: { blockhash, lastValidBlockHeight } }`

### Account Queries
- `getBalance` → `{ context: { slot }, value: <lamports> }`
- `getAccountInfo` → `{ context: { slot }, value: <AccountInfo | null> }`
- `getMinimumBalanceForRentExemption` → `<number>` - Rent exemption calculation

### Token Operations
- `getTokenAccountBalance` → `{ context: { slot }, value: { amount, decimals, uiAmount } }`
- `getTokenAccountsByOwner` → `{ context: { slot }, value: [<TokenAccount>, ...] }`

### Transaction Operations
- `requestAirdrop` → `<signature>` - Credit account with SOL
- `sendTransaction` → `<signature>` - Submit and execute transaction
- `getSignatureStatuses` → `{ context: { slot }, value: [<Status | null>, ...] }`

## 💡 Examples

### Using curl

#### Health Check
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' \
  http://localhost:3000/
```

#### Get Latest Blockhash
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getLatestBlockhash"}' \
  http://localhost:3000/
```

#### Request Airdrop
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"requestAirdrop","params":["9B5XansqYvDTZREpPhyT6nBvEnKndh1nAnD69Kz8G6D",1000000000]}' \
  http://localhost:3000/
```

### Using @solana/web3.js

```javascript
import { Connection, Keypair, SystemProgram, Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js";

const connection = new Connection("http://localhost:3000");

// Generate keypairs
const sender = Keypair.generate();
const receiver = Keypair.generate();

// Request airdrop
const airdropSig = await connection.requestAirdrop(sender.publicKey, 1 * LAMPORTS_PER_SOL);
console.log("Airdrop signature:", airdropSig);

// Check balance
const balance = await connection.getBalance(sender.publicKey);
console.log("Balance:", balance);

// Create transfer transaction
const tx = new Transaction().add(
    SystemProgram.transfer({
        fromPubkey: sender.publicKey,
        toPubkey: receiver.publicKey,
        lamports: 100000000
    })
);

// Get recent blockhash and sign
const { blockhash } = await connection.getLatestBlockhash();
tx.recentBlockhash = blockhash;
tx.feePayer = sender.publicKey;
tx.sign(sender);

// Send transaction
const txSig = await connection.sendRawTransaction(tx.serialize());
console.log("Transfer signature:", txSig);

// Check receiver balance
const receiverBalance = await connection.getBalance(receiver.publicKey);
console.log("Receiver balance:", receiverBalance);
```

## 📁 Project Structure

```
solana-mini-validator/
├── src/                          # Source code
│   ├── server.js                  # Express server entry point
│   ├── rpcRouter.js               # JSON-RPC method routing and validation
│   ├── ledger/                   # In-memory state management
│   │   ├── ledger.js             # Account storage and basic operations
│   │   ├── blockhash.js          # Rolling blockhash queue (150 entries)
│   │   ├── signatures.js         # Transaction status tracking
│   │   └── validation.js         # Account validation utilities
│   ├── transaction/              # Transaction processing
│   │   └── processor.js         # Transaction verification and execution
│   └── programs/                # Solana program implementations
│       ├── systemProgram.js      # System Program (11111111111111111111111111111111)
│       ├── tokenProgram.js       # SPL Token Program (TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA)
│       └── ataProgram.js        # Associated Token Account Program (ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL)
├── test.js                      # Demo script showing validator functionality
├── simple-test.js               # Simplified test script
├── package.json                 # Node.js package configuration
├── package-lock.json            # Dependency lock file
├── README.md                   # This file
├── LICENSE                     # MIT License
├── CONTRIBUTING.md              # Contribution guidelines
└── .gitignore                  # Git ignore patterns
```

### Component Responsibilities

#### `src/server.js`
- Express.js server setup and configuration
- JSON parsing middleware
- Error handling middleware
- Routes all POST requests to RPC router

#### `src/rpcRouter.js`
- JSON-RPC 2.0 request validation
- Method dispatch to appropriate handlers
- Parameter validation and error handling
- Standardized response formatting

#### `src/ledger/ledger.js`
- In-memory account storage using Map
- Account CRUD operations
- Balance and slot management
- Basic account state transitions

#### `src/ledger/blockhash.js`
- Rolling blockhash queue management (150 entries)
- Blockhash generation and validation
- Slot-based expiration handling

#### `src/ledger/signatures.js`
- Transaction signature tracking
- Status management (confirmed/failed)
- Replay protection implementation

#### `src/ledger/validation.js`
- Account existence validation
- Balance and ownership checks
- Token account layout validation
- Parameter sanitization

#### `src/transaction/processor.js`
- Transaction deserialization
- Signature verification pipeline
- Instruction execution orchestration
- Error handling and status reporting

#### `src/programs/systemProgram.js`
- System Program instruction handlers
- CreateAccount and Transfer operations
- Account creation and SOL transfers

#### `src/programs/tokenProgram.js`
- SPL Token Program instruction handlers
- Mint initialization and token operations
- Token transfers and minting logic

#### `src/programs/ataProgram.js`
- Associated Token Account Program
- ATA creation and derivation
- PDA (Program Derived Address) validation

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

### Development Setup
```bash
git clone https://github.com/your-username/solana-mini-validator.git
cd solana-mini-validator
npm install
npm start
```

### Running Tests
```bash
npm test
```

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

##  Limitations

- **Single-node implementation** (no consensus)
- **In-memory state** (not persistent)
- **Simplified rent calculation**
- **No support for all Solana programs**
- **No cross-program invocation support**

##  Acknowledgments

- Built for educational purposes to demonstrate Solana protocol concepts
- Compatible with `@solana/web3.js` client library
- Inspired by Solana's official implementation

##  Support
For queries mail: kika@sendarcade.fun
---

