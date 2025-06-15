import React, { useState } from 'react';
import { Eye, EyeOff, Fingerprint, ArrowLeft, Mail, Lock, User, Phone, Shield, CheckCircle } from 'lucide-react';

interface FormData {
  email: string;
  password: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

const AuthPages: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log(isLogin ? 'Login submitted:' : 'Register submitted:', formData);
    setIsLoading(false);
  };

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-3 sm:p-4 lg:p-6 overflow-x-hidden relative">
      {/* Animated Background - Mobile Optimized */}
      <div className="absolute inset-0 opacity-20 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 sm:w-48 sm:h-48 lg:w-96 lg:h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-32 h-32 sm:w-48 sm:h-48 lg:w-96 lg:h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/2 w-32 h-32 sm:w-48 sm:h-48 lg:w-96 lg:h-96 bg-violet-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
      </div>

      {/* Back to Home Button - Mobile Positioned */}
      <button
        onClick={handleBackToHome}
        className="absolute top-3 left-3 sm:top-4 sm:left-4 lg:top-6 lg:left-6 z-20 flex items-center space-x-1 sm:space-x-2 text-gray-600 hover:text-gray-900 transition-colors group bg-white/80 backdrop-blur-sm rounded-full px-2 py-1 sm:px-3 sm:py-2 shadow-sm"
      >
        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium text-sm sm:text-base">Back</span>
      </button>

      {/* Main Content - Perfectly Centered */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl mx-auto">
        {/* Logo - Mobile Responsive */}
        <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-6 sm:mb-8">
          <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <Fingerprint className="w-4 h-4 sm:w-5 sm:h-5 lg:w-7 lg:h-7 text-white" />
          </div>
          <span className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
            VerifyID
          </span>
        </div>

        {/* Auth Card - Mobile Optimized */}
        <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
          {/* Toggle Buttons - Mobile Responsive */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6 sm:mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-2 sm:px-4 rounded-md font-medium text-sm sm:text-base transition-all duration-300 ${
                isLogin
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-2 sm:px-4 rounded-md font-medium text-sm sm:text-base transition-all duration-300 ${
                !isLogin
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Register
            </button>
          </div>

          {/* Form Header - Mobile Text Sizes */}
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-600 text-sm sm:text-base px-2">
              {isLogin 
                ? 'Sign in to access your secure digital identity'
                : 'Join the future of identity verification'
              }
            </p>
          </div>

          {/* Form - Mobile Optimized Spacing */}
          <div className="space-y-4 sm:space-y-6">
            {/* Register Fields */}
            {!isLogin && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="firstName"
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                      required={!isLogin}
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                      required={!isLogin}
                    />
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    required={!isLogin}
                  />
                </div>
              </>
            )}

            {/* Email */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                required
              />
            </div>

            {/* Password */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
              </button>
            </div>

            {/* Confirm Password for Registration */}
            {!isLogin && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  required={!isLogin}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                </button>
              </div>
            )}

            {/* Forgot Password (Login only) */}
            {isLogin && (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {/* Terms & Conditions (Register only) - Mobile Optimized */}
            {!isLogin && (
              <div className="flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs sm:text-sm text-gray-700">
                  <p className="mb-2">By creating an account, you agree to our:</p>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-blue-600 hover:text-blue-700 cursor-pointer">Terms of Service</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-blue-600 hover:text-blue-700 cursor-pointer">Privacy Policy</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-blue-600 hover:text-blue-700 cursor-pointer">Biometric Data Usage</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button - Mobile Optimized */}
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className={`w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/30 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
                </div>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </div>

          {/* Footer Links - Mobile Text */}
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-xs sm:text-sm text-gray-600">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        {/* Security Notice - Mobile Text */}
        <div className="mt-4 sm:mt-6 text-center px-4">
          <p className="text-xs text-gray-500">
            🔒 Your data is protected with enterprise-grade encryption and zero-knowledge protocols
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPages;