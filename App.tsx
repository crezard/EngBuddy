import React, { useState, useRef, useEffect } from 'react';
import { Send, GraduationCap } from 'lucide-react';
import ChatMessage from './components/ChatMessage';
import QuickActions from './components/QuickActions';
import { Message } from './types';
import { sendMessageToGemini } from './services/geminiService';

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "안녕하세요! 저는 여러분의 영어 수행평가를 도와줄 EngBuddy입니다. 👋\n\n작문 교정, 주제 추천, 발음 연습 등 무엇이든 물어보세요!",
      timestamp: new Date(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || input.trim();
    if (!textToSend || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Add placeholder thinking message
    const thinkingId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: thinkingId, role: 'model', text: '', timestamp: new Date(), isThinking: true }
    ]);

    try {
      // Prepare history for API
      // Filter out thinking messages and map to API format
      const history = messages
        .filter(m => !m.isThinking && m.id !== 'welcome') // Optionally exclude welcome if not needed for context, but good to keep
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));

      const responseText = await sendMessageToGemini(history, textToSend);

      setMessages((prev) => 
        prev.map(msg => 
          msg.id === thinkingId 
            ? { ...msg, text: responseText, isThinking: false } 
            : msg
        )
      );
    } catch (error) {
      setMessages((prev) => 
        prev.map(msg => 
          msg.id === thinkingId 
            ? { ...msg, text: "오류가 발생했습니다. 다시 시도해주세요.", isThinking: false } 
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 max-w-4xl mx-auto shadow-2xl overflow-hidden relative">
      {/* Header */}
      <header className="bg-white border-b border-indigo-100 p-4 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
            <GraduationCap className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">EngBuddy</h1>
            <p className="text-xs text-slate-500 font-medium">중학 영어 수행평가 멘토</p>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="bg-white p-4 border-t border-slate-100">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Quick Actions */}
          <QuickActions 
            onActionSelect={(prompt) => {
              if (prompt.includes("(여기에 문장을 입력하세요)")) {
                setInput(prompt);
              } else {
                handleSendMessage(prompt);
              }
            }} 
            disabled={isLoading} 
          />
          
          {/* Input Box */}
          <div className="relative flex items-end gap-2 bg-slate-50 p-2 rounded-3xl border border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="영어 문장을 입력하거나 질문해보세요..."
              className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-2.5 px-3 text-slate-700 placeholder:text-slate-400 text-base"
              rows={1}
              style={{ height: 'auto', minHeight: '44px' }}
              // Auto-resize textarea height
              ref={(ref) => {
                if (ref) {
                  ref.style.height = '0px';
                  ref.style.height = ref.scrollHeight + 'px';
                }
              }}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isLoading}
              className="mb-1 p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-md active:scale-95 flex-shrink-0"
            >
              <Send size={18} />
            </button>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-400">Gemini AI가 답변을 생성합니다. 실수가 있을 수 있으니 확인이 필요합니다.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;