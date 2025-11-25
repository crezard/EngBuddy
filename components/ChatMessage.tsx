import React, { useState } from 'react';
import { Message, TTSState } from '../types';
import { User, Bot, Volume2, Loader2 } from 'lucide-react';
import { playTextToSpeech } from '../services/geminiService';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [ttsState, setTtsState] = useState<TTSState>(TTSState.IDLE);

  const handlePlayAudio = async () => {
    if (ttsState !== TTSState.IDLE) return;

    try {
      setTtsState(TTSState.LOADING);
      // Remove Markdown symbols for cleaner speech if possible, 
      // but Gemini TTS is robust enough to handle basic text.
      // We pass the raw text.
      await playTextToSpeech(message.text);
      setTtsState(TTSState.PLAYING);
      
      // Reset state after a rough estimate or just let user click again if they want
      // Since we use AudioContext directly, we don't strictly know when it ends without adding listeners in the service.
      // For UI simplicity, we'll reset to IDLE after a short delay to allow re-clicks, 
      // or we could implement a more complex event emitter system. 
      // Let's just reset to IDLE after 2 seconds to allow re-triggering.
      setTimeout(() => setTtsState(TTSState.IDLE), 3000); 

    } catch (error) {
      console.error("TTS failed", error);
      setTtsState(TTSState.IDLE);
      alert("오디오 재생에 실패했습니다.");
    }
  };

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-indigo-500' : 'bg-amber-400'}`}>
          {isUser ? <User size={18} className="text-white" /> : <Bot size={18} className="text-white" />}
        </div>

        {/* Bubble */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div
            className={`px-5 py-3 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed whitespace-pre-wrap ${
              isUser
                ? 'bg-indigo-500 text-white rounded-tr-none'
                : 'bg-white border border-gray-100 text-slate-800 rounded-tl-none'
            }`}
          >
             {message.isThinking ? (
               <div className="flex items-center gap-2 text-indigo-200">
                 <Loader2 size={16} className="animate-spin" />
                 <span>생각하는 중...</span>
               </div>
             ) : (
                message.text
             )}
          </div>
          
          {/* TTS Button for Bot messages */}
          {!isUser && !message.isThinking && (
            <button 
              onClick={handlePlayAudio}
              disabled={ttsState !== TTSState.IDLE}
              className="mt-1 flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 transition-colors disabled:opacity-50"
            >
              {ttsState === TTSState.LOADING ? (
                 <Loader2 size={12} className="animate-spin" />
              ) : (
                <Volume2 size={12} />
              )}
              {ttsState === TTSState.LOADING ? '로딩 중...' : '발음 듣기'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;