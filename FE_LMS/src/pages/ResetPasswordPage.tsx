import React, { useState } from 'react';
import { AuthLayout } from '../components/AuthLayout';
import { AuthInput } from '../components/AuthInput';
import { AuthButton } from '../components/AuthButton';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const passwordRequirements = [
    { text: 'At least 8 characters', met: password.length >= 8 },
    { text: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { text: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { text: 'Contains number', met: /\d/.test(password) },
    { text: 'Contains special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) }
  ];

  const isPasswordValid = passwordRequirements.every(req => req.met);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async () => {
    if (!isPasswordValid || !passwordsMatch) return;
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
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
      {/* Main password card */}
      <div className="bg-white rounded-2xl shadow-xl p-6 transform rotate-1 hover:rotate-0 transition-transform duration-300">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">New Password</h3>
          <p className="text-gray-600 text-sm">Create a strong password</p>
          <div className="mt-4 bg-blue-50 rounded-lg p-3">
            <div className="text-lg font-semibold text-blue-800">98%</div>
            <div className="text-sm text-blue-600">Password strength</div>
          </div>
        </div>
      </div>

      {/* Security card */}
      <div className="bg-white rounded-2xl shadow-xl p-6 transform -rotate-1 hover:rotate-0 transition-transform duration-300">
        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full mx-auto mb-3 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h4 className="font-semibold text-gray-800 mb-1">Your data, your rules</h4>
          <p className="text-gray-600 text-sm">Full control over your account</p>
        </div>
      </div>

      {/* Floating icons */}
      <div className="absolute top-4 right-4 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
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

  if (isSuccess) {
    return (
      <AuthLayout
        title="Password Reset Successfully!"
        subtitle="Your password has been updated. You can now sign in with your new password."
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
          
          <h3 className="text-xl font-semibold text-gray-800 mb-2">All Set!</h3>
          <p className="text-gray-600 mb-6">
            Your password has been successfully updated. You can now sign in with your new password.
          </p>
          
          <AuthButton onClick={handleBackToLogin}>
            Sign In Now
          </AuthButton>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your new password below"
      illustration={illustration}
      showBackButton={true}
      onBackClick={handleBackClick}
    >
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <AuthInput
          type="password"
          placeholder="Enter new password"
          value={password}
          onChange={setPassword}
          showPasswordToggle={true}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
        />

        {/* Password Requirements */}
        {password.length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Password Requirements:</h4>
            <div className="space-y-2">
              {passwordRequirements.map((req, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    req.met ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    {req.met && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm ${req.met ? 'text-green-700' : 'text-gray-600'}`}>
                    {req.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <AuthInput
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          showPasswordToggle={true}
          isValid={confirmPassword.length > 0 ? passwordsMatch : undefined}
          errorMessage={confirmPassword.length > 0 && !passwordsMatch ? 'Passwords do not match' : ''}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <AuthButton
          type="submit"
          onClick={handleSubmit}
          loading={isLoading}
          disabled={!isPasswordValid || !passwordsMatch}
        >
          Update Password
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
      </form>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
