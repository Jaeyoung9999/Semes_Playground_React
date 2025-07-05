import { useState, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { useChatStore } from '@stores/ChatStore';

// 채팅 입력 컴포넌트
export default function ChatInput() {
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Zustand 스토어에서 필요한 함수들 가져오기
  const { sendMessage, isLoading } = useChatStore();

  // 메시지 전송 핸들러
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);

      // 스토어의 sendMessage 함수 호출
      await sendMessage(inputValue);

      // 입력창 초기화
      setInputValue('');

      // 텍스트 영역 높이 리셋
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('메시지 전송 중 오류:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enter 키 처리 (Shift+Enter는 줄바꿈, Enter는 전송)
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 텍스트 영역 자동 높이 조절
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);

    // 텍스트 영역 높이 자동 조절
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  return (
    <div className="bg-white pb-4">
      <div className="max-w-4xl mx-auto px-4">
        {/* 입력 컨테이너 - shadow와 border로 입체감 추가 */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-gray-200/60 transition-shadow duration-200">
          {/* 메시지 입력 영역 */}
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요... (Enter: 전송, Shift+Enter: 줄바꿈)"
            className="w-full p-4 bg-transparent resize-none focus:outline-none rounded-t-xl overflow-y-auto"
            style={{
              minHeight: '56px',
              maxHeight: '200px',
            }}
            disabled={isSubmitting}
            rows={1}
          />

          {/* 하단 영역 - 버튼 */}
          <div className="flex items-center justify-end px-4 pb-3">
            {/* 전송 버튼 */}
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isSubmitting || isLoading}
              className="w-8 h-8 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center group"
              title={isSubmitting ? '전송 중...' : '전송 (Enter)'}
            >
              {isSubmitting ? (
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
