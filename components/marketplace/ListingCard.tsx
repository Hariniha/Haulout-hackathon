'use client';

import React from 'react';
import { Star, Users, MessageSquare, Eye, ShoppingCart } from 'lucide-react';
import { Button } from '../ui/Button';

interface ListingCardProps {
  id: string;
  name: string;
  creator?: string;
  description: string;
  tags: string[];
  rating: number;
  users: number;
  messages: number;
  price: number;
  featured?: boolean;
  onPreview: () => void;
  onBuy: () => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  name,
  creator,
  description,
  tags,
  rating,
  users,
  messages,
  price,
  featured = false,
  onPreview,
  onBuy
}) => {
  return (
    <div className="bg-[#1E1E1E] border border-[#262626] rounded-xl overflow-hidden hover:border-[#404040] hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer">
      {/* Image/Avatar Section */}
      <div className="h-48 bg-gradient-to-br from-[#D97706]/30 to-[#DC2626]/30 relative flex items-center justify-center">
        <div className="w-24 h-24 bg-gradient-to-br from-[#D97706] to-[#DC2626] rounded-2xl flex items-center justify-center">
          <span className="text-4xl text-white font-bold">{name.charAt(0)}</span>
        </div>
        
        {/* Featured Badge */}
        {featured && (
          <div className="absolute top-4 left-4 bg-[#D97706] text-white px-3 py-1 rounded-full text-xs font-semibold">
            Featured
          </div>
        )}
        
        {/* Rating */}
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur px-2 py-1 rounded-full flex items-center gap-1">
          <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
          <span className="text-xs text-white font-medium">{rating}</span>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {/* Twin Name */}
        <h3 className="text-xl font-semibold text-[#F5F5F5] truncate mb-2">
          {name}
        </h3>
        
        {/* Creator */}
        <p className="text-sm text-[#525252] mb-4">
          by {creator ? `@${creator.slice(0, 6)}...${creator.slice(-4)}` : 'Anonymous'}
        </p>
        
        {/* Description */}
        <p className="text-sm text-[#A3A3A3] leading-relaxed line-clamp-3 mb-4">
          {description}
        </p>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-[#D97706]/10 text-[#D97706] text-xs font-medium rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
        
        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-[#525252] mb-4">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{users} users</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            <span>{messages} messages</span>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="p-6 pt-4 border-t border-[#262626] flex items-center justify-between">
        <div className="text-2xl font-bold text-[#D97706]">
          {price} <span className="text-sm font-normal">credits</span>
        </div>
        
        <div className="flex gap-2">
          <Button variant="ghost" size="small" icon={Eye} onClick={onPreview} />
          <Button variant="primary" size="small" icon={ShoppingCart} iconPosition="left" onClick={onBuy}>
            Buy
          </Button>
        </div>
      </div>
    </div>
  );
};
