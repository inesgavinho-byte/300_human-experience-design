import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, User, X, Minimize2, Maximize2, Sparkles } from 'lucide-react';
import { askDeepSeek, type AIContext, type ChatMessage } from '@/lib/deepseek';

interface AIChatProps {
  context?: AIContext;
  floating?: boolean;
}

export default function AIChat({ context, floating = true }: AIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Olá! Sou o **300 AI**. Como posso ajudar no design deste sistema?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  async function handleSend() {
    if (!input.trim() || isLoading) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const allMessages = [...messages, userMsg];
      const reply = await askDeepSeek(allMessages, context);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, ocorreu um erro. Tente novamente.' }]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!floating) {
    return (
      <AIChatPanel
        messages={messages}
        input={input}
        isLoading={isLoading}
        onInputChange={setInput}
        onSend={handleSend}
        onKeyDown={handleKeyDown}
        context={context}
      />
    );
  }

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-ink text-ivory shadow-lg flex items-center justify-center hover:bg-dark transition-colors"
          aria-label="Abrir assistente IA"
        >
          <Sparkles size={22} strokeWidth={1.5} />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 bg-ivory border border-line rounded-xl shadow-2xl flex flex-col transition-all duration-200 ${
            isExpanded ? 'w-[480px] h-[640px]' : 'w-[360px] h-[480px]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-ink text-ivory rounded-t-xl">
            <div className="flex items-center gap-2">
              <Bot size={16} strokeWidth={1.5} />
              <span className="text-sm font-sans font-medium">300 AI</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-white/10 rounded"
              >
                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-ink text-ivory flex items-center justify-center shrink-0 mt-0.5">
                      <Bot size={12} />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] text-sm px-3 py-2 rounded-lg font-sans leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-ink text-ivory'
                        : 'bg-line/30 text-ink'
                    }`}
                  >
                    <FormattedMessage content={msg.content} />
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-olive text-ivory flex items-center justify-center shrink-0 mt-0.5">
                      <User size={12} />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-ink text-ivory flex items-center justify-center shrink-0">
                    <Bot size={12} />
                  </div>
                  <div className="bg-line/30 text-ink px-3 py-2 rounded-lg text-sm font-sans">
                    <span className="animate-pulse">A pensar...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="px-3 py-3 border-t border-line">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pergunta ao 300 AI..."
                className="flex-1 bg-white border-line text-sm font-sans"
                disabled={isLoading}
              />
              <Button
                size="sm"
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-ink text-ivory hover:bg-dark"
              >
                <Send size={14} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FormattedMessage({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
          return <p key={i} className="font-semibold">{trimmed.replace(/\*\*/g, '')}</p>;
        }
        if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
          return <p key={i} className="pl-2">{trimmed}</p>;
        }
        if (/^\d+\./.test(trimmed)) {
          return <p key={i} className="pl-2">{trimmed}</p>;
        }
        return <p key={i}>{trimmed}</p>;
      })}
    </div>
  );
}

function AIChatPanel({
  messages,
  input,
  isLoading,
  onInputChange,
  onSend,
  onKeyDown,
  context
}: {
  messages: ChatMessage[];
  input: string;
  isLoading: boolean;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  context?: AIContext;
}) {
  return (
    <div className="h-full flex flex-col bg-ivory border border-line rounded-xl">
      <div className="px-4 py-3 border-b border-line bg-ink text-ivory rounded-t-xl flex items-center gap-2">
        <Bot size={16} strokeWidth={1.5} />
        <span className="text-sm font-sans font-medium">300 AI Assistente</span>
        {context?.projectName && (
          <span className="text-xs text-olive ml-auto">{context.projectName}</span>
        )}
      </div>
      <ScrollArea className="flex-1 px-4 py-3">
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-ink text-ivory flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={12} />
                </div>
              )}
              <div className={`max-w-[80%] text-sm px-3 py-2 rounded-lg font-sans leading-relaxed ${msg.role === 'user' ? 'bg-ink text-ivory' : 'bg-line/30 text-ink'}`}>
                <FormattedMessage content={msg.content} />
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-ink text-ivory flex items-center justify-center shrink-0">
                <Bot size={12} />
              </div>
              <div className="bg-line/30 text-ink px-3 py-2 rounded-lg text-sm font-sans">
                <span className="animate-pulse">A pensar...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="px-3 py-3 border-t border-line">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Pergunta ao 300 AI..."
            className="flex-1 bg-white border-line text-sm font-sans"
            disabled={isLoading}
          />
          <Button size="sm" onClick={onSend} disabled={isLoading || !input.trim()} className="bg-ink text-ivory hover:bg-dark">
            <Send size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
