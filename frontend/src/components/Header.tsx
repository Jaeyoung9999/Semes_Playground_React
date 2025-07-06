import { useChatStore } from '@/stores/ChatStore';
import SettingsDropdown from '@/components/SettingsDropdown';
import SettingIcon from '@icons/setting.svg?react';

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
            <SettingIcon />
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
