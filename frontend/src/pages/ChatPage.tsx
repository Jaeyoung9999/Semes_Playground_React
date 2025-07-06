import { useEffect, useRef, useState } from 'react';
import ChatDisplay from '@components/ChatDisplay';
import ChatInput from '@components/ChatInput';
import Header from '@components/Header';
import Sidebar from '@components/Sidebar';
import ArrowDownIcon from '@icons/arrow_down.svg?react';
import { useChatStore } from '@stores/ChatStore';

// 메인 채팅 앱 컴포넌트
export default function ChatPage() {
  const { messages } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
    <div className="flex min-h-screen">
      {/* 사이드바 */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* 메인 콘텐츠 */}
      <div
        className={`flex-1 flex flex-col ${sidebarOpen ? 'ml-64' : 'ml-12'} transition-all duration-300 min-h-screen`}
      >
        {/* 헤더 */}
        <Header />

        {/* 채팅 표시 영역 */}
        <main className="flex-1">
          <div className="w-[60%] mx-auto max-w-4xl">
            <ChatDisplay />
          </div>
        </main>

        {/* 메시지 입력 영역 */}
        <footer className="sticky bottom-0 bg-white z-20">
          <div className="w-[60%] mx-auto max-w-4xl relative">
            {/* 자동 스크롤이 비활성화되었을 때 표시할 버튼 */}
            {!shouldAutoScroll && (
              <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
                <button
                  onClick={scrollToBottom}
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 py-2 shadow-lg transition-colors flex items-center gap-2"
                  title="최신 메시지로 이동"
                >
                  <ArrowDownIcon />
                  <span className="text-sm font-medium">최신 메시지</span>
                </button>
              </div>
            )}

            <ChatInput />
          </div>
        </footer>

        {/* 스크롤을 맨 아래로 이동시키기 위한 참조 요소 */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
