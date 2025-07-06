import { useChatStore } from '@stores/ChatStore';
import { suggestedPrompts } from '@utils/prompt';

// 메인 화면 컴포넌트
export default function WelcomeScreen() {
  const { setInputValue } = useChatStore();

  // 프롬프트 클릭 핸들러
  const handlePromptClick = (title: string, subtitle: string): void => {
    const fullPrompt = `${title} ${subtitle}`;
    setInputValue(fullPrompt);

    // 입력창으로 포커스
    const chatInput = document.querySelector('textarea');
    if (chatInput) {
      chatInput.focus();
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="mx-auto max-w-2xl w-full">
        <div className="mx-5">
          {/* 제안 헤더 */}
          <div className="mb-3 flex gap-1 text-xs font-medium items-center text-gray-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-3 h-3"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
              />
            </svg>
            제안
          </div>

          {/* 프롬프트 리스트 */}
          <div className="h-40 w-full">
            <div className="max-h-40 overflow-auto scrollbar-none">
              {suggestedPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() =>
                    handlePromptClick(prompt.title, prompt.subtitle)
                  }
                  className="flex flex-col w-full justify-between px-3 py-2 rounded-xl bg-transparent hover:bg-gray-50 transition group text-left"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className="flex flex-col">
                    <div className="font-medium text-gray-800 group-hover:text-gray-900 transition line-clamp-1">
                      {prompt.title}
                    </div>
                    <div className="text-xs text-gray-600 font-normal line-clamp-1">
                      {prompt.subtitle}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
