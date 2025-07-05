import { useChatStore } from '@stores/ChatStore';
import { useEffect, useState, useRef } from 'react';

type SidebarProps = {
  isOpen: boolean;
  onToggle: () => void;
};

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const {
    chatHistory,
    currentSessionId,
    createNewSession,
    loadSession,
    deleteSession,
    renameSession,
    loadChatHistory,
  } = useChatStore();

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // 컴포넌트 마운트 시 히스토리 로드
  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);

  // 드롭다운 외부 클릭 감지 (수정된 버전)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      // 클릭된 요소가 드롭다운 버튼이나 드롭다운 메뉴 안에 있는지 확인
      const isDropdownButton = target.closest('[data-dropdown-button]');
      const isDropdownMenu = target.closest('[data-dropdown-menu]');

      if (!isDropdownButton && !isDropdownMenu) {
        setActiveDropdown(null);
      }
    };

    if (activeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [activeDropdown]);

  // 편집 모드 시 input에 포커스
  useEffect(() => {
    if (editingSession && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingSession]);

  // 새 채팅 시작
  const handleNewChat = () => {
    createNewSession();
  };

  // 채팅 세션 선택
  const handleSelectSession = (sessionId: string) => {
    if (editingSession) return; // 편집 중일 때는 선택 방지
    loadSession(sessionId);
  };

  // 드롭다운 메뉴 토글
  const handleDropdownToggle = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === sessionId ? null : sessionId);
  };

  // 이름 변경 시작
  const handleStartRename = (sessionId: string) => {
    const session = chatHistory.find((s) => s.id === sessionId);
    if (session) {
      setEditingSession(sessionId);
      setEditingTitle(session.title);
      setActiveDropdown(null);
    }
  };

  // 이름 변경 완료
  const handleRenameComplete = () => {
    if (editingSession && editingTitle.trim()) {
      renameSession(editingSession, editingTitle.trim());
    }
    setEditingSession(null);
    setEditingTitle('');
  };

  // 이름 변경 취소
  const handleRenameCancel = () => {
    setEditingSession(null);
    setEditingTitle('');
  };

  // 키보드 이벤트 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameComplete();
    } else if (e.key === 'Escape') {
      handleRenameCancel();
    }
  };

  // 채팅 삭제
  const handleDeleteSession = (sessionId: string) => {
    if (confirm('이 채팅을 삭제하시겠습니까?')) {
      deleteSession(sessionId);
    }
    setActiveDropdown(null);
  };

  // 시간 포맷팅
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('ko-KR', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  return (
    <div
      className={`${isOpen ? 'w-64' : 'w-12'} transition-all duration-300 bg-gray-900 text-white flex flex-col fixed left-0 top-0 h-full z-30 overflow-hidden`}
    >
      {isOpen ? (
        // 열린 사이드바
        <div className="flex flex-col h-full min-w-64">
          {/* 사이드바 헤더 */}
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold whitespace-nowrap">
              PlayGround
            </h2>
            <button
              onClick={onToggle}
              className="p-1 hover:bg-gray-700 rounded-md transition-colors"
              title="사이드바 닫기"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M11 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* 새 채팅 버튼 */}
          <div className="p-4 border-b border-gray-700">
            <button
              onClick={handleNewChat}
              className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              새 채팅
            </button>
          </div>

          {/* 채팅 히스토리 */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              {chatHistory.length === 0 ? (
                <div className="text-gray-400 text-sm text-center py-8">
                  채팅 히스토리가 없습니다
                </div>
              ) : (
                <div className="space-y-1">
                  {chatHistory.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => handleSelectSession(session.id)}
                      className={`group relative p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-800 ${
                        currentSessionId === session.id ? 'bg-gray-800' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          {editingSession === session.id ? (
                            // 편집 모드
                            <input
                              ref={inputRef}
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onBlur={handleRenameComplete}
                              onKeyDown={handleKeyDown}
                              className="w-full bg-gray-700 text-white text-sm font-medium px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            // 일반 모드
                            <div className="text-sm font-medium text-white truncate">
                              {session.title}
                            </div>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            {formatTime(session.updatedAt)}
                          </div>
                        </div>

                        {/* 드롭다운 메뉴 버튼 */}
                        <div className="relative">
                          <button
                            onClick={(e) => handleDropdownToggle(session.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition-all ml-2"
                            title="메뉴"
                            data-dropdown-button
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <circle cx="12" cy="12" r="1" />
                              <circle cx="12" cy="5" r="1" />
                              <circle cx="12" cy="19" r="1" />
                            </svg>
                          </button>

                          {/* 드롭다운 메뉴 */}
                          {activeDropdown === session.id && (
                            <div
                              className="absolute right-0 top-8 w-32 bg-gray-800 border border-gray-700 rounded-md shadow-lg py-1 z-50"
                              data-dropdown-menu
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartRename(session.id);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-white hover:bg-gray-700 flex items-center gap-2"
                              >
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                이름 변경
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSession(session.id);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
                              >
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  <line x1="10" y1="11" x2="10" y2="17" />
                                  <line x1="14" y1="11" x2="14" y2="17" />
                                </svg>
                                삭제
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // 닫힌 사이드바 (얇은 바)
        <div className="flex flex-col h-full items-center py-4 space-y-4">
          {/* 사이드바 열기 버튼 */}
          <button
            onClick={onToggle}
            className="p-2 hover:bg-gray-700 rounded-md transition-colors"
            title="사이드바 열기"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M13 5l7 7-7 7" />
            </svg>
          </button>

          {/* 새 채팅 버튼 (작은 버전) */}
          <button
            onClick={handleNewChat}
            className="p-2 hover:bg-gray-700 rounded-md transition-colors"
            title="새 채팅"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
