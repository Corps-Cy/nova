interface ChatConfig {
  model: string;
  api_key: string;
  base_url: string;
  isAnthropic: boolean;
}

export function resolveChatConfig(kbModel?: string, kbApiKey?: string, kbBaseUrl?: string): ChatConfig {
  const isAnthropic = kbBaseUrl === 'anthropic' || kbModel?.includes('claude');
  let baseUrl = kbBaseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  let apiKey = kbApiKey || process.env.OPENAI_API_KEY || '';

  if (isAnthropic) {
    apiKey = kbApiKey || process.env.ANTHROPIC_API_KEY || '';
    baseUrl = 'https://api.anthropic.com';
  }

  return {
    model: kbModel || process.env.NOVA_MODEL || 'gpt-4o-mini',
    api_key: apiKey,
    base_url: baseUrl,
    isAnthropic,
  };
}

export async function chatCompletion(messages: { role: string; content: string }[], config: ChatConfig): Promise<string> {
  if (config.isAnthropic) {
    return anthropicChat(messages, config);
  }

  const url = `${config.base_url}/chat/completions`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.api_key}`,
    },
    body: JSON.stringify({ model: config.model, messages, temperature: 0.3, max_tokens: 2000 }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Chat API error: ${res.status} - ${err}`);
  }

  const data = await res.json() as any;
  return data.choices[0].message.content;
}

async function anthropicChat(messages: { role: string; content: string }[], config: ChatConfig): Promise<string> {
  const system = messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
  const userMessages = messages.filter(m => m.role !== 'system');

  const res = await fetch(`${config.base_url}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.api_key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 2000,
      system,
      messages: userMessages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error: ${res.status} - ${err}`);
  }

  const data = await res.json() as any;
  return data.content[0].text;
}
