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
    <div className="border-t bg-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-end gap-3">
          {/* 메시지 입력 영역 */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요... (Enter: 전송, Shift+Enter: 줄바꿈)"
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ minHeight: '56px' }}
              disabled={isSubmitting}
              rows={1}
            />

            {/* 입력 힌트 */}
            {inputValue.length === 0 && (
              <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                Shift+Enter로 줄바꿈
              </div>
            )}
          </div>

          {/* 전송 버튼 */}
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isSubmitting || isLoading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                전송 중...
              </>
            ) : (
              <>
                <span>전송</span>
                <span className="text-sm">↵</span>
              </>
            )}
          </button>
        </div>

        {/* 상태 표시 */}
        {isLoading && (
          <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            AI가 응답을 생성하고 있습니다...
          </div>
        )}
      </div>
    </div>
  );
}
