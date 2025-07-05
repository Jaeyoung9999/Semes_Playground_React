import { useEffect, useRef, useState } from 'react';
import ChatDisplay from '@components/ChatDisplay';
import ChatInput from '@components/ChatInput';
import { useChatStore } from '@stores/ChatStore';

// 메인 채팅 앱 컴포넌트
export default function ChatPage() {
  const { clearMessages, messages } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // 전체 화면 스크롤 위치 감지하여 자동 스크롤 여부 결정
  const handleScroll = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;

    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100; // 100px 여유
    setShouldAutoScroll(isNearBottom);
  };

  // 스크롤 이벤트 리스너 등록/해제
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 새 메시지가 추가될 때마다 조건부 스크롤
  useEffect(() => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }
  }, [messages, shouldAutoScroll]);

  // 스크롤을 맨 아래로 이동하는 함수
  const scrollToBottom = () => {
    setShouldAutoScroll(true);
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 헤더 */}
      <header className="bg-white shadow-sm p-4 border-b sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">AI 채팅</h1>

          {/* 채팅 초기화 버튼 */}
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              채팅 초기화
            </button>
          )}
        </div>
      </header>

      {/* 채팅 표시 영역 */}
      <main className="flex-1 flex justify-center">
        <ChatDisplay />
      </main>

      {/* 메시지 입력 영역 */}
      <footer className="sticky bottom-0 bg-white border-t z-20 relative">
        {/* 자동 스크롤이 비활성화되었을 때 표시할 버튼 */}
        {!shouldAutoScroll && (
          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
            <button
              onClick={scrollToBottom}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 py-2 shadow-lg transition-colors flex items-center gap-2"
              title="최신 메시지로 이동"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <span className="text-sm font-medium">최신 메시지</span>
            </button>
          </div>
        )}

        <ChatInput />
      </footer>

      {/* 스크롤을 맨 아래로 이동시키기 위한 참조 요소 */}
      <div ref={messagesEndRef} />
    </div>
  );
}
