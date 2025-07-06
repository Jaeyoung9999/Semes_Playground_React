import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { useChatStore } from '@stores/ChatStore';

// 채팅 입력 컴포넌트
export default function ChatInput() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);

  // Zustand 스토어에서 필요한 함수들 가져오기
  const { inputValue, setInputValue, sendMessage, isLoading, stopStreaming } =
    useChatStore();

  // 입력 내용 동기화
  useEffect(() => {
    if (inputRef.current && inputRef.current.textContent !== inputValue) {
      inputRef.current.textContent = inputValue;
    }
  }, [inputValue]);

  // 메시지 전송 핸들러
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSubmitting) return;

    const messageToSend = inputValue;

    // 즉시 입력창 초기화
    setInputValue('');
    if (inputRef.current) {
      inputRef.current.textContent = '';
    }

    try {
      setIsSubmitting(true);
      await sendMessage(messageToSend);
    } catch (error) {
      console.error('메시지 전송 중 오류:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 응답 정지 핸들러
  const handleStopStreaming = () => {
    stopStreaming();
  };

  // Enter 키 처리 (Shift+Enter는 줄바꿈, Enter는 전송)
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && inputValue.trim()) {
        handleSendMessage();
      }
    }
  };

  // 입력 내용 변경 처리
  const handleInputChange = (e: React.FormEvent<HTMLDivElement>) => {
    const text = e.currentTarget.textContent || '';
    setInputValue(text);
  };

  // 붙여넣기 처리 (서식 제거)
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  return (
    <div className="bg-white pb-4">
      <div className="max-w-4xl mx-auto px-4">
        {/* 입력 컨테이너 */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200">
          {/* 입력 영역 컨테이너 */}
          <div className="px-4 pt-4 pb-2">
            {/* 스크롤 가능한 입력 영역 */}
            <div className="w-full max-h-80 overflow-auto">
              {/* 실제 입력 요소 */}
              <div className="relative w-full h-full">
                <div
                  ref={inputRef}
                  contentEditable
                  onInput={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  className="w-full h-full bg-transparent resize-none focus:outline-none"
                  style={{
                    minHeight: '1.5rem',
                    lineHeight: '1.5',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                  }}
                  suppressContentEditableWarning={true}
                />
                {/* 플레이스홀더 */}
                {!inputValue && (
                  <div className="absolute top-0 left-0 text-gray-400 pointer-events-none select-none">
                    오늘 어떻게 도와드릴까요?
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 하단 영역 - 버튼 */}
          <div className="flex items-center justify-end px-3 pb-3">
            <button
              onClick={isLoading ? handleStopStreaming : handleSendMessage}
              disabled={!isLoading && !inputValue.trim()}
              className={`w-8 h-8 text-white rounded-lg font-medium transition-colors flex items-center justify-center group ${
                isLoading
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
              title={isLoading ? '응답 정지' : '전송 (Enter)'}
            >
              {isLoading ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span className="text-sm transform group-hover:scale-110 transition-transform">
                  ↵
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
