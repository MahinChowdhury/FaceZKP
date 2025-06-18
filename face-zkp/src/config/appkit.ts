import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { mainnet, arbitrum } from '@reown/appkit/networks'

// Get projectId from https://cloud.reown.com
// For development, you can use a placeholder, but for production get a real projectId
const projectId = "23cbac49d00fd39160026bce7d20905d"

// Create a metadata object - optional
const metadata = {
  name: 'FaceZKP',
  description: 'Face Verification with Zero-Knowledge Proofs',
  url: 'https://localhost:5173', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

// Create Ethers Adapter
const ethersAdapter = new EthersAdapter()

// Create modal
createAppKit({
  adapters: [ethersAdapter],
  networks: [mainnet, arbitrum],
  projectId,
  metadata,
  features: {
    analytics: true // Optional - defaults to your Cloud configuration
  }
})

export { ethersAdapter } 