import React from 'react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { LanguageProvider } from './context/LanguageContext';
import { FarmProvider } from './context/FarmContext';
import { AppRoutes } from './routes/AppRoutes';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const ClerkProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  if (!PUBLISHABLE_KEY) {
    return (
      <div className="min-h-screen bg-[#FBFBF7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-earth-200 shadow-soft-lg text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto text-xl font-bold">
            ⚠️
          </div>
          <h2 className="text-xl font-black text-gray-900">Clerk Publishable Key Missing</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            Please add your Clerk Publishable Key in <code>.env</code>:
          </p>
          <pre className="p-3 bg-earth-50 rounded-xl text-xs text-left text-gray-800 font-mono overflow-x-auto border border-earth-200">
            VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
          </pre>
          <p className="text-xs text-gray-500">
            Obtain your free key from{' '}
            <a
              href="https://dashboard.clerk.com"
              target="_blank"
              rel="noreferrer"
              className="text-krishi-700 underline font-semibold"
            >
              dashboard.clerk.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      signInUrl="/login"
      signUpUrl="/signup"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      afterSignOutUrl="/"
    >
      {children}
    </ClerkProvider>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ClerkProviderWrapper>
        <LanguageProvider>
          <FarmProvider>
            <AppRoutes />
          </FarmProvider>
        </LanguageProvider>
      </ClerkProviderWrapper>
    </BrowserRouter>
  );
};

export default App;
