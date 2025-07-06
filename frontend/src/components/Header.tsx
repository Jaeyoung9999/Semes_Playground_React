import { useChatStore } from '@/stores/ChatStore';
import SettingsDropdown from '@/components/SettingsDropdown';

export default function Header() {
  const { selectedModel, setSelectedModel, isSettingsOpen, setIsSettingsOpen } =
    useChatStore();

  const models = [
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'gpt-4o', label: 'GPT-4o' },
  ];

  return (
    <header className="bg-white p-4 sticky top-0 z-20">
      <div className="flex items-center justify-between w-full">
        {/* 좌측 - 모델 선택 */}
        <div className="flex items-center space-x-4">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="text-gray-700 py-2 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-100 transition-colors"
          >
            {models.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
        </div>

        {/* 우측 - 설정 버튼 */}
        <div className="relative">
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="설정"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>

          {/* 설정 드롭다운 */}
          <SettingsDropdown
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
          />
        </div>
      </div>
    </header>
  );
}
