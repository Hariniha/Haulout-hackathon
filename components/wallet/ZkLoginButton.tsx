'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Mail, Loader2 } from 'lucide-react';

export function ZkLoginButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleZkLogin = () => {
    setIsLoading(true);
    try {
      // zkLogin OAuth flow
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      const redirectUri = `${window.location.origin}/auth/callback`;
      
      // Generate nonce for zkLogin
      const nonce = generateNonce();
      sessionStorage.setItem('zklogin_nonce', nonce);
      
      // Redirect to Google OAuth
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=id_token&` +
        `scope=openid email profile&` +
        `nonce=${nonce}`;
      
      // Navigate to OAuth URL
      window.location.assign(authUrl);
    } catch (error) {
      console.error('zkLogin error:', error);
      setIsLoading(false);
    }
  };

  const generateNonce = () => {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  return (
    <Button
      variant="secondary"
      size="medium"
      icon={isLoading ? Loader2 : Mail}
      iconPosition="left"
      onClick={handleZkLogin}
      disabled={isLoading}
      className={isLoading ? 'animate-pulse' : ''}
    >
      {isLoading ? 'Connecting...' : 'Login with Google (zkLogin)'}
    </Button>
  );
}
