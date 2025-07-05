import { create } from 'zustand';
import type { ChatMessage } from '@/types/types';

// 채팅 스토어 상태 타입
type ChatStore = {
  messages: ChatMessage[];
  isLoading: boolean;

  // 메시지 추가
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;

  // 스트리밍 메시지 업데이트
  updateStreamingMessage: (content: string) => void;

  // 스트리밍 완료 처리
  completeStreaming: () => void;

  // 로딩 상태 설정
  setLoading: (loading: boolean) => void;

  // 채팅 내역 초기화
  clearMessages: () => void;

  // 메시지를 API 형식으로 변환 (시스템 메시지 제외)
  getApiMessages: () => Array<{ role: string; content: string }>;
};

// 고유 ID 생성 함수
const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Zustand 스토어 생성
export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isLoading: false,

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
    })),

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
}));
