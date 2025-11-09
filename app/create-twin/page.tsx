'use client';

import React, { useState } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';
import { CreateNewCard } from '@/components/ai-twin/CreateNewCard';
import { TwinCard } from '@/components/ai-twin/TwinCard';
import { CreateTwinModal } from '@/components/ai-twin/CreateTwinModal';
import { Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CreateTwinPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [twins, setTwins] = useState([
    {
      id: '1',
      name: 'Professional Me',
      avatar: 'P',
      createdAt: 'Created 2 days ago',
      filesCount: 12,
      conversationsCount: 47
    },
    {
      id: '2',
      name: 'Creative Twin',
      avatar: 'C',
      createdAt: 'Created 1 week ago',
      filesCount: 8,
      conversationsCount: 23
    }
  ]);
  
  const handleCreateTwin = (data: { twinName: string; character: string; files?: File[] }) => {
    // In real app, this would call API
    const newTwin = {
      id: String(twins.length + 1),
      name: data.twinName,
      avatar: data.twinName.charAt(0),
      createdAt: 'Created just now',
      filesCount: data.files?.length || 0,
      conversationsCount: 0
    };
    setTwins([...twins, newTwin]);
    setIsModalOpen(false);
  };
  
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
                  {twins.length}/3 Free Twins Created
                </span>
              </div>
              <div className="w-48 h-2 bg-[#262626] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#D97706] to-[#DC2626] transition-all duration-300"
                  style={{ width: `${(twins.length / 3) * 100}%` }}
                />
              </div>
            </div>
          </div>
          
          {/* Twins Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create New Card */}
            <CreateNewCard onClick={() => setIsModalOpen(true)} />
            
            {/* Existing Twins */}
            {twins.map((twin) => (
              <TwinCard
                key={twin.id}
                {...twin}
                onChat={() => router.push(`/chat/${twin.id}`)}
                onEdit={() => {}}
                onDelete={() => setTwins(twins.filter(t => t.id !== twin.id))}
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
    </div>
  );
}
