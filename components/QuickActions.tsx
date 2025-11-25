import React from 'react';
import { Sparkles, PenTool, Search, HelpCircle } from 'lucide-react';
import { QuickAction } from '../types';

interface QuickActionsProps {
  onActionSelect: (prompt: string) => void;
  disabled: boolean;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onActionSelect, disabled }) => {
  const actions: QuickAction[] = [
    {
      label: '주제 추천해줘',
      prompt: '중학교 2학년 수준의 영어 말하기 수행평가 주제 3가지만 추천해줘. 각 주제별로 간단한 이유도 한국어로 설명해줘.',
      icon: <Sparkles size={16} />,
    },
    {
      label: '문법 교정해줘',
      prompt: '내가 쓴 영어 문장을 문법적으로 완벽하게 고쳐주고, 틀린 부분을 설명해줘. (여기에 문장을 입력하세요)',
      icon: <PenTool size={16} />,
    },
    {
      label: '표현 다듬기',
      prompt: '내가 쓴 글을 좀 더 원어민스럽고 자연스러운 표현으로 바꿔줘. (여기에 문장을 입력하세요)',
      icon: <Search size={16} />,
    },
    {
      label: '도움말',
      prompt: 'EngBuddy, 너는 어떤 기능을 도와줄 수 있어? 사용 방법을 알려줘.',
      icon: <HelpCircle size={16} />,
    },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={() => onActionSelect(action.prompt)}
          disabled={disabled}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-indigo-100 rounded-full text-sm font-medium text-indigo-600 shadow-sm hover:bg-indigo-50 hover:border-indigo-200 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {action.icon}
          {action.label}
        </button>
      ))}
    </div>
  );
};

export default QuickActions;