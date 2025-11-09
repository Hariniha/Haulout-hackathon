'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { WalletConnect } from '../wallet/WalletConnect';
import { ZkLoginButton } from '../wallet/ZkLoginButton';

export const Navigation: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const navLinks = [
    { href: '#features', label: 'Features' },
    { href: '#how-it-works', label: 'How It Works' },
    { href: '/marketplace', label: 'Marketplace' },
    { href: '/my-purchases', label: 'My Purchases' },
    { href: '/create-twin', label: 'Create Twin' }
  ];
  
  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled ? 'bg-[#0A0A0A]/95 backdrop-blur-lg border-b border-[#262626]' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Image 
              src="/logo.jpg" 
              alt="NexusSoul Logo" 
              width={48} 
              height={48} 
              className="rounded-lg object-cover"
            />
            <span className="text-xl font-bold text-[#F5F5F5] hidden sm:block">
            
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[#A3A3A3] hover:text-[#F5F5F5] transition-colors text-sm font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>
          
          {/* Wallet Connection */}
          <div className="hidden md:flex items-center">
            <WalletConnect />
          </div>
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-[#F5F5F5] hover:bg-[#1E1E1E] rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0A0A0A] border-t border-[#262626] animate-slide-up">
          <div className="px-8 py-6 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-[#A3A3A3] hover:text-[#F5F5F5] transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-[#262626] space-y-3">
              <WalletConnect />
              <ZkLoginButton />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
