import React, { useState } from 'react';
import { AuthLayout } from '../components/AuthLayout';
import { AuthInput } from '../components/AuthInput';
import { AuthButton } from '../components/AuthButton';

const EmailVerifyPage: React.FC = () => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Handle verification logic here
    }, 2000);
  };

  const handleResendCode = () => {
    // Handle resend code logic here
    console.log('Resending verification code...');
  };

  const handleBackClick = () => {
    // Navigate back
    console.log('Navigate back...');
  };

  const illustration = (
    <div className="space-y-6">
      {/* Main verification card */}
      <div className="bg-white rounded-2xl shadow-xl p-6 transform rotate-2 hover:rotate-0 transition-transform duration-300">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Email Verification</h3>
          <p className="text-gray-600 text-sm">Check your inbox for the verification code</p>
          <div className="mt-4 bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-800">176,18</div>
            <div className="text-sm text-gray-500">Unread messages</div>
          </div>
        </div>
      </div>

      {/* Security card */}
      <div className="bg-white rounded-2xl shadow-xl p-6 transform -rotate-1 hover:rotate-0 transition-transform duration-300">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3 flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h4 className="font-semibold text-gray-800 mb-1">Secure Verification</h4>
          <p className="text-gray-600 text-sm">Your account security is protected</p>
        </div>
      </div>

      {/* Floating icons */}
      <div className="absolute top-4 right-4 w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center shadow-lg">
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>
      <div className="absolute bottom-8 left-4 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </div>
    </div>
  );

  return (
    <AuthLayout
      title="Verify Your Email"
      subtitle="Enter the verification code sent to your email address"
      illustration={illustration}
      showBackButton={true}
      onBackClick={handleBackClick}
    >
      <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }}>
        <AuthInput
          type="text"
          placeholder="Enter verification code"
          value={code}
          onChange={setCode}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          }
        />

        <AuthButton
          type="submit"
          onClick={handleVerify}
          loading={isLoading}
          disabled={code.length < 6}
        >
          Verify Email
        </AuthButton>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm mb-3">
            Didn't receive the code?
          </p>
          <button
            type="button"
            onClick={handleResendCode}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
          >
            Resend Code
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-gray-500 text-sm text-center">
            Wrong email?{' '}
            <a href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
              Go back to signup
            </a>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default EmailVerifyPage;
