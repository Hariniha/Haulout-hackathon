'use client';

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';
import { ListingCard } from '@/components/marketplace/ListingCard';
import { BuyAccessModal } from '@/components/marketplace/BuyAccessModal';
import { Search, Users, Store, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MarketplaceListing {
  id: string;
  name: string;
  creator?: string;
  description?: string;
  bio?: string;
  tags?: string[];
  character?: string;
  tone?: string;
  rating?: number;
  users?: number;
  messages?: number;
  price: number;
  featured?: boolean;
  isPublic?: boolean;
  listedAt?: string;
}

export default function MarketplacePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('popular');
  const [userListings, setUserListings] = useState<MarketplaceListing[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  
  // Load user listings from localStorage
  useEffect(() => {
    setMounted(true);
    const savedListings = localStorage.getItem('marketplaceListings');
    if (savedListings) {
      try {
        const parsed = JSON.parse(savedListings);
        setUserListings(parsed.filter((l: MarketplaceListing) => l.isPublic !== false));
      } catch (error) {
        console.error('Failed to parse marketplace listings:', error);
      }
    }
  }, []);

  const categories = ['Professional', 'Creative', 'Personal Growth', 'Entertainment', 'Research'];
  
  // Only show user-created listings (no mock data)
  const allListings = userListings.map(listing => ({
    id: listing.id,
    name: listing.name,
    creator: listing.creator || undefined, // Use actual wallet address or undefined
    description: listing.bio || listing.description || 'Your AI Digital Twin',
    tags: listing.character && listing.tone 
      ? [listing.character, listing.tone]
      : ['Personal', 'Custom'],
    rating: listing.rating || 5.0,
    users: listing.users || 0,
    messages: listing.messages || 0,
    price: listing.price,
    featured: false,
  }));

  // Filter and sort listings
  const filteredListings = allListings.filter(listing => {
    // Search filter
    if (searchQuery && !listing.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !listing.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Category filter
    if (selectedCategory.length > 0) {
      const hasMatchingTag = listing.tags.some(tag => 
        selectedCategory.some(cat => tag.toLowerCase().includes(cat.toLowerCase()))
      );
      if (!hasMatchingTag) return false;
    }
    
    return true;
  });

  // Sort listings
  const sortedListings = [...filteredListings].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return b.id.localeCompare(a.id);
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'popular':
      default:
        return (b.users || 0) - (a.users || 0);
    }
  });

  const handleCategoryToggle = (category: string) => {
    if (selectedCategory.includes(category)) {
      setSelectedCategory(selectedCategory.filter(c => c !== category));
    } else {
      setSelectedCategory([...selectedCategory, category]);
    }
  };

  const handleBuyClick = (listing: any) => {
    setSelectedListing(listing);
    setIsBuyModalOpen(true);
  };

  const handlePurchaseSuccess = () => {
    setPurchaseSuccess(true);
    // Reload the page or refresh listings
    setTimeout(() => {
      setPurchaseSuccess(false);
      // Optionally redirect to chat with the purchased twin
      if (selectedListing) {
        router.push(`/chat/${selectedListing.id}`);
      }
    }, 2000);
  };

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }
  
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navigation />
      
      <main className="pt-24">
        {/* Header */}
        <div className="py-12 px-8 bg-gradient-to-br from-[#0A0A0A] to-[#141414]">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-[#F5F5F5] mb-4">
              AI Twin Marketplace
            </h1>
            <p className="text-xl text-[#A3A3A3] mb-8">
              Discover and access unique AI personalities
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 flex items-center gap-3 focus-within:border-[#D97706] focus-within:ring-2 focus-within:ring-[#D97706]/20 transition-all">
                <Search className="w-5 h-5 text-[#525252]" />
                <input
                  type="text"
                  placeholder="Search AI twins by expertise, personality, or use case..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-[#F5F5F5] placeholder:text-[#525252]"
                />
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex gap-8 justify-center mt-8 text-sm text-[#A3A3A3]">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4" />
                <span>{allListings.length} AI Twins</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{categories.length} Categories</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>1.2K Creators</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="flex gap-8">
            {/* Filter Sidebar */}
            <div className="w-64 flex-shrink-0">
              <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 sticky top-24">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-[#F5F5F5]">Filters</h3>
                  <button
                    onClick={() => {
                      setSelectedCategory([]);
                      setSortBy('popular');
                    }}
                    className="text-sm text-[#D97706] hover:underline"
                  >
                    Clear
                  </button>
                </div>
                
                {/* Category Filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-[#F5F5F5] mb-3">Category</h4>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <label key={category} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCategory.includes(category)}
                          onChange={() => handleCategoryToggle(category)}
                          className="w-5 h-5 bg-[#1E1E1E] border-2 border-[#262626] rounded checked:bg-[#D97706] checked:border-[#D97706]"
                        />
                        <span className="text-sm text-[#A3A3A3]">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Sort By */}
                <div>
                  <h4 className="text-sm font-semibold text-[#F5F5F5] mb-3">Sort By</h4>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-[#1E1E1E] border border-[#262626] text-[#F5F5F5] px-3 py-2 rounded-lg focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20 focus:outline-none"
                  >
                    <option value="popular">Most Popular</option>
                    <option value="newest">Newest</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Listings Grid */}
            <div className="flex-1">
              {sortedListings.length === 0 ? (
                <div className="text-center py-16">
                  <Store className="w-16 h-16 text-[#525252] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[#F5F5F5] mb-2">
                    No AI Twins Found
                  </h3>
                  <p className="text-[#A3A3A3] mb-6">
                    {searchQuery || selectedCategory.length > 0
                      ? 'Try adjusting your filters or search query'
                      : 'Create your first AI twin and list it on the marketplace!'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      {...listing}
                      onPreview={() => console.log('Preview', listing.id)}
                      onBuy={() => handleBuyClick(listing)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />

      {/* Buy Access Modal */}
      {selectedListing && (
        <BuyAccessModal
          isOpen={isBuyModalOpen}
          onClose={() => setIsBuyModalOpen(false)}
          listing={selectedListing}
          onSuccess={handlePurchaseSuccess}
        />
      )}

      {/* Success Message */}
      {purchaseSuccess && (
        <div className="fixed top-24 right-8 bg-[#059669] text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-slide-in">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <span className="text-[#059669] text-lg">✓</span>
            </div>
            <div>
              <p className="font-semibold">Purchase Successful!</p>
              <p className="text-sm opacity-90">Redirecting to chat...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
