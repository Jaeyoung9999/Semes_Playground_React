import { useChatStore } from '@stores/ChatStore';

export default function Header() {
  const { selectedModel, setSelectedModel } = useChatStore();

  const models = [
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'gpt-4o', label: 'GPT-4o' },
  ];

  return (
    <header className="bg-white p-4 sticky top-0 z-20">
      <div className="max-w-4xl flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* 모델 선택 드롭다운 */}
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
      </div>
    </header>
  );
}
