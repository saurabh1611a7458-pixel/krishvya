import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { LanguageSelector } from './LanguageSelector';
import { Button } from './Button';
import { Sprout, Menu, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  const navLinks = [
    { name: t('home'), path: '/' },
    { name: t('howItWorks'), path: '/#how-it-works' },
    { name: t('features'), path: '/#features' },
    { name: t('about'), path: '/#about' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-earth-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-krishi-700 flex items-center justify-center text-white shadow-md group-hover:bg-krishi-800 transition-colors">
              <Sprout className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black tracking-tight text-krishi-900 font-sans">
                  KRISHVYA
                </span>
                <span className="inline-block w-2 h-2 rounded-full bg-krishi-500"></span>
              </div>
              <p className="text-[10px] font-semibold tracking-wider text-earth-600 uppercase -mt-0.5">
                Smart Indian Agriculture
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.path}
                className="text-base font-medium text-gray-700 hover:text-krishi-700 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Actions: Language & Clerk Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageSelector />
            <SignedOut>
              <Link to="/login">
                <Button variant="ghost" size="md">
                  {t('login')}
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="primary" size="md">
                  {t('getStarted')}
                </Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link to="/dashboard">
                <Button variant="primary" size="md">
                  Dashboard
                </Button>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSelector compact />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-gray-700 hover:bg-earth-100 focus:outline-none"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-earth-200 bg-white px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-base font-medium text-gray-800 hover:bg-krishi-50 hover:text-krishi-700"
              >
                {link.name}
              </a>
            ))}
          </div>
          <div className="pt-3 border-t border-earth-100 flex flex-col gap-2.5">
            <SignedOut>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" fullWidth size="md">
                  {t('login')}
                </Button>
              </Link>
              <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" fullWidth size="md">
                  {t('getStarted')}
                </Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" fullWidth size="md">
                  Dashboard
                </Button>
              </Link>
              <div className="flex items-center justify-between p-2 rounded-xl bg-earth-50 border border-earth-200">
                <span className="text-xs font-semibold text-gray-700">Account</span>
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
          </div>
        </div>
      )}
    </header>
  );
};

