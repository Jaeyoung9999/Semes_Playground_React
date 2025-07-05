import { create } from 'zustand';
import type { ChatMessage } from '@/types/types';

// 채팅 스토어 상태 타입
type ChatStore = {
  messages: ChatMessage[];
  isLoading: boolean;
  abortController: AbortController | null; // 요청 취소를 위한 컨트롤러

  // 메시지 추가
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;

  // 스트리밍 메시지 업데이트
  updateStreamingMessage: (content: string) => void;

  // 스트리밍 완료 처리
  completeStreaming: () => void;

  // 스트리밍 정지
  stopStreaming: () => void;

  // 로딩 상태 설정
  setLoading: (loading: boolean) => void;

  // 채팅 내역 초기화
  clearMessages: () => void;

  // 메시지를 API 형식으로 변환 (시스템 메시지 제외)
  getApiMessages: () => Array<{ role: string; content: string }>;

  // 메시지 전송 함수
  sendMessage: (message: string) => Promise<void>;
};

// 고유 ID 생성 함수
const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Zustand 스토어 생성
export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isLoading: false,
  abortController: null,

  // 새 메시지 추가
  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: generateId(),
          timestamp: Date.now(),
        },
      ],
    })),

  // 스트리밍 중인 메시지 업데이트 (마지막 assistant 메시지)
  updateStreamingMessage: (content) =>
    set((state) => ({
      messages: state.messages.map((msg, index) =>
        index === state.messages.length - 1 && msg.role === 'assistant'
          ? { ...msg, content, isStreaming: true }
          : msg,
      ),
    })),

  // 스트리밍 완료 처리
  completeStreaming: () =>
    set((state) => ({
      messages: state.messages.map((msg) => ({ ...msg, isStreaming: false })),
      isLoading: false,
      abortController: null,
    })),

  // 스트리밍 정지
  stopStreaming: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }

    set((state) => ({
      messages: state.messages.map((msg) => ({ ...msg, isStreaming: false })),
      isLoading: false,
      abortController: null,
    }));
  },

  // 로딩 상태 설정
  setLoading: (loading) => set({ isLoading: loading }),

  // 모든 메시지 삭제
  clearMessages: () => set({ messages: [] }),

  // API 호출용 메시지 형식 변환
  getApiMessages: () => {
    const { messages } = get();
    return messages
      .filter((msg) => !msg.isStreaming) // 스트리밍 중인 메시지 제외
      .map((msg) => ({ role: msg.role, content: msg.content }));
  },

  // 메시지 전송 함수
  sendMessage: async (message: string) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    // 새로운 AbortController 생성
    const controller = new AbortController();

    try {
      set({ isLoading: true, abortController: controller });

      // 사용자 메시지 추가
      get().addMessage({
        role: 'user',
        content: trimmedMessage,
      });

      // API 호출을 위한 메시지 배열 생성
      const apiMessages = get().getApiMessages();
      apiMessages.push({ role: 'user', content: trimmedMessage });

      // 빈 AI 응답 메시지 미리 추가 (스트리밍용)
      get().addMessage({
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
        signal: controller.signal, // 요청 취소를 위한 signal 추가
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
          // 요청이 취소되었는지 확인
          if (controller.signal.aborted) {
            await reader.cancel();
            break;
          }

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
                  // 요청이 취소되었는지 다시 확인
                  if (controller.signal.aborted) {
                    break;
                  }

                  // 스트리밍 중인 내용 누적
                  accumulatedContent += data.data;
                  get().updateStreamingMessage(accumulatedContent);
                } else if (data.status === 'complete') {
                  // 스트리밍 완료
                  get().completeStreaming();
                } else if (data.status === 'error') {
                  throw new Error(data.data);
                }
              } catch (parseError) {
                if (!controller.signal.aborted) {
                  console.warn('JSON 파싱 오류:', parseError);
                }
              }
            }
          }

          // 취소되었으면 반복문 종료
          if (controller.signal.aborted) {
            break;
          }
        }
      }
    } catch (error) {
      // AbortError는 정상적인 취소이므로 에러 메시지를 표시하지 않음
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('요청이 취소되었습니다.');
      } else {
        console.error('메시지 전송 오류:', error);

        // 오류 메시지 추가
        get().addMessage({
          role: 'assistant',
          content: `죄송합니다. 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        });
      }

      get().completeStreaming();
    } finally {
      set({ isLoading: false, abortController: null });
    }
  },
}));
