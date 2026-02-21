import { GoogleGenAI } from "@google/genai";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
  },
};

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function buildSystemInstruction(tone) {
  return `You are an expert Prompt Engineer. Your task is to optimize the user's provided prompt to be more effective, clear, and structured.

Follow these rules:
1. Maintain the original intent of the prompt.
2. Use a ${tone} tone as requested.
3. Structure the prompt using clear instructions, context, and constraints if applicable.
4. If the original prompt is too vague, add relevant details to make it more specific.
5. Output ONLY the optimized prompt text. Do not include any introductory or concluding remarks.`;
}

const PROVIDERS = ["gemini", "openai", "anthropic", "deepseek"];

function getApiKeyForProvider(provider) {
  const rawKey =
    provider === "gemini"
      ? process.env.GEMINI_API_KEY
      : provider === "openai"
      ? process.env.OPENAI_API_KEY
      : provider === "anthropic"
      ? process.env.ANTHROPIC_API_KEY
      : provider === "deepseek"
      ? process.env.DEEPSEEK_API_KEY
      : undefined;

  if (!rawKey) return undefined;

  const key = rawKey.trim();
  const placeholderValues = new Set([
    "your_gemini_key",
    "your_openai_key",
    "your_anthropic_key",
    "your_deepseek_key",
    "MY_GEMINI_API_KEY",
    "MY_OPENAI_API_KEY",
    "MY_ANTHROPIC_API_KEY",
    "MY_DEEPSEEK_API_KEY",
  ]);

  if (!key || placeholderValues.has(key)) {
    return undefined;
  }

  return key;
}

function resolveProviderWithKey(requestedProvider) {
  const preferred = PROVIDERS.includes(requestedProvider) ? requestedProvider : "gemini";
  if (getApiKeyForProvider(preferred)) {
    return preferred;
  }

  for (const provider of PROVIDERS) {
    if (getApiKeyForProvider(provider)) {
      return provider;
    }
  }

  return null;
}

async function optimizeWithGemini({ apiKey, originalPrompt, systemInstruction }) {
  const ai = new GoogleGenAI({ apiKey });
  const model = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
  const response = await ai.models.generateContent({
    model,
    contents: originalPrompt,
    config: {
      systemInstruction,
      temperature: 0.7,
    },
  });
  return response.text || "Failed to generate optimization.";
}

async function optimizeWithOpenAI({ apiKey, originalPrompt, systemInstruction }) {
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: originalPrompt },
      ],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "OpenAI request failed.");
  }

  return data?.choices?.[0]?.message?.content?.trim() || "Failed to generate optimization.";
}

async function optimizeWithAnthropic({ apiKey, originalPrompt, systemInstruction }) {
  const model = process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest";
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 800,
      temperature: 0.7,
      system: systemInstruction,
      messages: [{ role: "user", content: originalPrompt }],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "Anthropic request failed.");
  }

  const text = data?.content?.find((item) => item?.type === "text")?.text;
  return text?.trim() || "Failed to generate optimization.";
}

async function optimizeWithDeepSeek({ apiKey, originalPrompt, systemInstruction }) {
  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";
  const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: originalPrompt },
      ],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "DeepSeek request failed.");
  }

  return data?.choices?.[0]?.message?.content?.trim() || "Failed to generate optimization.";
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { originalPrompt, tone, provider } = req.body || {};

  if (!originalPrompt || typeof originalPrompt !== "string") {
    return res.status(400).json({ error: "originalPrompt is required." });
  }

  const selectedTone = typeof tone === "string" && tone.trim() ? tone : "professional";
  const requestedProvider = typeof provider === "string" ? provider : "gemini";
  const selectedProvider = resolveProviderWithKey(requestedProvider);
  const systemInstruction = buildSystemInstruction(selectedTone);

  try {
    if (!selectedProvider) {
      return res.status(500).json({
        error: "No API key configured. Set GEMINI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, or DEEPSEEK_API_KEY.",
      });
    }

    let optimizedPrompt = "";

    if (selectedProvider === "gemini") {
      const apiKey = getApiKeyForProvider("gemini");
      optimizedPrompt = await optimizeWithGemini({ apiKey, originalPrompt, systemInstruction });
    } else if (selectedProvider === "openai") {
      const apiKey = getApiKeyForProvider("openai");
      optimizedPrompt = await optimizeWithOpenAI({ apiKey, originalPrompt, systemInstruction });
    } else if (selectedProvider === "anthropic") {
      const apiKey = getApiKeyForProvider("anthropic");
      optimizedPrompt = await optimizeWithAnthropic({ apiKey, originalPrompt, systemInstruction });
    } else if (selectedProvider === "deepseek") {
      const apiKey = getApiKeyForProvider("deepseek");
      optimizedPrompt = await optimizeWithDeepSeek({ apiKey, originalPrompt, systemInstruction });
    } else {
      return res.status(400).json({ error: "Unsupported provider." });
    }

    return res.status(200).json({
      optimizedPrompt,
      provider: selectedProvider,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return res.status(500).json({ error: message });
  }
}
