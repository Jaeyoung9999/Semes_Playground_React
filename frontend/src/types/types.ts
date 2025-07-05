// 채팅 메시지 타입 정의
export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean; // 현재 스트리밍 중인지 여부
};
