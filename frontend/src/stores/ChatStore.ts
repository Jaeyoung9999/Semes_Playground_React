import { create } from 'zustand';
import type { ChatMessage, ChatSession, ChatHistory } from '@/types/types';

// 채팅 스토어 상태 타입
type ChatStore = {
  // 현재 채팅 상태
  messages: ChatMessage[];
  isLoading: boolean;
  abortController: AbortController | null;
  selectedModel: string;

  // 채팅 히스토리 상태
  currentSessionId: string | null;
  chatHistory: ChatSession[];

  // 기존 메서드들
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateStreamingMessage: (content: string) => void;
  completeStreaming: () => void;
  stopStreaming: () => void;
  setLoading: (loading: boolean) => void;
  setSelectedModel: (model: string) => void;
  clearMessages: () => void;
  getApiMessages: () => Array<{ role: string; content: string }>;
  sendMessage: (message: string) => Promise<void>;

  // 새로운 채팅 히스토리 메서드들
  createNewSession: () => string;
  loadSession: (sessionId: string) => void;
  saveCurrentSession: () => void;
  deleteSession: (sessionId: string) => void;
  generateSessionTitle: (sessionId: string) => Promise<void>;
  loadChatHistory: () => void;
  saveChatHistory: () => void;
};

// 고유 ID 생성 함수
const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// 로컬 스토리지 키
const CHAT_HISTORY_KEY = 'chat_history';

// Zustand 스토어 생성
export const useChatStore = create<ChatStore>((set, get) => ({
  // 현재 채팅 상태 초기값
  messages: [],
  isLoading: false,
  abortController: null,
  selectedModel: 'gpt-3.5-turbo',

  // 채팅 히스토리 상태 초기값
  currentSessionId: null,
  chatHistory: [],

  // 기존 메서드들
  addMessage: (message) => {
    const newMessage = {
      ...message,
      id: generateId(),
      timestamp: Date.now(),
    };

    set((state) => ({
      messages: [...state.messages, newMessage],
    }));

    // 메시지가 추가될 때마다 현재 세션 저장
    setTimeout(() => get().saveCurrentSession(), 0);
  },

  updateStreamingMessage: (content) =>
    set((state) => ({
      messages: state.messages.map((msg, index) =>
        index === state.messages.length - 1 && msg.role === 'assistant'
          ? { ...msg, content, isStreaming: true }
          : msg,
      ),
    })),

  completeStreaming: () => {
    set((state) => ({
      messages: state.messages.map((msg) => ({ ...msg, isStreaming: false })),
      isLoading: false,
      abortController: null,
    }));

    // 스트리밍 완료 후 세션 저장 및 제목 생성
    setTimeout(() => {
      const { saveCurrentSession, currentSessionId, generateSessionTitle } =
        get();
      saveCurrentSession();
      if (currentSessionId) {
        generateSessionTitle(currentSessionId);
      }
    }, 0);
  },

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

  setLoading: (loading) => set({ isLoading: loading }),

  setSelectedModel: (model) => set({ selectedModel: model }),

  clearMessages: () => set({ messages: [] }),

  getApiMessages: () => {
    const { messages } = get();
    return messages
      .filter((msg) => !msg.isStreaming)
      .map((msg) => ({ role: msg.role, content: msg.content }));
  },

  sendMessage: async (message: string) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    // 현재 세션이 없으면 새로운 세션 생성
    if (!get().currentSessionId) {
      get().createNewSession();
    }

    const controller = new AbortController();

    try {
      set({ isLoading: true, abortController: controller });

      get().addMessage({
        role: 'user',
        content: trimmedMessage,
      });

      const apiMessages = get().getApiMessages();
      apiMessages.push({ role: 'user', content: trimmedMessage });

      const { selectedModel } = get();

      get().addMessage({
        role: 'assistant',
        content: '',
        isStreaming: true,
      });

      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
          model: selectedModel,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      if (reader) {
        while (true) {
          if (controller.signal.aborted) {
            await reader.cancel();
            break;
          }

          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.status === 'processing' && data.data) {
                  if (controller.signal.aborted) break;

                  accumulatedContent += data.data;
                  get().updateStreamingMessage(accumulatedContent);
                } else if (data.status === 'complete') {
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

          if (controller.signal.aborted) break;
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('요청이 취소되었습니다.');
      } else {
        console.error('메시지 전송 오류:', error);
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

  // 새로운 세션 생성
  createNewSession: () => {
    const sessionId = generateId();
    const newSession: ChatSession = {
      id: sessionId,
      title: '새로운 채팅',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    set((state) => ({
      currentSessionId: sessionId,
      messages: [],
      chatHistory: [newSession, ...state.chatHistory],
    }));

    get().saveChatHistory();
    return sessionId;
  },

  // 세션 로드
  loadSession: (sessionId: string) => {
    const { chatHistory } = get();
    const session = chatHistory.find((s) => s.id === sessionId);

    if (session) {
      set({
        currentSessionId: sessionId,
        messages: session.messages,
      });
    }
  },

  // 현재 세션 저장
  saveCurrentSession: () => {
    const { currentSessionId, messages, chatHistory } = get();
    if (!currentSessionId) return;

    const updatedHistory = chatHistory.map((session) => {
      if (session.id === currentSessionId) {
        return {
          ...session,
          messages: messages,
          updatedAt: Date.now(),
        };
      }
      return session;
    });

    set({ chatHistory: updatedHistory });
    get().saveChatHistory();
  },

  // 세션 삭제
  deleteSession: (sessionId: string) => {
    const { chatHistory, currentSessionId } = get();
    const updatedHistory = chatHistory.filter(
      (session) => session.id !== sessionId,
    );

    set(() => ({
      chatHistory: updatedHistory,
      // 현재 세션이 삭제되는 경우 초기화
      ...(currentSessionId === sessionId && {
        currentSessionId: null,
        messages: [],
      }),
    }));

    get().saveChatHistory();
  },

  // 세션 제목 생성
  generateSessionTitle: async (sessionId: string) => {
    const { chatHistory } = get();
    const session = chatHistory.find((s) => s.id === sessionId);

    if (!session || session.messages.length < 2) return;

    const userMessage = session.messages.find((m) => m.role === 'user');
    const aiMessage = session.messages.find((m) => m.role === 'assistant');

    if (!userMessage || !aiMessage) return;

    try {
      const response = await fetch('http://localhost:8000/generate-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userMessage: userMessage.content,
          aiResponse: aiMessage.content,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const title = data.title;

        const updatedHistory = chatHistory.map((s) => {
          if (s.id === sessionId) {
            return { ...s, title, updatedAt: Date.now() };
          }
          return s;
        });

        set({ chatHistory: updatedHistory });
        get().saveChatHistory();
      }
    } catch (error) {
      console.error('제목 생성 오류:', error);
    }
  },

  // 채팅 히스토리 로드
  loadChatHistory: () => {
    try {
      const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
      if (savedHistory) {
        const parsedHistory: ChatHistory = JSON.parse(savedHistory);
        set({
          chatHistory: parsedHistory.sessions || [],
          currentSessionId: parsedHistory.currentSessionId,
        });
      }
    } catch (error) {
      console.error('채팅 히스토리 로드 오류:', error);
    }
  },

  // 채팅 히스토리 저장
  saveChatHistory: () => {
    try {
      const { chatHistory, currentSessionId } = get();
      const historyToSave: ChatHistory = {
        sessions: chatHistory,
        currentSessionId,
      };
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(historyToSave));
    } catch (error) {
      console.error('채팅 히스토리 저장 오류:', error);
    }
  },
}));
