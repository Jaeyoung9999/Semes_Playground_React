// 채팅 메시지 타입 정의
export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean; // 현재 스트리밍 중인지 여부
};

// 채팅 세션 타입 정의
export type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
};

// 채팅 히스토리 타입 정의
export type ChatHistory = {
  sessions: ChatSession[];
  currentSessionId: string | null;
};
