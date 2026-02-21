export type Provider = "gemini" | "openai" | "anthropic" | "deepseek";

export const optimizePrompt = async (originalPrompt: string, tone: string, provider: Provider) => {
  const response = await fetch("/api/optimize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      originalPrompt,
      tone,
      provider,
    }),
  });

  if (!response.ok) {
    let message = "Failed to optimize prompt.";
    try {
      const errorData = await response.json();
      if (errorData?.error) {
        message = errorData.error;
      }
    } catch {
      // Keep default message when response is not JSON.
    }
    throw new Error(message);
  }

  const data = await response.json();
  return data.optimizedPrompt || "Failed to generate optimization.";
};
