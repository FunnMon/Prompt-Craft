<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# PromptCraft Optimizer (Next.js)

This project has been migrated to Next.js (Pages Router) with a backend API route.

## Run Locally

**Prerequisites:** Node.js


1. Install dependencies:
   `npm install`
2. Create `.env.local` and set:
   - `GEMINI_API_KEY=your_key` (for Gemini)
   - `OPENAI_API_KEY=your_key` (for OpenAI)
   - `ANTHROPIC_API_KEY=your_key` (for Anthropic)
   - `DEEPSEEK_API_KEY=your_key` (for DeepSeek)
   - `CORS_ORIGIN=*` (or your exact frontend origin in production)
   - Optional:
     - `GEMINI_MODEL=gemini-3-flash-preview`
     - `OPENAI_MODEL=gpt-4.1-mini`
     - `ANTHROPIC_MODEL=claude-3-5-haiku-latest`
     - `DEEPSEEK_MODEL=deepseek-chat`
     - `DEEPSEEK_BASE_URL=https://api.deepseek.com`
     - `NEXT_PUBLIC_DEFAULT_PROVIDER=deepseek`
3. Run the app:
   `npm run dev`
4. Open:
   `http://localhost:3000`

## Next API Route backend

Added backend route: `pages/api/optimize.js`

- Method: `POST`
- URL: `/api/optimize`
- Body (JSON):
  - `originalPrompt: string`
  - `tone: string`
  - `provider: "gemini" | "openai" | "anthropic" | "deepseek"`

Features included:
- CORS headers (`Access-Control-Allow-Origin`, methods, headers)
- JSON body parser config via `export const config.api.bodyParser`
- API key loading from `.env` (`GEMINI_API_KEY`)
