import React from 'react';
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { BrowserProvider, formatEther } from 'ethers';
import { Wallet, LogOut, Copy, CheckCircle } from 'lucide-react';

const WalletConnect: React.FC = () => {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('eip155');
  const [balance, setBalance] = React.useState<string>('');
  const [copied, setCopied] = React.useState(false);

  // Get wallet balance
  React.useEffect(() => {
    const getBalance = async () => {
      if (!isConnected || !walletProvider || !address) return;

      try {
        const ethersProvider = new BrowserProvider(walletProvider as any);
        const balance = await ethersProvider.getBalance(address);
        setBalance(formatEther(balance));
      } catch (error) {
        console.error('Error getting balance:', error);
        setBalance('0');
      }
    };

    getBalance();
  }, [isConnected, walletProvider, address]);

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg">
        <Wallet className="w-6 h-6 text-red-600 mb-4" />
        <h3 className="text-lg font-bold text-gray-900 mb-2">Connect Your Wallet</h3>
        <p className="text-gray-600 text-center mb-6 max-w-sm text-sm">
          Connect your MetaMask or other Web3 wallet to access the FaceZKP platform
        </p>
        <button
          onClick={() => open()}
          className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-4 py-2 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-red-500/25"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Wallet Connected</h3>
            <p className="text-sm text-gray-600">Ready for verification</p>
          </div>
        </div>
        <button
          onClick={() => open({ view: "Networks" })}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Switch Network
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600">Address:</span>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm text-gray-900">
              {formatAddress(address || '')}
            </span>
            <button
              onClick={copyAddress}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {copied ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600">Balance:</span>
          <span className="font-semibold text-gray-900">
            {parseFloat(balance).toFixed(4)} ETH
          </span>
        </div>
      </div>

      <button
        onClick={() => open()}
        className="w-full mt-4 flex items-center justify-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
      >
        <LogOut className="w-4 h-4" />
        <span>Disconnect</span>
      </button>
    </div>
  );
};

export default WalletConnect; 