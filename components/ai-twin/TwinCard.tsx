'use client';

import React from 'react';
import { Calendar, Database, MessageSquare, Edit, Trash, MoreVertical, Store } from 'lucide-react';
import { Button } from '../ui/Button';

interface TwinCardProps {
  id: string;
  name: string;
  avatar: string;
  createdAt: string;
  filesCount: number;
  conversationsCount: number;
  isListed?: boolean;
  onChat: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onListMarketplace?: () => void;
}

export const TwinCard: React.FC<TwinCardProps> = ({
  name,
  createdAt,
  filesCount,
  conversationsCount,
  isListed = false,
  onChat,
  onEdit,
  onDelete,
  onListMarketplace
}) => {
  return (
    <div className="bg-[#1E1E1E] border border-[#262626] p-6 rounded-2xl hover:border-[#404040] hover:shadow-lg transition-all duration-300 flex flex-col min-h-[300px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        {/* Avatar */}
        <div className="w-16 h-16 bg-gradient-to-br from-[#D97706] to-[#DC2626] rounded-xl flex items-center justify-center">
          <span className="text-2xl font-bold text-white">
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
        
        {/* Menu */}
        <button className="p-1 text-[#525252] hover:text-[#F5F5F5] transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
      
      {/* Twin Name */}
      <h3 className="text-xl font-semibold text-[#F5F5F5] mb-2">
        {name}
      </h3>
      
      {/* Creation Date */}
      <div className="flex items-center gap-2 text-sm text-[#525252] mb-4">
        <Calendar className="w-4 h-4" />
        <span>{createdAt}</span>
      </div>
      
      {/* Stats */}
      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2 text-xs text-[#A3A3A3]">
          <Database className="w-4 h-4" />
          <span>{filesCount} files</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#A3A3A3]">
          <MessageSquare className="w-4 h-4" />
          <span>{conversationsCount} chats</span>
        </div>
      </div>
      
      {/* Listing Badge */}
      {isListed && (
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#059669]/10 border border-[#059669]/30 rounded-full text-xs text-[#059669] font-medium">
            <Store className="w-3 h-3" />
            Listed on Marketplace
          </span>
        </div>
      )}
      
      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <Button 
          variant="primary" 
          size="small" 
          icon={MessageSquare} 
          iconPosition="left"
          onClick={onChat}
          className="flex-1"
        >
          Chat
        </Button>
        {!isListed && onListMarketplace && (
          <Button 
            variant="secondary" 
            size="small" 
            icon={Store}
            onClick={onListMarketplace}
            className="px-3"
            title="List on Marketplace"
          >
          </Button>
        )}
        <Button 
          variant="ghost" 
          size="small" 
          icon={Edit}
          onClick={onEdit}
          className="px-3"
        >
        </Button>
        <Button 
          variant="ghost" 
          size="small" 
          icon={Trash}
          onClick={onDelete}
          className="px-3 hover:text-[#DC2626]"
        >
        </Button>
      </div>
    </div>
  );
};
