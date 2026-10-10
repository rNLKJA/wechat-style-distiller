/**
 * AI client adapters for Anthropic and OpenAI
 * BYOK (Bring Your Own Key) - keys stored client-side only
 */

export type AIProvider = 'anthropic' | 'openai';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
}

export interface AIClientOptions {
  provider: AIProvider;
  apiKey: string;
  model: string;
}

/**
 * Call Anthropic Messages API
 */
async function callAnthropic(
  messages: AIMessage[],
  apiKey: string,
  model: string
): Promise<AIResponse> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 1024
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${error}`);
  }

  const data = await response.json();

  return {
    content: data.content[0].text,
    usage: {
      input_tokens: data.usage.input_tokens,
      output_tokens: data.usage.output_tokens
    }
  };
}

/**
 * Call OpenAI Chat Completions API
 */
async function callOpenAI(
  messages: AIMessage[],
  apiKey: string,
  model: string
): Promise<AIResponse> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 1024
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${error}`);
  }

  const data = await response.json();

  return {
    content: data.choices[0].message.content,
    usage: {
      input_tokens: data.usage?.prompt_tokens,
      output_tokens: data.usage?.completion_tokens
    }
  };
}

/**
 * Unified AI client
 */
export async function callAI(
  messages: AIMessage[],
  options: AIClientOptions
): Promise<AIResponse> {
  const { provider, apiKey, model } = options;

  if (!apiKey) {
    throw new Error('API key is required');
  }

  if (provider === 'anthropic') {
    return callAnthropic(messages, apiKey, model);
  } else if (provider === 'openai') {
    return callOpenAI(messages, apiKey, model);
  } else {
    throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * Default model configurations
 */
export const DEFAULT_MODELS = {
  anthropic: 'claude-3-5-haiku-20241022',
  openai: 'gpt-4o-mini'
} as const;
