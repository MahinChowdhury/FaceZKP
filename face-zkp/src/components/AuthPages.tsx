import React, { useState, useRef } from 'react';
import { Shield, Eye, Lock, ArrowRight, Upload, Camera, QrCode, Fingerprint, User, Key, CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface FileInputProps {
  accept: string;
  onChange: (file: File | null) => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  file: File | null;
  capture?: boolean;
}

const FileInput: React.FC<FileInputProps> = ({ accept, onChange, icon, title, description, file, capture }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    onChange(selectedFile);
  };

  return (
    <div 
      onClick={handleClick}
      className="border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl p-6 text-center cursor-pointer transition-all duration-300 hover:bg-blue-50/50 group"
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        capture={capture ? "user" : undefined}
      />
      <div className="text-blue-500 group-hover:text-blue-600 mb-3 flex justify-center">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-2">{description}</p>
      {file && (
        <div className="flex items-center justify-center space-x-2 text-green-600 bg-green-50 rounded-lg p-2">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">{file.name}</span>
        </div>
      )}
    </div>
  );
};

const AuthPages: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'register' | 'login'>('register');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  
  // Registration form state
  const [regNidNumber, setRegNidNumber] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regFaceImg, setRegFaceImg] = useState<File | null>(null);
  
  // Login form state
  const [loginPassword, setLoginPassword] = useState('');
  const [loginQrCode, setLoginQrCode] = useState<File | null>(null);
  const [loginFaceImg, setLoginFaceImg] = useState<File | null>(null);

  const resetForm = () => {
    setRegNidNumber('');
    setRegPassword('');
    setRegConfirmPassword('');
    setRegFaceImg(null);
    setLoginPassword('');
    setLoginQrCode(null);
    setLoginFaceImg(null);
    setMessage(null);
    setQrCodeUrl(null);
  };

  const handlePageSwitch = (page: 'register' | 'login') => {
    setCurrentPage(page);
    resetForm();
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!regNidNumber || !regPassword || !regFaceImg) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('nidNumber', regNidNumber);
      formData.append('password', regPassword);
      formData.append('faceImg', regFaceImg);

      const response = await fetch('http://localhost:3000/api/v1/register', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const qrUrl = URL.createObjectURL(blob);
        const filename = response.headers.get("X-Filename") || "verifyid-qr.png";

        const link = document.createElement("a");
        link.href = qrUrl;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(qrUrl);
        setQrCodeUrl(qrUrl);
        setMessage({ type: 'success', text: 'Registration successful! Your QR code is ready for download.' });
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Registration failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginPassword || !loginQrCode || !loginFaceImg) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('password', loginPassword);
      formData.append('qrCode', loginQrCode);
      formData.append('faceImg', loginFaceImg);

      const response = await fetch('http://localhost:3000/api/v1/login', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.ok) {
        setMessage({ type: 'success', text: 'Login successful! Identity verified.' });
        console.log("Login Success!");
        localStorage.setItem("isLoggedIn", "true");
        window.location.href = '/vote';
      } else {
        setMessage({ type: 'error', text: data.error || 'Login failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-gray-900 overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-20 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/2 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-violet-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center p-4 sm:p-6 lg:px-12 w-full max-w-[100vw]">
        <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer" onClick={() => window.location.href = '/'}>
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <Fingerprint className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
          </div>
          <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
            VerifyID
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageSwitch('register')}
            className={`px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 ${
              currentPage === 'register' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            Register
          </button>
          <button
            onClick={() => handlePageSwitch('login')}
            className={`px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 ${
              currentPage === 'login' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            Login
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-start min-h-[80vh] w-full max-w-[100vw] px-4 sm:px-6 lg:px-12 pt-8 sm:pt-12">
        <div className="w-full max-w-2xl mx-auto">
          
          {/* Page Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 mb-6 shadow-sm">
              {currentPage === 'register' ? (
                <>
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">Secure Registration</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium text-gray-700">Identity Verification</span>
                </>
              )}
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight text-gray-900">
              {currentPage === 'register' ? (
                <>Create Your <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">Digital Identity</span></>
              ) : (
                <>Verify Your <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">Identity</span></>
              )}
            </h1>
            
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {currentPage === 'register' 
                ? 'Register with zero-knowledge proofs to create your secure digital identity without revealing personal data.'
                : 'Login using your encrypted QR code and face verification for seamless authentication.'
              }
            </p>
          </div>

          {/* Form Container */}
          <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xl">
            
            {/* Message Display */}
            {message && (
              <div className={`mb-6 p-4 rounded-xl border flex items-center space-x-3 ${
                message.type === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <span className="font-medium">{message.text}</span>
              </div>
            )}

            {/* QR Code Display */}
            {qrCodeUrl && (
              <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 rounded-xl text-center">
                <div className="mb-4">
                  <img src={qrCodeUrl} alt="Registration QR Code" className="mx-auto max-w-48 h-auto border rounded-lg shadow-lg" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Your Registration QR Code</h3>
                <p className="text-sm text-gray-600 mb-4">Save this QR code securely - you'll need it for login</p>
                <a
                  href={qrCodeUrl}
                  download="verifyid-qr-code.png"
                  className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Download QR Code</span>
                </a>
              </div>
            )}

            {/* Registration Form */}
            {currentPage === 'register' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    National ID Number
                  </label>
                  <input
                    type="text"
                    value={regNidNumber}
                    onChange={(e) => setRegNidNumber(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm"
                    placeholder="Enter your NID number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Key className="w-4 h-4 inline mr-2" />
                    Password
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm"
                    placeholder="Create a secure password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Key className="w-4 h-4 inline mr-2" />
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm"
                    placeholder="Confirm your password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Face Verification Photo
                  </label>
                  <FileInput
                    accept="image/*"
                    onChange={setRegFaceImg}
                    icon={<Camera className="w-8 h-8" />}
                    title="Upload Face Photo"
                    description="Take or upload a clear photo of your face"
                    file={regFaceImg}
                    capture={true}
                  />
                </div>

                <button
                  onClick={handleRegistration}
                  disabled={isLoading}
                  className="group w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-blue-500/30 flex items-center justify-center space-x-2 disabled:transform-none disabled:shadow-none"
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Creating Identity...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Identity</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Login Form */}
            {currentPage === 'login' && (
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Key className="w-4 h-4 inline mr-2" />
                    Password
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm"
                    placeholder="Enter your password"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Registration QR Code
                  </label>
                  <FileInput
                    accept="image/*"
                    onChange={setLoginQrCode}
                    icon={<QrCode className="w-8 h-8" />}
                    title="Upload QR Code"
                    description="Upload your registration QR code"
                    file={loginQrCode}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Face Verification Photo
                  </label>
                  <FileInput
                    accept="image/*"
                    onChange={setLoginFaceImg}
                    icon={<Camera className="w-8 h-8" />}
                    title="Take Verification Photo"
                    description="Take a photo for face verification"
                    file={loginFaceImg}
                    capture={true}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-blue-500/30 flex items-center justify-center space-x-2 disabled:transform-none disabled:shadow-none"
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Verifying Identity...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify Identity</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Switch Page Link */}
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                {currentPage === 'register' ? "Already have an account?" : "Don't have an account?"}
                <button
                  onClick={() => handlePageSwitch(currentPage === 'register' ? 'login' : 'register')}
                  className="ml-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                >
                  {currentPage === 'register' ? 'Sign In' : 'Create One'}
                </button>
              </p>
            </div>
          </div>

          {/* Security Features */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white/40 backdrop-blur-sm rounded-xl border border-gray-200">
              <Shield className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Zero-Knowledge Proofs</p>
            </div>
            <div className="text-center p-4 bg-white/40 backdrop-blur-sm rounded-xl border border-gray-200">
              <Lock className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Blockchain Security</p>
            </div>
            <div className="text-center p-4 bg-white/40 backdrop-blur-sm rounded-xl border border-gray-200">
              <Eye className="w-6 h-6 text-violet-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Biometric Verification</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuthPages;