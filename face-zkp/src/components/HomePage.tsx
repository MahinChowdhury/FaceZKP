import React, { useState, useEffect } from 'react';
import { Shield, Eye, Lock, Zap, CheckCircle, ArrowRight, Users, Globe, Fingerprint } from 'lucide-react';

interface AnimatedCounterProps {
  end: number;
  duration: number;
  suffix?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ end, duration, suffix = '' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationId: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      setCount(Math.floor(progress * end));
      
      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [end, duration]);

  return <span>{count.toLocaleString()}{suffix}</span>;
};

const HomePage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleLogin = () => {
    // Redirect to login page
    window.location.href = '/auth';
  };

  const features = [
    {
      icon: <Shield className="w-6 h-6 sm:w-8 sm:h-8" />,
      title: "Zero-Knowledge Proofs",
      description: "Verify your identity without revealing personal data through advanced cryptographic protocols."
    },
    {
      icon: <Eye className="w-6 h-6 sm:w-8 sm:h-8" />,
      title: "Biometric Authentication",
      description: "Secure face verification technology that ensures only you can access your digital identity."
    },
    {
      icon: <Lock className="w-6 h-6 sm:w-8 sm:h-8" />,
      title: "Blockchain Security",
      description: "Immutable identity records stored on distributed ledger technology for maximum security."
    }
  ];

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-gray-900 overflow-x-hidden">
      {/* Animated Background - Responsive */}
      <div className="fixed inset-0 opacity-20 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/2 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-violet-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
      </div>

      {/* Navigation - Mobile First */}
      <nav className="relative z-10 flex justify-between items-center p-4 sm:p-6 lg:px-12 w-full max-w-[100vw]">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <Fingerprint className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
          </div>
          <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
            VerifyID
          </span>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleLogin}
            className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white px-4 py-2 sm:px-6 sm:py-2 rounded-full font-semibold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25"
          >
            Login
          </button>
        </div>
      </nav>

      {/* Hero Section - Mobile Optimized */}
      <main className="relative z-10 flex flex-col items-center justify-start min-h-[80vh] w-full max-w-[100vw] px-4 sm:px-6 lg:px-12 pt-8 sm:pt-12">
        <div className={`text-center w-full max-w-[100vw] mx-auto transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-full px-3 py-1 sm:px-4 sm:py-2 mb-4 sm:mb-6 shadow-sm">
            <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" />
            <span className="text-xs sm:text-sm font-medium text-gray-700">Next-Gen Identity Verification</span>
          </div>

          {/* Main Heading - Responsive Typography */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-3 sm:mb-4 leading-tight text-gray-900 px-2">
            Secure Your Digital
            <span className="block bg-gradient-to-r from-blue-600 via-violet-600 to-emerald-600 bg-clip-text text-transparent mt-1">
              Identity with ZKP
            </span>
          </h1>

          {/* Subtitle - Mobile Optimized */}
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 mb-6 sm:mb-8 max-w-4xl mx-auto leading-relaxed px-4">
            Revolutionary face verification meets blockchain technology. Prove who you are without revealing who you are through zero-knowledge cryptography.
          </p>

          {/* CTA Buttons - Stack on Mobile */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-12 px-4">
            <button
              onClick={handleLogin}
              className="group w-full sm:w-auto bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-blue-500/30 flex items-center justify-center space-x-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg border-2 border-gray-300 hover:border-gray-400 hover:bg-white/60 transition-all duration-300 backdrop-blur-sm text-gray-700">
              Learn More
            </button>
          </div>
        </div>
      </main>

      {/* Features Section - Mobile Grid */}
      <section id="features" className="relative z-10 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-12 w-full max-w-[100vw]">
        <div className="w-full max-w-[100vw] mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-gray-900 px-2">
              Why Choose <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">VerifyID</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-4xl mx-auto px-4">
              Experience the future of identity verification with cutting-edge technology that prioritizes your privacy and security.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group p-6 sm:p-8 rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-200 hover:border-blue-300 transition-all duration-500 transform hover:scale-105 hover:bg-white/80 shadow-lg hover:shadow-xl ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <div className="text-blue-600 mb-4 sm:mb-6 group-hover:text-emerald-600 transition-colors duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4 text-gray-900 group-hover:text-blue-700 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Smart Contract Demo Section */}
      <section className="relative z-10 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-12 w-full max-w-[100vw] bg-white/30 backdrop-blur-sm">
        <div className="w-full max-w-[100vw] mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-gray-900 px-2">
              <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">Web3</span> Integration
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-4xl mx-auto px-4">
              Experience seamless blockchain integration with MetaMask and other Web3 wallets.
            </p>
          </div>
        </div>
      </section>

      {/* Footer - Mobile Optimized */}
      <footer className="relative z-10 py-8 sm:py-12 px-4 sm:px-6 lg:px-12 border-t border-gray-200 w-full max-w-[100vw]">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <Fingerprint className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              VerifyID
            </span>
          </div>
          <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 px-4">
            Revolutionizing digital identity through zero-knowledge cryptography and blockchain security.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;