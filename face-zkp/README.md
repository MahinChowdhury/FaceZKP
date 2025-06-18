# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

# FaceZKP - Face Verification with Zero-Knowledge Proofs

A revolutionary face verification platform that combines biometric authentication with blockchain technology and zero-knowledge cryptography.

## Features

- **Zero-Knowledge Proofs**: Verify your identity without revealing personal data
- **Biometric Authentication**: Secure face verification technology
- **Blockchain Security**: Immutable identity records on distributed ledger
- **Web3 Integration**: Seamless MetaMask and WalletConnectV2 integration
- **Smart Contract Interaction**: Built-in Ethers.js integration for blockchain operations

## Web3 Wallet Integration

This project uses [Reown AppKit](https://docs.reown.com/appkit/react/core/installation#ethers) with Ethers v6 for seamless Web3 wallet integration.

### Supported Wallets

- MetaMask
- WalletConnect
- Coinbase Wallet
- Injected Wallets

### Setup

1. **Get a Project ID**: 
   - Visit [Reown Cloud](https://cloud.reown.com)
   - Create a new project
   - Copy your project ID

2. **Set Environment Variable**:
   - Create a `.env` file in the root directory
   - Add your project ID:
   ```bash
   REOWN_PROJECT_ID=your_actual_project_id_here
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

## Smart Contract Features

The application includes:

- **Wallet Connection**: Connect to MetaMask and other Web3 wallets
- **Balance Display**: View ETH and token balances
- **Token Information**: Query ERC-20 token details (USDT example)
- **Transaction Sending**: Send test transactions
- **Network Switching**: Switch between different blockchain networks

## Components

### WalletConnect
- Handles wallet connection/disconnection
- Displays wallet address and balance
- Network switching functionality

### SmartContractExample
- Demonstrates smart contract interaction
- USDT balance checking
- Transaction sending capabilities

## Configuration

The AppKit configuration is located in `src/config/appkit.ts`:

```typescript
import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { mainnet, arbitrum } from '@reown/appkit/networks'

const projectId = process.env.REOWN_PROJECT_ID || ''

const metadata = {
  name: 'FaceZKP',
  description: 'Face Verification with Zero-Knowledge Proofs',
  url: 'https://localhost:5173',
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

const ethersAdapter = new EthersAdapter()

createAppKit({
  adapters: [ethersAdapter],
  networks: [mainnet, arbitrum],
  projectId,
  metadata,
  features: {
    analytics: true
  }
})
```

## Usage

1. **Connect Wallet**: Click the "Connect Wallet" button to connect your MetaMask or other Web3 wallet
2. **View Balance**: Once connected, your wallet address and ETH balance will be displayed
3. **Smart Contract Interaction**: Use the Smart Contract Example to:
   - Check USDT balance
   - Send test transactions
   - View token information

## Development

### Prerequisites

- Node.js 16+
- MetaMask or other Web3 wallet
- Reown Cloud project ID

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Security

- All wallet interactions are handled securely through Reown AppKit
- Private keys never leave the user's wallet
- HTTPS required for camera access and wallet connections

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details
