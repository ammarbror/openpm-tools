export interface LLMConfig {
  baseUrl?: string;
  model?: string;
  apiKey?: string;
}

export async function enhanceWithLLM(
  content: string,
  config: LLMConfig & { fetchLike?: typeof globalThis.fetch } = {}
): Promise<string> {
  const fetchFn = config.fetchLike || globalThis.fetch;
  const apiKey = config.apiKey || process.env.LLM_API_KEY;

  if (!apiKey) {
    console.warn('Warning: LLM_API_KEY not set. Skipping LLM enhancement and returning raw markdown.');
    return content;
  }

  const baseUrl = config.baseUrl || process.env.LLM_BASE_URL || 'https://rvcnnth.abc-tunnel.us/v1';
  const model = config.model || process.env.LLM_MODEL || 'kira-free';

  try {
    const signal = AbortSignal.timeout(30000);
    const response = await fetchFn(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              'You are a technical document analyst. Enhance the provided markdown content by opening with a concise ## TL;DR section summarizing key takeaways and scope, eliminating parsing artifacts and residual or filler wording so prose is to the point, clear, and clean, structuring headings, and formatting tables cleanly without dropping source facts, provenance, or exact identifiers. Return ONLY the enhanced markdown content. Do not include markdown code block backticks around your entire response.',
          },
          {
            role: 'user',
            content,
          },
        ],
      }),
      signal,
    });

    if (!response.ok) {
      console.warn(`Warning: LLM API returned status ${response.status}. Falling back to raw markdown.`);
      return content;
    }

    const data = await response.json();
    const enhanced = data?.choices?.[0]?.message?.content;
    if (enhanced && typeof enhanced === 'string') {
      return enhanced.trim();
    }

    console.warn('Warning: LLM returned empty or invalid response. Falling back to raw markdown.');
    return content;
  } catch (error: any) {
    console.warn(`Warning: LLM enhancement failed (${error.message || error}). Falling back to raw markdown.`);
    return content;
  }
}
