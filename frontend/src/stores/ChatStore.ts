import { create } from 'zustand';
import type {
  ChatMessage,
  ChatSession,
  ChatHistory,
  ModelParameters,
  ExtendedChatSession,
} from '@/types/types';

// 채팅 스토어 상태 타입
type ChatStore = {
  // 현재 채팅 상태
  messages: ChatMessage[];
  isLoading: boolean;
  selectedModel: string;

  // 입력값 제어 상태
  inputValue: string;

  // 채팅 히스토리 상태 (확장된 타입 사용)
  currentSessionId: string | null;
  chatHistory: ExtendedChatSession[];

  // 설정 관련 상태
  systemPrompt: string;
  modelParameters: ModelParameters;
  isSettingsOpen: boolean;

  // 기존 메서드들
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateStreamingMessage: (sessionId: string, content: string) => void;
  completeStreaming: (sessionId: string) => void;
  stopStreaming: (sessionId?: string) => void;
  setLoading: (loading: boolean) => void;
  setSelectedModel: (model: string) => void;
  clearMessages: () => void;
  getApiMessages: () => Array<{ role: string; content: string }>;
  sendMessage: (message: string) => Promise<void>;

  // 입력값 제어 메서드
  setInputValue: (value: string) => void;

  // 채팅 히스토리 메서드들
  startNewChat: () => void;
  createNewSession: () => string;
  loadSession: (sessionId: string) => void;
  saveCurrentSession: () => void;
  deleteSession: (sessionId: string) => void;
  renameSession: (sessionId: string, newTitle: string) => void;
  generateSessionTitle: (sessionId: string) => Promise<void>;
  loadChatHistory: () => void;
  saveChatHistory: () => void;

  // 설정 관련 메서드
  setSystemPrompt: (prompt: string) => void;
  setModelParameters: (params: Partial<ModelParameters>) => void;
  setIsSettingsOpen: (open: boolean) => void;
  resetSettings: () => void;
  loadSettings: () => void;
  saveSettings: () => void;

  // 세션별 상태 관리 헬퍼 메서드들
  getSessionById: (sessionId: string) => ExtendedChatSession | undefined;
  updateSessionState: (
    sessionId: string,
    updates: Partial<ExtendedChatSession>,
  ) => void;
  getSessionLoading: (sessionId: string) => boolean;
};

// 고유 ID 생성 함수
const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// 로컬 스토리지 키
const CHAT_HISTORY_KEY = 'chat_history';
const SETTINGS_KEY = 'chat_settings';

// 기본 설정값
const DEFAULT_SYSTEM_PROMPT =
  '당신은 도움이 되는 AI 어시스턴트입니다. 사용자의 질문에 친절하고 정확하게 한국어로 답변해주세요. 자연스럽고 이해하기 쉬운 한국어를 사용하며, 필요한 경우 예시나 설명을 추가해주세요.';

const DEFAULT_MODEL_PARAMETERS: ModelParameters = {
  temperature: 0.7,
  topP: 1.0,
  frequencyPenalty: 0,
  presencePenalty: 0,
};

