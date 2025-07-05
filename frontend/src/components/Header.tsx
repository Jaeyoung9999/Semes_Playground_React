type HeaderProps = {
  messagesCount: number;
  onClearMessages: () => void;
};

export default function Header({
  messagesCount,
  onClearMessages,
}: HeaderProps) {
  return (
    <header className="bg-white shadow-sm p-4 border-b sticky top-0 z-20">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">AI 채팅</h1>

        {/* 채팅 초기화 버튼 */}
        {messagesCount > 0 && (
          <button
            onClick={onClearMessages}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            채팅 초기화
          </button>
        )}
      </div>
    </header>
  );
}
