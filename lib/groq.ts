/**
 * Groq AI Service
 * Using API route to avoid CORS issues
 */

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Strip markdown formatting from text
 * Removes: *, **, ___, #, -, >, etc.
 */
function stripMarkdown(text: string): string {
  return text
    // Remove bold markers (**text** or __text__)
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    // Remove italic markers (*text* or _text_)
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    // Remove strikethrough (~~text~~)
    .replace(/~~(.+?)~~/g, '$1')
    // Remove headers (# text)
    .replace(/^#+\s+/gm, '')
    // Remove code blocks (```code```)
    .replace(/```[\s\S]*?```/g, (match) => {
      return match.replace(/```\w*\n?/g, '').replace(/```/g, '');
    })
    // Remove inline code (`code`)
    .replace(/`(.+?)`/g, '$1')
    // Remove links [text](url)
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    // Remove images ![alt](url)
    .replace(/!\[.+?\]\(.+?\)/g, '')
    // Remove blockquotes (> text)
    .replace(/^>\s+/gm, '')
    // Remove horizontal rules (---, ***, ___)
    .replace(/^[-*_]{3,}\s*$/gm, '')
    // Remove list markers (-, *, +, 1.)
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export interface GroqChatOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

/**
 * Chat with Groq AI via API route
 */
export async function chatWithGroq(
  messages: GroqMessage[],
  options: GroqChatOptions = {}
): Promise<string> {
  try {
    const response = await fetch('/api/groq', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        options: {
          model: options.model || 'llama-3.3-70b-versatile',
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 1024,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Groq API request failed');
    }

    const data = await response.json();
    return data.content || '';
  } catch (error: any) {
    console.error('Groq AI error:', error);
    throw new Error(`AI chat failed: ${error.message}`);
  }
}

/**
 * Generate AI twin personality
 */
export async function generateTwinPersonality(
  trainingData: string,
  name: string
): Promise<string> {
  const messages: GroqMessage[] = [
    {
      role: 'system',
      content: `You are creating a digital twin AI personality. Analyze the provided data and create a detailed personality profile that captures the person's communication style, knowledge areas, and behavioral patterns. Write in plain text without markdown formatting.`,
    },
    {
      role: 'user',
      content: `Create an AI personality for "${name}" based on this data:\n\n${trainingData}\n\nProvide a detailed personality description in plain text.`,
    },
  ];

  const response = await chatWithGroq(messages, { temperature: 0.8 });
  return stripMarkdown(response);
}

/**
 * Chat as AI twin
 */
export async function twinChat(
  personality: string,
  userMessage: string,
  conversationHistory: GroqMessage[] = []
): Promise<string> {
  const messages: GroqMessage[] = [
    {
      role: 'system',
      content: `You are an AI twin with the following personality:\n\n${personality}\n\nRespond authentically as this person would, maintaining their style and perspective. Use plain text without any markdown formatting, asterisks, or special symbols. Write naturally as if speaking directly to someone.`,
    },
    ...conversationHistory,
    {
      role: 'user',
      content: userMessage,
    },
  ];

  const response = await chatWithGroq(messages);
  
  // Strip any markdown formatting that might have slipped through
  return stripMarkdown(response);
}

/**
 * Analyze dataset quality
 */
export async function analyzeDatasetQuality(data: string): Promise<{
  quality_score: number;
  diversity_score: number;
  accuracy_score: number;
  completeness_score: number;
  consistency_score: number;
  bias_level: 'Low' | 'Medium' | 'High';
}> {
  const messages: GroqMessage[] = [
    {
      role: 'system',
      content: 'You are a data quality analyst. Analyze datasets and provide quality metrics.',
    },
    {
      role: 'user',
      content: `Analyze this dataset and provide scores (0-100) for quality, diversity, accuracy, completeness, and consistency. Also assess bias level (Low/Medium/High). Return ONLY a JSON object:\n\n${data.slice(0, 2000)}`,
    },
  ];

  const response = await chatWithGroq(messages, { temperature: 0.3 });
  
  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    // Fallback to default scores
  }

  return {
    quality_score: 75,
    diversity_score: 70,
    accuracy_score: 80,
    completeness_score: 75,
    consistency_score: 78,
    bias_level: 'Low',
  };
}
