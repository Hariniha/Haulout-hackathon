'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { ArrowRight, ArrowLeft, Upload, X, CheckCircle, Sparkles, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { storeOnWalrus } from '@/lib/walrus';
import { generateTwinPersonality } from '@/lib/groq';
import { encryptDataWithNewKey } from '@/lib/encryption';
import Tesseract from 'tesseract.js';

interface CreateTwinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: TwinData) => void;
}

interface TwinData {
  name: string;
  dateOfBirth: string;
  bio: string;
  files: File[];
  character: string;
  twinName: string;
  tone: string;
}

type Step = 1 | 2 | 3;

export const CreateTwinModal: React.FC<CreateTwinModalProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState<TwinData>({
    name: '',
    dateOfBirth: '',
    bio: '',
    files: [],
    character: 'geometric',
    twinName: 'My Digital Twin',
    tone: 'Friendly'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  
  const handleNext = () => {
    // Validate current step
    const newErrors: Record<string, string> = {};
    
    if (step === 1) {
      if (!formData.name) newErrors.name = 'Name is required';
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    }
    
    if (step === 2) {
      if (formData.files.length === 0) {
        newErrors.files = 'Please upload at least one file';
        return;
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    if (step < 3) {
      setStep((step + 1) as Step);
    }
  };
  
  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as Step);
    }
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData({ ...formData, files: [...formData.files, ...files] });
    setErrors({ ...errors, files: '' });
  };
  
  const removeFile = (index: number) => {
    const newFiles = formData.files.filter((_, i) => i !== index);
    setFormData({ ...formData, files: newFiles });
  };
  
  const handleComplete = async () => {
    if (!account) {
      setErrors({ wallet: 'Please connect your wallet first' });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Step 1: Extract text from images using Tesseract OCR
      setProcessingStep('Extracting text from images with Tesseract OCR...');
      let extractedText = formData.bio || '';
      
      const imageFiles = formData.files.filter(file => file.type.startsWith('image/'));
      for (const imageFile of imageFiles) {
        try {
          const { data: { text } } = await Tesseract.recognize(imageFile, 'eng', {
            logger: (m) => {
              if (m.status === 'recognizing text') {
                setProcessingStep(`OCR: Processing ${imageFile.name} - ${Math.round(m.progress * 100)}%`);
              }
            }
          });
          extractedText += `\n\n--- From ${imageFile.name} ---\n${text}`;
        } catch (ocrError) {
          console.error(`OCR failed for ${imageFile.name}:`, ocrError);
        }
      }
      
      // Step 2: Generate AI personality from extracted data
      setProcessingStep('Generating AI twin personality...');
      const personalityData = await generateTwinPersonality(
        extractedText,
        formData.name
      );
      
      // Step 3: Encrypt the training data with SEAL Protocol
      setProcessingStep('Encrypting data with SEAL Protocol (AES-256-GCM)...');
      const trainingData = JSON.stringify({
        name: formData.name,
        dateOfBirth: formData.dateOfBirth,
        bio: formData.bio,
        extractedText,
        personality: personalityData,
        character: formData.character,
        twinName: formData.twinName,
        tone: formData.tone,
        createdAt: new Date().toISOString()
      });
      
      const { encrypted, iv, key: encryptionKey } = await encryptDataWithNewKey(trainingData);
      
      // Step 4: Store encrypted data on Walrus
      setProcessingStep('Uploading encrypted data to Walrus decentralized storage...');
      const encryptedBlob = new Blob([encrypted], { type: 'application/octet-stream' });
      const walrusResult = await storeOnWalrus(encryptedBlob);
      
      if (!walrusResult.blobId) {
        throw new Error('Failed to upload to Walrus');
      }
      
      // Step 5: Mint NFT on Sui blockchain
      setProcessingStep('Minting AI Twin NFT on Sui blockchain...');
      
      // Import contract functions dynamically to avoid circular deps
      const { Transaction } = await import('@mysten/sui/transactions');
      const { CONTRACT_CONFIG } = await import('@/lib/sui/contract');
      
      // Generate unique twin_id using timestamp + wallet address
      const uniqueTwinId = `twin_${Date.now()}_${account.address.slice(-8)}`;
      
      // Prepare metadata JSON
      const metadata = JSON.stringify({
        character: formData.character,
        tone: formData.tone,
        dateOfBirth: formData.dateOfBirth,
      });
      
      const tx = new Transaction();
      
      // Call the mint_ai_twin function with correct argument order:
      // 1. registry (shared object)
      // 2. twin_id (unique identifier)
      // 3. name (twin name)
      // 4. description (bio/description)
      // 5. training_data_blob_id (Walrus blob ID)
      // 6. metadata (JSON string with extra info)
      tx.moveCall({
        target: `${CONTRACT_CONFIG.PACKAGE_ID}::ai_twin_nft::mint_ai_twin`,
        arguments: [
          tx.object(CONTRACT_CONFIG.AI_TWIN_REGISTRY),
          tx.pure.string(uniqueTwinId), // Unique twin_id
          tx.pure.string(formData.twinName), // Twin name
          tx.pure.string(formData.bio || 'AI Digital Twin'), // Description
          tx.pure.string(walrusResult.blobId), // Walrus blob_id
          tx.pure.string(metadata), // Metadata JSON
        ],
      });
      
      setProcessingStep('Waiting for transaction confirmation...');
      const result = await signAndExecute({
        transaction: tx,
      });
      
      if (!result || !result.digest) {
        throw new Error('Transaction failed');
      }
      
      setProcessingStep('Success! AI Twin created.');
      
      // Complete with all the data including unique twin_id
      onComplete({
        ...formData,
        id: uniqueTwinId, // Save the unique twin_id
        nftId: result.digest,
        blobId: walrusResult.blobId,
        encryptionKey,
        personality: personalityData
      } as any);
      
      // Reset form
      setFormData({
        name: '',
        dateOfBirth: '',
        bio: '',
        files: [],
        character: 'geometric',
        twinName: 'My Digital Twin',
        tone: 'Friendly'
      });
      setStep(1);
      setIsProcessing(false);
      setProcessingStep('');
      
    } catch (error: any) {
      console.error('AI Twin creation failed:', error);
      setErrors({ 
        processing: error.message || 'Failed to create AI Twin. Please try again.' 
      });
      setIsProcessing(false);
      setProcessingStep('');
    }
  };
  
  const characters = [
    'Geometric', 'Minimal', 'Tech', 'Nature', 
    'Cosmic', 'Professional', 'Creative', 'Modern'
  ];
  
  const tones = ['Professional', 'Casual', 'Friendly'];
  
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Create Your AI Twin"
      maxWidth="3xl"
    >
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {[1, 2, 3].map((s, idx) => (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-200 ${
                  s < step
                    ? 'bg-[#059669] border-[#059669] text-white'
                    : s === step
                    ? 'bg-[#D97706] border-[#D97706] text-white'
                    : 'bg-[#1E1E1E] border-[#404040] text-[#525252]'
                }`}
              >
                {s < step ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              <span
                className={`text-xs mt-2 ${
                  s === step ? 'text-[#D97706]' : 'text-[#525252]'
                }`}
              >
                {s === 1 ? 'Basic Info' : s === 2 ? 'Upload Data' : 'Customize'}
              </span>
            </div>
            {idx < 2 && (
              <div
                className={`w-16 h-0.5 ${
                  s < step ? 'bg-[#D97706]' : 'bg-[#262626]'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
      
      {/* Step Content */}
      <div className="space-y-6">
        {step === 1 && (
          <>
            <Input
              label="What should we call you?"
              placeholder="Enter your name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={errors.name}
              required
            />
            
            <Input
              label="Date of Birth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              error={errors.dateOfBirth}
              required
            />
            
            <Textarea
              label="Tell us about yourself (Optional)"
              placeholder="Your interests, personality, what makes you unique..."
              rows={4}
              maxLength={500}
              showCounter
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            />
          </>
        )}
        
        {step === 2 && (
          <>
            <div>
              <h3 className="text-lg font-semibold text-[#F5F5F5] mb-2">Upload Your Data</h3>
              <p className="text-sm text-[#A3A3A3] mb-4">
                Upload conversations, emails, documents, or images containing your messages.
              </p>
            </div>
            
            {/* File Upload Zone */}
            <label className="block">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept=".png,.jpg,.jpeg,.txt,.pdf"
              />
              <div className="border-2 border-dashed border-[#404040] rounded-xl p-8 text-center cursor-pointer hover:border-[#D97706] hover:bg-[#1C1C1C] transition-all duration-200">
                <Upload className="w-12 h-12 text-[#D97706] mx-auto mb-4" />
                <p className="text-base text-[#F5F5F5] mb-2">Drag and drop files here</p>
                <p className="text-sm text-[#A3A3A3] mb-1">or click to browse</p>
                <p className="text-xs text-[#525252]">PNG, JPG, TXT, PDF (max 5MB per file)</p>
              </div>
            </label>
            
            {errors.files && (
              <p className="text-sm text-[#DC2626]">{errors.files}</p>
            )}
            
            {/* Uploaded Files List */}
            {formData.files.length > 0 && (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {formData.files.map((file, index) => (
                  <div
                    key={index}
                    className="bg-[#1E1E1E] border border-[#262626] p-4 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {file.type.startsWith('image/') ? (
                        <ImageIcon className="w-5 h-5 text-[#D97706]" />
                      ) : (
                        <FileText className="w-5 h-5 text-[#D97706]" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-[#F5F5F5]">{file.name}</p>
                        <p className="text-xs text-[#525252]">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-[#525252] hover:text-[#DC2626] transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        
        {step === 3 && (
          <>
            <div>
              <h3 className="text-xl font-bold text-[#F5F5F5] mb-2">
                Customize Your AI Twin
              </h3>
              <p className="text-sm text-[#A3A3A3] mb-6">
                Choose how your AI twin will look and interact
              </p>
              
              <div className="grid grid-cols-4 gap-4 mb-8">
                {characters.map((char) => (
                  <div
                    key={char}
                    onClick={() => setFormData({ ...formData, character: char.toLowerCase() })}
                    className={`aspect-square bg-[#1E1E1E] border-2 rounded-xl p-4 cursor-pointer flex items-center justify-center transition-all duration-200 hover:scale-105 ${
                      formData.character === char.toLowerCase()
                        ? 'border-[#D97706] shadow-lg shadow-orange-900/20'
                        : 'border-[#262626] hover:border-[#404040]'
                    }`}
                  >
                    <div className="w-full h-full bg-gradient-to-br from-[#D97706]/30 to-[#DC2626]/30 rounded-lg flex items-center justify-center">
                      <span className="text-xs font-medium text-[#F5F5F5]">{char}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <Input
              label="Name Your AI Twin"
              placeholder="My Digital Twin"
              value={formData.twinName}
              onChange={(e) => setFormData({ ...formData, twinName: e.target.value })}
              maxLength={50}
            />
            
            <div>
              <label className="block text-sm font-medium text-[#F5F5F5] mb-3">
                Conversation Style
              </label>
              <div className="flex gap-3">
                {tones.map((tone) => (
                  <button
                    key={tone}
                    onClick={() => setFormData({ ...formData, tone })}
                    className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                      formData.tone === tone
                        ? 'bg-[#D97706] text-white border-2 border-[#D97706] shadow-lg'
                        : 'bg-[#1E1E1E] border-2 border-[#262626] text-[#A3A3A3] hover:border-[#404040]'
                    }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Summary Card */}
            <div className="mt-6 p-5 bg-gradient-to-br from-[#1E1E1E] to-[#141414] border-2 border-[#D97706]/30 rounded-xl">
              <h4 className="text-sm font-semibold text-[#D97706] mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Ready to Create
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#737373]">Name:</span>
                  <span className="text-[#F5F5F5] font-medium">{formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#737373]">Files:</span>
                  <span className="text-[#F5F5F5] font-medium">{formData.files.length} uploaded</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#737373]">Twin Name:</span>
                  <span className="text-[#F5F5F5] font-medium">{formData.twinName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#737373]">Style:</span>
                  <span className="text-[#F5F5F5] font-medium capitalize">{formData.character} · {formData.tone}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Processing Status */}
      {isProcessing && (
        <div className="mt-6 p-4 bg-[#1E1E1E] border border-[#D97706] rounded-lg">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-[#D97706] animate-spin" />
            <div>
              <p className="text-sm font-medium text-[#F5F5F5]">Creating Your AI Twin...</p>
              <p className="text-xs text-[#A3A3A3] mt-1">{processingStep}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Error Display */}
      {errors.processing && (
        <div className="mt-6 p-4 bg-[#DC2626]/10 border border-[#DC2626] rounded-lg">
          <p className="text-sm text-[#DC2626]">{errors.processing}</p>
        </div>
      )}
      
      {errors.wallet && (
        <div className="mt-6 p-4 bg-[#DC2626]/10 border border-[#DC2626] rounded-lg">
          <p className="text-sm text-[#DC2626]">{errors.wallet}</p>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-[#262626]">
        {step > 1 && !isProcessing ? (
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-[#1E1E1E] hover:bg-[#252525] border border-[#262626] text-[#F5F5F5] rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        ) : (
          <div></div>
        )}
        
        {step < 3 ? (
          <button
            onClick={handleNext}
            disabled={isProcessing}
            className="px-8 py-3 bg-[#D97706] hover:bg-[#B45309] text-white rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-orange-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            Next
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleComplete}
            disabled={isProcessing}
            className={`px-10 py-4 bg-gradient-to-r from-[#D97706] to-[#DC2626] hover:from-[#B45309] hover:to-[#B91C1C] text-white rounded-xl font-bold text-lg transition-all duration-200 hover:shadow-2xl hover:shadow-orange-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 ${
              isProcessing ? 'animate-pulse' : 'hover:scale-105'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                Create My AI Twin
              </>
            )}
          </button>
        )}
      </div>
    </Modal>
  );
};
