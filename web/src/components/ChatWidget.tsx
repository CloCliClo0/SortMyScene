import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';

type Message = {
  role: 'user' | 'model';
  parts: string;
};

const SUGGESTIONS: Record<string, string[]> = {
  fr: [
    'Comment créer une scène ?',
    'Comment connecter Spotify ?',
    'Aide-moi à écrire un prompt de curation',
    'Suggère une ambiance pour un afterwork',
  ],
  en: [
    'How do I create a scene?',
    'How do I connect Spotify?',
    'Help me write a curation prompt',
    'Suggest a vibe for a rooftop party',
  ],
};

function ChatWidget() {
  const { lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: 'user', parts: trimmed };
    const nextHistory = [...history, userMsg];
    setHistory(nextHistory);
    setInput('');
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: trimmed,
          history: history,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || 'Error');
      }

      const data = await res.json();
      setHistory([...nextHistory, { role: 'model', parts: data.reply }]);
    } catch (err: any) {
      setError(err.message || (lang === 'fr' ? 'Erreur, réessaie.' : 'Error, please retry.'));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const suggestions = SUGGESTIONS[lang] ?? SUGGESTIONS.en;

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 flex w-[340px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-[0_0_40px_rgba(34,211,238,0.15)] backdrop-blur-xl md:bottom-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot size={16} className="text-cyan-400" />
              <span className="text-sm font-semibold text-white">
                {lang === 'fr' ? 'Assistant SortMyScene' : 'SortMyScene Assistant'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: 360 }}>
            {history.length === 0 && (
              <div className="space-y-3">
                <p className="text-center text-xs text-slate-500">
                  {lang === 'fr'
                    ? 'Comment puis-je t\'aider ?'
                    : 'How can I help you?'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => sendMessage(s)}
                      className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200 hover:bg-cyan-500/20"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {history.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-cyan-500/20 text-cyan-100'
                      : 'border border-white/10 bg-white/5 text-slate-200'
                  }`}
                >
                  {msg.parts}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400">
                  <span className="animate-pulse">···</span>
                </div>
              </div>
            )}

            {error && (
              <p className="text-center text-xs text-red-400">{error}</p>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/10 p-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                placeholder={lang === 'fr' ? 'Écris ton message…' : 'Type your message…'}
                className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="rounded-lg p-1 text-cyan-400 hover:bg-cyan-400/10 disabled:opacity-30"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-20 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 shadow-[0_0_20px_rgba(34,211,238,0.4)] transition hover:scale-105 md:bottom-6"
        aria-label={lang === 'fr' ? 'Ouvrir l\'assistant' : 'Open assistant'}
      >
        {open ? <X size={20} className="text-slate-950" /> : <MessageCircle size={20} className="text-slate-950" />}
      </button>
    </>
  );
}

export default ChatWidget;
