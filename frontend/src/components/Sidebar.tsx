type SidebarProps = {
  isOpen: boolean;
  onToggle: () => void;
};

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
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

          {/* 사이드바 내용 */}
          <div className="flex-1 p-4">
            {/* 여기에 추후 채팅 목록이나 다른 컨텐츠 추가 */}
            <div className="text-gray-400 text-sm whitespace-nowrap">
              채팅 목록이 여기에 표시됩니다
            </div>
          </div>
        </div>
      ) : (
        // 닫힌 사이드바 (얇은 바)
        <div className="flex flex-col h-full items-center py-4">
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
        </div>
      )}
    </div>
  );
}
