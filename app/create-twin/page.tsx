'use client';

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';
import { CreateNewCard } from '@/components/ai-twin/CreateNewCard';
import { TwinCard } from '@/components/ai-twin/TwinCard';
import { CreateTwinModal } from '@/components/ai-twin/CreateTwinModal';
import { PricingModal } from '@/components/marketplace/PricingModal';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Users, Wallet, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCurrentAccount } from '@mysten/dapp-kit';

interface AITwin {
  id: string;
  name: string;
  avatar: string;
  createdAt: string;
  filesCount: number;
  conversationsCount: number;
  nftId?: string;
  blobId?: string;
  encryptionKey?: string;
  personality?: string;
  character?: string;
  tone?: string;
  bio?: string;
  isListed?: boolean;
  price?: number;
  creator?: string; // Wallet address of the creator
}

export default function CreateTwinPage() {
  const router = useRouter();
  const account = useCurrentAccount();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isWalletWarningOpen, setIsWalletWarningOpen] = useState(false);
  const [selectedTwin, setSelectedTwin] = useState<AITwin | null>(null);
  const [twins, setTwins] = useState<AITwin[]>([]);
  const [mounted, setMounted] = useState(false);
  
  // Load twins from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedTwins = localStorage.getItem('aiTwins');
    if (savedTwins) {
      try {
        setTwins(JSON.parse(savedTwins));
      } catch (error) {
        console.error('Failed to parse saved twins:', error);
        setTwins([]);
      }
    }
  }, []);
  
  // Save twins to localStorage whenever they change
  useEffect(() => {
    if (mounted && twins.length > 0) {
      localStorage.setItem('aiTwins', JSON.stringify(twins));
    }
  }, [twins, mounted]);
  
  const handleCreateTwin = (data: any) => {
    console.log('Creating twin with data:', data); // Debug log
    
    const twinDisplayName = data.twinName || data.name || 'My AI Twin';
    
    const newTwin: AITwin = {
      id: data.nftId || `twin_${Date.now()}`,
      name: twinDisplayName,
      avatar: twinDisplayName.charAt(0).toUpperCase(),
      createdAt: new Date().toISOString(),
      filesCount: data.files?.length || 0,
      conversationsCount: 0,
      nftId: data.nftId,
      blobId: data.blobId,
      encryptionKey: data.encryptionKey,
      personality: data.personality,
      character: data.character,
      tone: data.tone,
      bio: data.bio,
    };
    
    console.log('New twin created:', newTwin); // Debug log
    
    const updatedTwins = [...twins, newTwin];
    setTwins(updatedTwins);
    localStorage.setItem('aiTwins', JSON.stringify(updatedTwins)); // Ensure it's saved
    setIsModalOpen(false);
  };
  
  const handleDeleteTwin = (twinId: string) => {
    const updatedTwins = twins.filter(t => t.id !== twinId);
    setTwins(updatedTwins);
    localStorage.setItem('aiTwins', JSON.stringify(updatedTwins));
  };

  const handleCreateClick = () => {
    console.log('Create button clicked, account:', account);
    if (!account) {
      console.log('No wallet connected, showing warning');
      setIsWalletWarningOpen(true);
      return;
    }
    console.log('Wallet connected, opening create modal');
    setIsModalOpen(true);
  };

  const handleListMarketplace = (twin: AITwin) => {
    setSelectedTwin(twin);
    setIsPricingModalOpen(true);
  };

  const handleSetPrice = (price: number, isPublic: boolean) => {
    if (!selectedTwin || !account) return;

    const updatedTwins = twins.map(t =>
      t.id === selectedTwin.id
        ? { ...t, isListed: isPublic, price, creator: account.address }
        : t
    );
    
    setTwins(updatedTwins);
    localStorage.setItem('aiTwins', JSON.stringify(updatedTwins));
    
    // Also save to marketplace listings with creator address
    const marketplaceListings = JSON.parse(localStorage.getItem('marketplaceListings') || '[]');
    const newListing = {
      ...selectedTwin,
      price,
      isPublic,
      creator: account.address, // Store creator's wallet address for payments
      listedAt: new Date().toISOString(),
    };
    
    // Check if already listed, update or add
    const existingIndex = marketplaceListings.findIndex((l: any) => l.id === selectedTwin.id);
    if (existingIndex >= 0) {
      marketplaceListings[existingIndex] = newListing;
    } else {
      marketplaceListings.push(newListing);
    }
    
    localStorage.setItem('marketplaceListings', JSON.stringify(marketplaceListings));
    setIsPricingModalOpen(false);
  };
  
  if (!mounted) {
    return null; // Prevent hydration mismatch
  }
  
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navigation />
      
      <main className="pt-24 pb-16">
        {/* Page Header */}
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-[#F5F5F5] mb-2">
                Your AI Twins
              </h1>
              <p className="text-base text-[#A3A3A3]">
                Manage and create your digital twins
              </p>
            </div>
            
            {/* Usage Counter */}
            <div className="bg-[#1E1E1E] border border-[#262626] px-4 py-2 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-[#A3A3A3]" />
                <span className="text-sm font-medium text-[#A3A3A3]">
                  {twins.length} AI Twins Created
                </span>
              </div>
              <div className="w-48 h-2 bg-[#262626] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#D97706] to-[#DC2626] transition-all duration-300"
                  style={{ width: `${Math.min((twins.length / 10) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
          
          {/* Twins Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create New Card */}
            <CreateNewCard onClick={handleCreateClick} />
            
            {/* Existing Twins */}
            {twins.map((twin) => (
              <TwinCard
                key={twin.id}
                id={twin.id}
                name={twin.name}
                avatar={twin.avatar}
                createdAt={`Created ${new Date(twin.createdAt).toLocaleDateString()}`}
                filesCount={twin.filesCount}
                conversationsCount={twin.conversationsCount}
                isListed={twin.isListed}
                onChat={() => {
                  // Store current twin data for chat
                  localStorage.setItem('currentTwin', JSON.stringify(twin));
                  router.push(`/chat/${twin.id}`);
                }}
                onEdit={() => {}}
                onDelete={() => handleDeleteTwin(twin.id)}
                onListMarketplace={() => handleListMarketplace(twin)}
              />
            ))}
          </div>
        </div>
      </main>
      
      <Footer />
      
      {/* Create Twin Modal */}
      <CreateTwinModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onComplete={handleCreateTwin}
      />
      
      {/* Pricing Modal */}
      {selectedTwin && (
        <PricingModal
          isOpen={isPricingModalOpen}
          onClose={() => setIsPricingModalOpen(false)}
          twinName={selectedTwin.name}
          twinId={selectedTwin.id}
          onSetPrice={handleSetPrice}
        />
      )}
      
      {/* Wallet Warning Modal */}
      <Modal
        isOpen={isWalletWarningOpen}
        onClose={() => setIsWalletWarningOpen(false)}
        title="Connect Wallet Required"
      >
        <div className="p-6 space-y-6">
          <div className="flex items-start gap-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <h4 className="font-medium text-white">Wallet Connection Required</h4>
              <p className="text-sm text-[#A3A3A3]">
                You need to connect your Sui wallet to create an AI Twin. This is required to mint your twin as an NFT on the blockchain.
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-white">Why connect a wallet?</h5>
            <ul className="space-y-2 text-sm text-[#A3A3A3]">
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>Your AI Twin is minted as a unique NFT on the Sui blockchain</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>You own and control your digital twin permanently</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>Enable marketplace features and monetization</span>
              </li>
            </ul>
          </div>
          
          <div className="flex items-center gap-3 pt-4">
            <Button
              onClick={() => setIsWalletWarningOpen(false)}
              className="flex-1 bg-[#1E1E1E] hover:bg-[#262626] text-white border border-[#262626]"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setIsWalletWarningOpen(false);
                // Scroll to top where wallet button is and give visual cue
                window.scrollTo({ top: 0, behavior: 'smooth' });
                // Highlight the wallet button area
                setTimeout(() => {
                  const walletButton = document.querySelector('[class*="ConnectButton"]') as HTMLElement;
                  if (walletButton) {
                    walletButton.style.animation = 'pulse 2s ease-in-out 3';
                    walletButton.click();
                  }
                }, 300);
              }}
              className="flex-1 bg-gradient-to-r from-[#D97706] to-[#DC2626] hover:opacity-90 text-white"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
