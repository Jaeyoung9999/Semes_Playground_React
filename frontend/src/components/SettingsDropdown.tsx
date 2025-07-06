import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '@/stores/ChatStore';

type SettingsDropdownProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function SettingsDropdown({
  isOpen,
  onClose,
}: SettingsDropdownProps) {
  const {
    systemPrompt,
    modelParameters,
    setSystemPrompt,
    setModelParameters,
    resetSettings,
    loadSettings,
  } = useChatStore();

  const [localSystemPrompt, setLocalSystemPrompt] = useState(systemPrompt);
  const [localParameters, setLocalParameters] = useState(modelParameters);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 드롭다운이 열릴 때 설정 로드
  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen, loadSettings]);

  // 스토어의 설정이 변경되면 로컬 상태 업데이트
  useEffect(() => {
    setLocalSystemPrompt(systemPrompt);
    setLocalParameters(modelParameters);
  }, [systemPrompt, modelParameters]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSave = () => {
    setSystemPrompt(localSystemPrompt);
    setModelParameters(localParameters);
    onClose();
  };

  const handleReset = () => {
    resetSettings();
    setLocalSystemPrompt(systemPrompt);
    setLocalParameters(modelParameters);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-lg font-medium text-gray-800">설정</h3>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* System Prompt Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            시스템 프롬프트
          </label>
          <textarea
            value={localSystemPrompt}
            onChange={(e) => setLocalSystemPrompt(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="AI가 어떻게 행동해야 하는지 설명해주세요..."
          />
        </div>

        {/* Model Parameters Section */}
        <div>
          <h4 className="text-sm font-medium text-gray-800 mb-3">
            모델 파라미터
          </h4>
          <div className="space-y-3">
            {/* Temperature */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Temperature: {localParameters.temperature}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={localParameters.temperature}
                onChange={(e) =>
                  setLocalParameters({
                    ...localParameters,
                    temperature: parseFloat(e.target.value),
                  })
                }
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>보수적</span>
                <span>창의적</span>
              </div>
            </div>

            {/* Top P */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Top P: {localParameters.topP}
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={localParameters.topP}
                onChange={(e) =>
                  setLocalParameters({
                    ...localParameters,
                    topP: parseFloat(e.target.value),
                  })
                }
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>집중적</span>
                <span>다양함</span>
              </div>
            </div>

            {/* Frequency Penalty */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                빈도 패널티: {localParameters.frequencyPenalty}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={localParameters.frequencyPenalty}
                onChange={(e) =>
                  setLocalParameters({
                    ...localParameters,
                    frequencyPenalty: parseFloat(e.target.value),
                  })
                }
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>반복 허용</span>
                <span>반복 방지</span>
              </div>
            </div>

            {/* Presence Penalty */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                존재 패널티: {localParameters.presencePenalty}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={localParameters.presencePenalty}
                onChange={(e) =>
                  setLocalParameters({
                    ...localParameters,
                    presencePenalty: parseFloat(e.target.value),
                  })
                }
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>주제 집중</span>
                <span>주제 확산</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50">
        <button
          onClick={handleReset}
          className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
        >
          초기화
        </button>
        <div className="flex space-x-2">
          <button
            onClick={onClose}
            className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
