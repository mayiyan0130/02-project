interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export interface AiClientConfig {
  apiKey: string;
  baseUrl: string;
  timeoutMs: number;
}

export class EponeClient {
  constructor(private readonly config: AiClientConfig) {}

  async completeJson<T>(model: string, systemPrompt: string, userPayload: unknown): Promise<T> {
    if (!this.config.apiKey) {
      throw new Error('AI API key is missing');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(`${this.config.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.3,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: JSON.stringify(userPayload) },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Epone request failed with status ${response.status}`);
      }

      const payload = (await response.json()) as ChatCompletionResponse;
      const content = payload.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Empty AI response content');
      }

      return JSON.parse(content) as T;
    } finally {
      clearTimeout(timer);
    }
  }
}
