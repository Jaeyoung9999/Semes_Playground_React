import { useState, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { useChatStore } from '@stores/ChatStore';

// 채팅 입력 컴포넌트
export default function ChatInput() {
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Zustand 스토어에서 필요한 함수들 가져오기
  const {
    addMessage,
    updateStreamingMessage,
    completeStreaming,
    setLoading,
    getApiMessages,
    isLoading,
  } = useChatStore();

  // 메시지 전송 함수
  const sendMessage = async () => {
    const message = inputValue.trim();
    if (!message || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setLoading(true);

      // 사용자 메시지 추가
      addMessage({
        role: 'user',
        content: message,
      });

      // 입력창 초기화
      setInputValue('');

      // 텍스트 영역 높이 리셋
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      // API 호출을 위한 메시지 배열 생성
      const apiMessages = getApiMessages();
      apiMessages.push({ role: 'user', content: message });

      // 빈 AI 응답 메시지 미리 추가 (스트리밍용)
      addMessage({
        role: 'assistant',
        content: '',
        isStreaming: true,
      });

      // 백엔드 API 호출 (스트리밍 방식)
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 스트리밍 응답 처리
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          // 스트리밍 데이터 디코딩
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.status === 'processing' && data.data) {
                  // 스트리밍 중인 내용 누적
                  accumulatedContent += data.data;
                  updateStreamingMessage(accumulatedContent);
                } else if (data.status === 'complete') {
                  // 스트리밍 완료
                  completeStreaming();
                } else if (data.status === 'error') {
                  throw new Error(data.data);
                }
              } catch (parseError) {
                console.warn('JSON 파싱 오류:', parseError);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('메시지 전송 오류:', error);

      // 오류 메시지 추가
      addMessage({
        role: 'assistant',
        content: `죄송합니다. 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      });

      completeStreaming();
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  // Enter 키 처리 (Shift+Enter는 줄바꿈, Enter는 전송)
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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
            onClick={sendMessage}
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
