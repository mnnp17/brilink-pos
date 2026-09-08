'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { formatRupiah } from '@/lib/utils/format';

import { askAIBusinessCopilotAction } from '@/lib/actions/ai';
import { AIMessageRenderer } from './AIMessageRenderer';

export function AIChatDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
    {
      role: 'model',
      text: 'Halo! Saya AI Business Co-Pilot Anda. Tanyakan apa saja seputar laba rugi, perputaran kas, atau performa kasir hari ini.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await askAIBusinessCopilotAction(userText);
      if (res.success && res.reply) {
        setMessages((prev) => [...prev, { role: 'model', text: res.reply }]);
      } else {
        setMessages((prev) => [...prev, { role: 'model', text: res.reply || 'Gagal memperoleh jawaban AI.' }]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: 'model', text: 'Gagal menghubungi asisten AI. Silakan periksa koneksi Anda.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-[#FF6600] hover:bg-[#E55C00] text-white px-4 py-3 rounded-full shadow-lg shadow-orange-600/30 font-bold text-xs uppercase transition-all hover:scale-105 active:scale-95 cursor-pointer"
      >
        <Sparkles className="w-4 h-4 text-white animate-pulse" />
        <span>✨ Tanya AI Bisnis</span>
      </button>

      {/* Chat Drawer Side Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Body */}
          <div className="relative z-10 flex flex-col w-full max-w-md bg-white h-full shadow-2xl transition-transform duration-300 ease-out">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-[#001E36] text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FF6600] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-[14px]">AI Business Co-Pilot</h3>
                  <p className="text-[10px] text-blue-200">Didukung oleh Google Gemini</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat History */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 max-w-[85%] ${
                    m.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      m.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-white'
                    }`}
                  >
                    {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed shadow-xs ${
                      m.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                    }`}
                  >
                    <AIMessageRenderer content={m.text} isUser={m.role === 'user'} />
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3 max-w-[80%]">
                  <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="rounded-2xl px-4 py-2.5 bg-white border border-slate-200/80 rounded-tl-none text-[13px] text-slate-400 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    Asisten sedang berpikir...
                  </div>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-3.5 border-t border-slate-100 bg-white flex gap-2">
              <input
                type="text"
                placeholder="Tanyakan analisis keuangan atau kasir..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="flex-1 px-4 py-2.5 text-[13px] text-slate-700 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="w-10 h-10 bg-[#FF6600] hover:bg-[#E55C00] disabled:bg-slate-200 disabled:text-slate-400 text-white flex items-center justify-center rounded-xl transition-colors shrink-0 active:scale-95"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
