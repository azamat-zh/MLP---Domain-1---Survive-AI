// ─── Shared RunPod vLLM caller (AI call sites 1 & 2) ───────────────────────
// One self-hosted endpoint serves both AI call sites:
//   · /api/extract-cv — CV → structured profile (strict JSON-object decoding)
//   · /api/coach      — narration of deterministic match facts (prose)
// The endpoint id defaults to the shared team deployment `skillcast-qwen`
// (Qwen2.5-7B-Instruct on vLLM, EU-RO-1); the API key comes from the
// environment. Without a key every caller falls back deterministically —
// the core never depends on the LLM being reachable.

const ENDPOINT_ID = process.env.RUNPOD_ENDPOINT_ID ?? '3sz0imio0udhna';

export const RUNPOD_MODEL = 'Qwen2.5-7B-Instruct (vLLM on RunPod)';

export interface RunpodChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface RunpodChatInput {
  messages: RunpodChatMessage[];
  maxTokens?: number;
  temperature?: number;
  responseFormat?: { type: 'json_object' };
}

/**
 * One synchronous chat completion against the shared endpoint. Returns the
 * assistant's message content, or null when the endpoint is unconfigured
 * (no API key), unreachable, or returned something unusable. Callers treat
 * null as "use the deterministic fallback".
 */
export async function runpodChat(input: RunpodChatInput): Promise<string | null> {
  const key = process.env.RUNPOD_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`https://api.runpod.ai/v2/${ENDPOINT_ID}/runsync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        input: {
          messages: input.messages,
          max_tokens: input.maxTokens ?? 512,
          temperature: input.temperature ?? 0,
          ...(input.responseFormat ? { response_format: input.responseFormat } : {}),
        },
      }),
      signal: AbortSignal.timeout(50000),
    });
    if (!res.ok) return null;
    const payload = (await res.json()) as {
      status?: string;
      output?: Array<{ choices?: Array<{ message?: { content?: string } }> }>;
    };
    if (payload.status !== 'COMPLETED') return null;
    return payload.output?.[0]?.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}