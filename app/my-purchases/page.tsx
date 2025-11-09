'use client';

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';
import { ShoppingBag, Calendar, DollarSign, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

interface Purchase {
  listingId: string;
  twinName: string;
  price: number;
  purchasedAt: string;
  buyer: string;
  transactionId: string;
}

export default function MyPurchasesPage() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedPurchases = localStorage.getItem('purchasedAccess');
    if (savedPurchases) {
      try {
        setPurchases(JSON.parse(savedPurchases));
      } catch (error) {
        console.error('Failed to parse purchases:', error);
      }
    }
  }, []);

  const totalSpent = purchases.reduce((sum, p) => sum + p.price, 0);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navigation />
      
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[#F5F5F5] mb-2">
              My Purchases
            </h1>
            <p className="text-base text-[#A3A3A3]">
              AI twins you have access to
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <ShoppingBag className="w-5 h-5 text-[#D97706]" />
                <span className="text-sm text-[#A3A3A3]">Total Purchases</span>
              </div>
              <p className="text-3xl font-bold text-[#F5F5F5]">{purchases.length}</p>
            </div>

            <div className="bg-[#141414] border border-[#262626] rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-[#059669]" />
                <span className="text-sm text-[#A3A3A3]">Total Spent</span>
              </div>
              <p className="text-3xl font-bold text-[#F5F5F5]">{totalSpent} SUI</p>
            </div>

            <div className="bg-[#141414] border border-[#262626] rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="w-5 h-5 text-[#D97706]" />
                <span className="text-sm text-[#A3A3A3]">Available</span>
              </div>
              <p className="text-3xl font-bold text-[#F5F5F5]">{purchases.length}</p>
            </div>
          </div>

          {/* Purchases List */}
          {purchases.length === 0 ? (
            <div className="text-center py-16 bg-[#141414] border border-[#262626] rounded-xl">
              <ShoppingBag className="w-16 h-16 text-[#525252] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#F5F5F5] mb-2">
                No Purchases Yet
              </h3>
              <p className="text-[#A3A3A3] mb-6">
                Browse the marketplace to discover and purchase AI twins
              </p>
              <Button
                variant="primary"
                onClick={() => router.push('/marketplace')}
              >
                Browse Marketplace
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {purchases.map((purchase) => (
                <div
                  key={purchase.transactionId}
                  className="bg-[#141414] border border-[#262626] rounded-xl p-6 hover:border-[#404040] transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#D97706] to-[#DC2626] rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-xl text-white font-bold">
                          {purchase.twinName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-[#F5F5F5] mb-1">
                          {purchase.twinName}
                        </h3>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-[#A3A3A3] mb-3">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(purchase.purchasedAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="w-4 h-4" />
                            <span>{purchase.price} SUI</span>
                          </div>
                        </div>

                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#059669]/10 border border-[#059669]/30 rounded-full">
                          <div className="w-2 h-2 bg-[#059669] rounded-full"></div>
                          <span className="text-xs text-[#059669] font-medium">Lifetime Access</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="small"
                      icon={MessageSquare}
                      iconPosition="left"
                      onClick={() => {
                        // Store twin data and navigate to chat
                        const accessibleTwins = JSON.parse(localStorage.getItem('accessibleTwins') || '[]');
                        const twin = accessibleTwins.find((t: any) => t.id === purchase.listingId);
                        if (twin) {
                          localStorage.setItem('currentTwin', JSON.stringify(twin));
                          router.push(`/chat/${purchase.listingId}`);
                        }
                      }}
                    >
                      Chat Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
