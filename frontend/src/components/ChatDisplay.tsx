import MDEditor from '@uiw/react-md-editor';
import { useChatStore } from '@stores/ChatStore';

// 채팅 메시지 표시 컴포넌트
export default function ChatDisplay() {
  const { messages, isLoading } = useChatStore();

  // 메시지가 없을 때 표시할 초기 화면
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">💬</div>
          <h2 className="text-2xl font-semibold mb-2">채팅을 시작해보세요</h2>
          <p>아래 입력창에 메시지를 입력하여 AI와 대화할 수 있습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[80%] p-4 space-y-4">
      {/* 채팅 메시지 목록 */}
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={` ${
              message.role === 'user'
                ? 'rounded-lg p-4 bg-gray-100 text-gray-800 ml-auto' // 사용자 메시지: 오른쪽 정렬, 파란색
                : 'w-full text-gray-800 mr-auto' // AI 메시지: 왼쪽 정렬, 회색
            }`}
          >
            {/* 메시지 내용 */}
            <div
              className={`prose max-w-none ${message.role === 'user' ? 'prose-invert' : ''}`}
            >
              {message.role === 'user' ? (
                // 사용자 메시지는 일반 텍스트로 표시
                <p className="whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              ) : (
                // AI 메시지는 마크다운 에디터로 표시
                <MDEditor.Markdown
                  source={message.content}
                  style={{
                    backgroundColor: 'transparent',
                    color: 'inherit',
                  }}
                />
              )}
            </div>

            {/* 메시지 시간 표시 */}
            {!isLoading && (
              <div className="text-xs opacity-75 mt-2">
                {new Date(message.timestamp).toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