// Zustand 스토어 생성
export const useChatStore = create<ChatStore>((set, get) => ({
  // 현재 채팅 상태 초기값
  messages: [],
  isLoading: false,
  selectedModel: 'gpt-3.5-turbo',

  // 입력값 상태 초기값
  inputValue: '',

  // 채팅 히스토리 상태 초기값
  currentSessionId: null,
  chatHistory: [],

  // 설정 관련 상태 초기값
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  modelParameters: DEFAULT_MODEL_PARAMETERS,
  isSettingsOpen: false,

  // 세션별 상태 관리 헬퍼 메서드들
  getSessionById: (sessionId: string) => {
    const { chatHistory } = get();
    return chatHistory.find((session) => session.id === sessionId);
  },

  updateSessionState: (
    sessionId: string,
    updates: Partial<ExtendedChatSession>,
  ) => {
    set((state) => ({
      chatHistory: state.chatHistory.map((session) =>
        session.id === sessionId ? { ...session, ...updates } : session,
      ),
    }));

    // 현재 세션의 로딩 상태가 변경된 경우 UI 상태도 동기화
    const { currentSessionId } = get();
    if (currentSessionId === sessionId && 'isLoading' in updates) {
      set({ isLoading: updates.isLoading || false });
    }
  },

  getSessionLoading: (sessionId: string) => {
    const session = get().getSessionById(sessionId);
    return session?.isLoading || false;
  },

  setLoading: (loading) => {
    const { currentSessionId } = get();

    // UI 상태 업데이트
    set({ isLoading: loading });

    // 현재 세션의 상태도 업데이트
    if (currentSessionId) {
      get().updateSessionState(currentSessionId, { isLoading: loading });
    }
  },

  addMessage: (message) => {
    const { currentSessionId } = get();
    if (!currentSessionId) return;

    const newMessage = {
      ...message,
      id: generateId(),
      timestamp: Date.now(),
    };

    // 현재 세션의 메시지 업데이트
    get().updateSessionState(currentSessionId, {
      messages: [
        ...(get().getSessionById(currentSessionId)?.messages || []),
        newMessage,
      ],
      updatedAt: Date.now(),
    });

    // 현재 표시되는 메시지도 업데이트 (currentSessionId가 현재 세션인 경우만)
    const { currentSessionId: currentId } = get();
    if (currentId === currentSessionId) {
      set((state) => ({
        messages: [...state.messages, newMessage],
      }));
    }

    // 첫 번째 사용자 메시지인 경우 즉시 제목 생성
    const session = get().getSessionById(currentSessionId);
    if (session && message.role === 'user' && session.messages.length === 0) {
      setTimeout(() => {
        get().generateSessionTitle(currentSessionId);
      }, 1000); // 1초 후 제목 생성 (AI 응답 시작을 기다림)
    }

    setTimeout(() => get().saveCurrentSession(), 0);
  },

  updateStreamingMessage: (sessionId: string, content: string) => {
    const session = get().getSessionById(sessionId);
    if (!session) return;

    const updatedMessages = session.messages.map((msg, index) =>
      index === session.messages.length - 1 && msg.role === 'assistant'
        ? { ...msg, content, isStreaming: true }
        : msg,
    );

    get().updateSessionState(sessionId, {
      messages: updatedMessages,
      updatedAt: Date.now(),
    });

    // 현재 표시 중인 세션인 경우 UI도 업데이트
    const { currentSessionId } = get();
    if (currentSessionId === sessionId) {
      set((state) => ({
        messages: state.messages.map((msg, index) =>
          index === state.messages.length - 1 && msg.role === 'assistant'
            ? { ...msg, content, isStreaming: true }
            : msg,
        ),
      }));
    }
  },

  completeStreaming: (sessionId: string) => {
    const session = get().getSessionById(sessionId);
    if (!session) return;

    const updatedMessages = session.messages.map((msg) => ({
      ...msg,
      isStreaming: false,
    }));

    get().updateSessionState(sessionId, {
      messages: updatedMessages,
      isLoading: false,
      abortController: undefined,
      updatedAt: Date.now(),
    });

    // 현재 표시 중인 세션인 경우 UI도 업데이트
    const { currentSessionId } = get();
    if (currentSessionId === sessionId) {
      set((state) => ({
        messages: state.messages.map((msg) => ({ ...msg, isStreaming: false })),
      }));
    }

    setTimeout(() => {
      get().saveCurrentSession();
      // 제목이 아직 "새로운 채팅"인 경우에만 업데이트
      const currentSession = get().getSessionById(sessionId);
      if (currentSession && currentSession.title === '새로운 채팅') {
        get().generateSessionTitle(sessionId);
      }
    }, 0);
  },

  stopStreaming: (sessionId?: string) => {
    const targetSessionId = sessionId || get().currentSessionId;
    if (!targetSessionId) return;

    const session = get().getSessionById(targetSessionId);
    if (!session?.abortController) return;

    session.abortController.abort();

    const updatedMessages = session.messages.map((msg) => ({
      ...msg,
      isStreaming: false,
    }));

    get().updateSessionState(targetSessionId, {
      messages: updatedMessages,
      isLoading: false,
      abortController: undefined,
    });

    // 현재 표시 중인 세션인 경우 UI도 업데이트
    const { currentSessionId } = get();
    if (currentSessionId === targetSessionId) {
      set((state) => ({
        messages: state.messages.map((msg) => ({ ...msg, isStreaming: false })),
      }));
    }
  },

  setSelectedModel: (model) => set({ selectedModel: model }),

  clearMessages: () => {
    const { currentSessionId } = get();
    if (currentSessionId) {
      get().updateSessionState(currentSessionId, { messages: [] });
    }
    set({ messages: [] });
  },

  setInputValue: (value) => set({ inputValue: value }),

  getApiMessages: () => {
    const { currentSessionId } = get();
    if (!currentSessionId) return [];

    const session = get().getSessionById(currentSessionId);
    if (!session) return [];

    return session.messages
      .filter((msg) => !msg.isStreaming)
      .map((msg) => ({ role: msg.role, content: msg.content }));
  },

  sendMessage: async (message: string) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    let sessionId = get().currentSessionId;
    if (!sessionId) {
      sessionId = get().createNewSession();
    }

    const controller = new AbortController();

    try {
      // 세션에 abortController와 로딩 상태 설정
      get().updateSessionState(sessionId, {
        isLoading: true,
        abortController: controller,
      });

      get().addMessage({
        role: 'user',
        content: trimmedMessage,
      });

      const apiMessages = get().getApiMessages();

      // 시스템 프롬프트 추가
      const { systemPrompt, selectedModel, modelParameters } = get();
      const messagesWithSystem = [
        { role: 'system', content: systemPrompt },
        ...apiMessages,
        { role: 'user', content: trimmedMessage },
      ];

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
          messages: messagesWithSystem,
          model: selectedModel,
          ...modelParameters,
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
                  get().updateStreamingMessage(sessionId, accumulatedContent);
                } else if (data.status === 'complete') {
                  get().completeStreaming(sessionId);
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
      get().completeStreaming(sessionId);
    }
  },

  startNewChat: () => {
    set({
      currentSessionId: null,
      messages: [],
      inputValue: '',
      isLoading: false, // 새 채팅 시작 시 로딩 상태 초기화
    });
  },

  createNewSession: () => {
    const sessionId = generateId();
    const newSession: ExtendedChatSession = {
      id: sessionId,
      title: '새로운 채팅',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isLoading: false,
    };

    set((state) => ({
      currentSessionId: sessionId,
      messages: [],
      chatHistory: [newSession, ...state.chatHistory],
    }));

    get().saveChatHistory();
    return sessionId;
  },

  loadSession: (sessionId: string) => {
    const session = get().getSessionById(sessionId);

    if (session) {
      set({
        currentSessionId: sessionId,
        messages: session.messages,
        inputValue: '',
        isLoading: session.isLoading || false, // 세션의 로딩 상태도 동기화
      });
    }
  },

  saveCurrentSession: () => {
    const { currentSessionId } = get();
    if (!currentSessionId) return;

    const session = get().getSessionById(currentSessionId);
    if (!session) return;

    get().updateSessionState(currentSessionId, {
      updatedAt: Date.now(),
    });

    get().saveChatHistory();
  },

  deleteSession: (sessionId: string) => {
    // 삭제하기 전에 진행 중인 스트리밍이 있다면 중단
    get().stopStreaming(sessionId);

    const { chatHistory, currentSessionId } = get();
    const updatedHistory = chatHistory.filter(
      (session) => session.id !== sessionId,
    );

    set(() => ({
      chatHistory: updatedHistory,
      ...(currentSessionId === sessionId && {
        currentSessionId: null,
        messages: [],
        inputValue: '',
      }),
    }));

    get().saveChatHistory();
  },

  renameSession: (sessionId: string, newTitle: string) => {
    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle) return;

    get().updateSessionState(sessionId, {
      title: trimmedTitle,
      updatedAt: Date.now(),
    });

    get().saveChatHistory();
  },

  generateSessionTitle: async (sessionId: string) => {
    const session = get().getSessionById(sessionId);
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

        get().updateSessionState(sessionId, {
          title,
          updatedAt: Date.now(),
        });

        get().saveChatHistory();
      }
    } catch (error) {
      console.error('제목 생성 오류:', error);
    }
  },

  loadChatHistory: () => {
    try {
      const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
      if (savedHistory) {
        const parsedHistory: ChatHistory = JSON.parse(savedHistory);

        // 저장된 세션들을 ExtendedChatSession으로 변환
        const extendedSessions: ExtendedChatSession[] = (
          parsedHistory.sessions || []
        ).map((session) => ({
          ...session,
          isLoading: false, // 로드 시에는 로딩 상태 초기화
          abortController: undefined, // abortController는 복원하지 않음
        }));

        set({
          chatHistory: extendedSessions,
          currentSessionId: null,
          messages: [],
          inputValue: '',
        });
      }
    } catch (error) {
      console.error('채팅 히스토리 로드 오류:', error);
    }
  },

  saveChatHistory: () => {
    try {
      const { chatHistory, currentSessionId } = get();

      // 저장할 때는 abortController와 isLoading 제외
      const sessionsToSave: ChatSession[] = chatHistory.map((session) => ({
        id: session.id,
        title: session.title,
        messages: session.messages,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      }));

      const historyToSave: ChatHistory = {
        sessions: sessionsToSave,
        currentSessionId,
      };

      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(historyToSave));
    } catch (error) {
      console.error('채팅 히스토리 저장 오류:', error);
    }
  },

  // 설정 관련 메서드 구현
  setSystemPrompt: (prompt: string) => {
    set({ systemPrompt: prompt });
    get().saveSettings();
  },

  setModelParameters: (params: Partial<ModelParameters>) => {
    set((state) => ({
      modelParameters: { ...state.modelParameters, ...params },
    }));
    get().saveSettings();
  },

  setIsSettingsOpen: (open: boolean) => {
    set({ isSettingsOpen: open });
  },

  resetSettings: () => {
    set({
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      modelParameters: DEFAULT_MODEL_PARAMETERS,
    });
    get().saveSettings();
  },

  loadSettings: () => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        const { systemPrompt, modelParameters } = JSON.parse(savedSettings);
        set({
          systemPrompt: systemPrompt || DEFAULT_SYSTEM_PROMPT,
          modelParameters: { ...DEFAULT_MODEL_PARAMETERS, ...modelParameters },
        });
      }
    } catch (error) {
      console.error('설정 로드 오류:', error);
    }
  },

  saveSettings: () => {
    try {
      const { systemPrompt, modelParameters } = get();
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
          systemPrompt,
          modelParameters,
        }),
      );
    } catch (error) {
      console.error('설정 저장 오류:', error);
    }
  },
}));
