import React, { useState } from 'react';
import { AuthLayout } from '../components/AuthLayout';
import { AuthInput } from '../components/AuthInput';
import { AuthButton } from '../components/AuthButton';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 2000);
  };

  const handleBackToLogin = () => {
    // Navigate back to login
    console.log('Navigate to login...');
  };

  const handleBackClick = () => {
    // Navigate back
    console.log('Navigate back...');
  };

  const illustration = (
    <div className="space-y-6">
      {/* Main reset card */}
      <div className="bg-white rounded-2xl shadow-xl p-6 transform -rotate-2 hover:rotate-0 transition-transform duration-300">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Reset Password</h3>
          <p className="text-gray-600 text-sm">We'll send you a reset link</p>
          <div className="mt-4 bg-orange-50 rounded-lg p-3">
            <div className="text-lg font-semibold text-orange-800">45</div>
            <div className="text-sm text-orange-600">Reset requests today</div>
          </div>
        </div>
      </div>

      {/* Security card */}
      <div className="bg-white rounded-2xl shadow-xl p-6 transform rotate-1 hover:rotate-0 transition-transform duration-300">
        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full mx-auto mb-3 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 className="font-semibold text-gray-800 mb-1">Secure Process</h4>
          <p className="text-gray-600 text-sm">Your data is protected</p>
        </div>
      </div>

      {/* Floating icons */}
      <div className="absolute top-6 left-6 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </div>
      <div className="absolute bottom-6 right-6 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center shadow-lg">
        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>
    </div>
  );

  if (isSubmitted) {
    return (
      <AuthLayout
        title="Check Your Email"
        subtitle="We've sent a password reset link to your email address"
        illustration={illustration}
        showBackButton={true}
        onBackClick={handleBackClick}
      >
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Email Sent!</h3>
          <p className="text-gray-600 mb-6">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          
          <div className="space-y-4">
            <AuthButton onClick={handleBackToLogin}>
              Back to Login
            </AuthButton>
            
            <button
              type="button"
              onClick={() => setIsSubmitted(false)}
              className="w-full py-3 px-4 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Try different email
            </button>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-xl">
            <p className="text-blue-800 text-sm">
              <strong>Didn't receive the email?</strong> Check your spam folder or try again in a few minutes.
            </p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot Password?"
      subtitle="Enter your email address and we'll send you a reset link"
      illustration={illustration}
      showBackButton={true}
      onBackClick={handleBackClick}
    >
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <AuthInput
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={setEmail}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />

        <AuthButton
          type="submit"
          onClick={handleSubmit}
          loading={isLoading}
          disabled={!email.includes('@')}
        >
          Send Reset Link
        </AuthButton>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleBackToLogin}
            className="text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors"
          >
            ← Back to Login
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-gray-500 text-sm text-center">
            Remember your password?{' '}
            <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in here
            </a>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
