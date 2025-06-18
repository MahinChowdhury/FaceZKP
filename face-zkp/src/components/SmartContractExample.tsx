import React, { useState } from 'react';
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { BrowserProvider, Contract, formatUnits, parseEther } from 'ethers';
import { Wallet, Send, CheckCircle, AlertCircle } from 'lucide-react';

// Example ERC-20 Contract ABI (USDT on Ethereum mainnet)
const USDTAbi = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function balanceOf(address) view returns (uint)",
  "function transfer(address to, uint amount)",
  "event Transfer(address indexed from, address indexed to, uint amount)",
];

// USDT contract address on Ethereum mainnet
const USDTAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

const SmartContractExample: React.FC = () => {
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('eip155');
  const [tokenBalance, setTokenBalance] = useState<string>('');
  const [tokenName, setTokenName] = useState<string>('');
  const [tokenSymbol, setTokenSymbol] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const getTokenInfo = async () => {
    if (!isConnected || !walletProvider || !address) {
      setMessage({ text: 'Please connect your wallet first', type: 'error' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const ethersProvider = new BrowserProvider(walletProvider as any);
      const signer = await ethersProvider.getSigner();
      const USDTContract = new Contract(USDTAddress, USDTAbi, signer);

      // Get token information
      const [name, symbol, balance] = await Promise.all([
        USDTContract.name(),
        USDTContract.symbol(),
        USDTContract.balanceOf(address)
      ]);

      setTokenName(name);
      setTokenSymbol(symbol);
      setTokenBalance(formatUnits(balance, 6)); // USDT has 6 decimals

      setMessage({ text: 'Token information retrieved successfully!', type: 'success' });
    } catch (error) {
      console.error('Error getting token info:', error);
      setMessage({ 
        text: error instanceof Error ? error.message : 'Failed to get token information', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendTransaction = async () => {
    if (!isConnected || !walletProvider || !address) {
      setMessage({ text: 'Please connect your wallet first', type: 'error' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const ethersProvider = new BrowserProvider(walletProvider as any);
      const signer = await ethersProvider.getSigner();
      
      // Send a small amount of ETH to yourself (for demo purposes)
      const tx = await signer.sendTransaction({
        to: address,
        value: parseEther('0.001') // 0.001 ETH
      });

      setMessage({ 
        text: `Transaction sent! Hash: ${tx.hash}`, 
        type: 'success' 
      });
    } catch (error) {
      console.error('Error sending transaction:', error);
      setMessage({ 
        text: error instanceof Error ? error.message : 'Failed to send transaction', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Wallet className="w-8 h-8 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-900">Smart Contract Interaction</h3>
        </div>
        <p className="text-gray-600 mb-4">
          Connect your wallet to interact with smart contracts and view token balances.
        </p>
        <div className="text-center text-gray-500">
          <Wallet className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Wallet not connected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Wallet className="w-8 h-8 text-blue-600" />
        <h3 className="text-xl font-bold text-gray-900">Smart Contract Interaction</h3>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {/* Token Information */}
      {tokenName && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">Token Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium">{tokenName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Symbol:</span>
              <span className="font-medium">{tokenSymbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Balance:</span>
              <span className="font-medium">{parseFloat(tokenBalance).toFixed(2)} {tokenSymbol}</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={getTokenInfo}
          disabled={isLoading}
          className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Wallet className="w-4 h-4" />
          <span>{isLoading ? 'Loading...' : 'Get USDT Balance'}</span>
        </button>

        <button
          onClick={sendTransaction}
          disabled={isLoading}
          className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          <span>{isLoading ? 'Processing...' : 'Send Test Transaction'}</span>
        </button>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
      </div>
    </div>
  );
};

export default SmartContractExample; 