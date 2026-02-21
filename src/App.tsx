import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  RotateCcw, 
  Zap, 
  MessageSquare, 
  ChevronRight,
  Terminal,
  Type,
  Send
} from 'lucide-react';
import { optimizePrompt, type Provider } from './services/geminiService';

const TONES = [
  { id: 'professional', label: 'Professional', icon: Zap, description: 'Formal and precise' },
  { id: 'creative', label: 'Creative', icon: Sparkles, description: 'Imaginative and descriptive' },
  { id: 'concise', label: 'Concise', icon: ChevronRight, description: 'Short and direct' },
  { id: 'instructional', label: 'Instructional', icon: Terminal, description: 'Step-by-step guidance' },
];

const ALLOWED_PROVIDERS: Provider[] = ['gemini', 'openai', 'anthropic', 'deepseek'];
const ENV_PROVIDER = process.env.NEXT_PUBLIC_DEFAULT_PROVIDER as Provider | undefined;
const DEFAULT_PROVIDER: Provider = ENV_PROVIDER && ALLOWED_PROVIDERS.includes(ENV_PROVIDER) ? ENV_PROVIDER : 'gemini';

export default function App() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [tone, setTone] = useState('professional');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const handleOptimize = async () => {
    if (!input.trim()) return;
    
    setIsOptimizing(true);
    try {
      const result = await optimizePrompt(input, tone, DEFAULT_PROVIDER);
      setOutput(result);
    } catch (error) {
      console.error(error);
      // Fallback or error state could be added here
    } finally {
      setIsOptimizing(false);
    }
  };

  const copyToClipboard = async () => {
    if (!output) return;

    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(output);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = output;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const copiedByFallback = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (!copiedByFallback) {
          throw new Error('Fallback clipboard copy failed.');
        }
      }

      setCopyFailed(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error(error);
      setCopied(false);
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 2500);
    }
  };

  const reset = () => {
    setInput('');
    setOutput('');
    setTone('professional');
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans selection:bg-indigo-100">
      {/* Header */}
      <nav className="border-b border-slate-200 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">PromptCraft</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={reset}
              className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              title="Reset All"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input & Settings */}
          <div className="lg:col-span-7 space-y-8">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Your Initial Prompt
                </label>
                <span className="text-xs text-slate-400">{input.length} characters</span>
              </div>
              <div className="relative group">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Paste your prompt here... e.g., 'Write a story about a cat'"
                  className="w-full h-64 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none text-slate-700 leading-relaxed placeholder:text-slate-300"
                />
                <div className="absolute bottom-4 right-4 opacity-0 group-focus-within:opacity-100 transition-opacity">
                  <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-[10px] text-slate-500 font-mono">
                    ESC to clear
                  </kbd>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Type className="w-4 h-4" />
                Select Desired Tone
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    className={`p-4 rounded-xl border text-left transition-all group ${
                      tone === t.id 
                        ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/20' 
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <t.icon className={`w-5 h-5 mb-2 ${tone === t.id ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-500'}`} />
                    <div className={`text-sm font-semibold ${tone === t.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                      {t.label}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                      {t.description}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <button
              onClick={handleOptimize}
              disabled={isOptimizing || !input.trim()}
              className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg shadow-indigo-500/20 ${
                isOptimizing || !input.trim()
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]'
              }`}
            >
              {isOptimizing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-current" />
                  Optimize Prompt
                </>
              )}
            </button>
          </div>

          {/* Right Column: Output */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Optimized Result
                </label>
                {output && (
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy Result'}
                  </button>
                )}
              </div>
              {copyFailed && (
                <div className="text-xs text-rose-400">Copy failed. Please check browser clipboard permissions.</div>
              )}

              <div className="relative min-h-[400px] lg:min-h-[550px] bg-slate-900 rounded-3xl p-8 shadow-2xl overflow-hidden group">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full -ml-32 -mb-32" />

                <AnimatePresence mode="wait">
                  {output ? (
                    <motion.div
                      key="output"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="relative z-10 h-full flex flex-col"
                    >
                      <div className="flex-1 text-slate-300 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                        {output}
                      </div>
                      <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Ready to use</span>
                        </div>
                        <button 
                          onClick={copyToClipboard}
                          className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="relative z-10 h-full flex flex-col items-center justify-center text-center space-y-4"
                    >
                      <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-2">
                        <Zap className="w-8 h-8 text-slate-600" />
                      </div>
                      <h3 className="text-slate-400 font-semibold">No Optimization Yet</h3>
                      <p className="text-slate-500 text-sm max-w-[200px]">
                        Enter your prompt and click optimize to see the magic happen.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Loading Overlay */}
                <AnimatePresence>
                  {isOptimizing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-20 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-8"
                    >
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 animate-pulse" />
                        </div>
                        <div className="text-indigo-400 font-medium text-sm animate-pulse tracking-wide uppercase">
                          Crafting Perfection...
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 py-12 border-t border-slate-200 mt-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-slate-400 text-sm">
            © 2026 PromptCraft Optimizer. Powered by Multi-Provider AI.
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-slate-400 hover:text-indigo-600 text-sm transition-colors">Privacy</a>
            <a href="#" className="text-slate-400 hover:text-indigo-600 text-sm transition-colors">Terms</a>
            <a href="#" className="text-slate-400 hover:text-indigo-600 text-sm transition-colors">Guide</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
