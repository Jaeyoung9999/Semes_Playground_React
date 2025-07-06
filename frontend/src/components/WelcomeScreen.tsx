import { useChatStore } from '@stores/ChatStore';
import { promptCategories, quickStartPrompts } from '@utils/prompt';

// 메인 화면 컴포넌트
export default function WelcomeScreen() {
  const { setInputValue } = useChatStore();

  // 프롬프트 클릭 핸들러
  const handlePromptClick = (prompt: string): void => {
    setInputValue(prompt);
    // 입력창으로 스크롤 (선택사항)
    const chatInput = document.querySelector('textarea');
    if (chatInput) {
      chatInput.focus();
    }
  };

  return (
    <div className="flex-1 p-8 max-w-4xl mx-auto">
      {/* 헤더 섹션 */}
      <div className="text-center mb-12">
        <div className="text-6xl mb-6">🤖</div>
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          AI 어시스턴트와 대화해보세요
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          궁금한 것이 있으시면 언제든 질문해주세요. 아래 추천 프롬프트로
          시작해보세요!
        </p>
      </div>

      {/* 빠른 시작 프롬프트 */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          🚀 빠른 시작
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {quickStartPrompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => handlePromptClick(prompt)}
              className="p-4 text-left bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 rounded-lg transition-all duration-200 hover:shadow-md hover:scale-[1.02] group"
            >
              <span className="text-gray-700 group-hover:text-gray-900 transition-colors">
                {prompt}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 카테고리별 프롬프트 */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          📋 카테고리별 추천
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {promptCategories.map((category, categoryIndex) => (
            <div
              key={categoryIndex}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200"
            >
              <h3 className="font-semibold text-gray-800 mb-4 text-lg">
                {category.title}
              </h3>
              <div className="space-y-2">
                {category.prompts.map((prompt, promptIndex) => (
                  <button
                    key={promptIndex}
                    onClick={() => handlePromptClick(prompt)}
                    className="w-full p-3 text-left text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-150 hover:text-gray-800"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 도움말 */}
      <div className="mt-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600">
          <span>💡</span>
          <span>프롬프트를 클릭하면 입력창에 자동으로 입력됩니다</span>
        </div>
      </div>
    </div>
  );
}
