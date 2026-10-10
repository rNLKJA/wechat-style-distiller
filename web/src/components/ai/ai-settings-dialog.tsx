'use client';

import { useState, useEffect } from 'react';
import { Settings, X, Eye, EyeOff } from 'lucide-react';
import {
  loadAISettings,
  saveAISettings,
  clearAISettings,
  type AISettings,
} from '@/lib/ai/settings';
import { DEFAULT_MODELS, type AIProvider } from '@/lib/ai/client';

interface AISettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange?: (settings: AISettings | null) => void;
}

export function AISettingsDialog({ isOpen, onClose, onSettingsChange }: AISettingsDialogProps) {
  const [provider, setProvider] = useState<AIProvider>('anthropic');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState<string>(DEFAULT_MODELS.anthropic);
  const [rememberKey, setRememberKey] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const settings = loadAISettings();
      if (settings) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setProvider(settings.provider);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setApiKey(settings.apiKey);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setModel(settings.model);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRememberKey(settings.rememberKey);
      }
    }
  }, [isOpen]);

  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    setModel(DEFAULT_MODELS[newProvider]);
  };

  const handleSave = () => {
    const settings: AISettings = {
      provider,
      apiKey: apiKey.trim(),
      model,
      rememberKey,
    };

    saveAISettings(settings);
    onSettingsChange?.(settings);
    onClose();
  };

  const handleForget = () => {
    clearAISettings();
    setApiKey('');
    setRememberKey(false);
    onSettingsChange?.(null);
    onClose();
  };

  if (!isOpen) return null;

  const hasKey = apiKey.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-6 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-[--color-wechat-green]" />
            <h2 className="text-xl font-bold">AI Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-6 p-6">
          {/* Provider */}
          <div>
            <label className="mb-2 block text-sm font-medium">Provider</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleProviderChange('anthropic')}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  provider === 'anthropic'
                    ? 'border-[--color-wechat-green] bg-[--color-wechat-green]/10 text-[--color-wechat-green]'
                    : 'border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900'
                }`}
              >
                Anthropic
              </button>
              <button
                onClick={() => handleProviderChange('openai')}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  provider === 'openai'
                    ? 'border-[--color-wechat-green] bg-[--color-wechat-green]/10 text-[--color-wechat-green]'
                    : 'border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900'
                }`}
              >
                OpenAI
              </button>
            </div>
          </div>

          {/* API Key */}
          <div>
            <label htmlFor="api-key" className="mb-2 block text-sm font-medium">
              API Key
            </label>
            <div className="relative">
              <input
                id="api-key"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  provider === 'anthropic'
                    ? 'sk-ant-api03-...'
                    : 'sk-proj-...'
                }
                className="w-full rounded-lg border border-zinc-300 px-4 py-2 pr-10 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4 text-zinc-500" />
                ) : (
                  <Eye className="h-4 w-4 text-zinc-500" />
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-600">
              Your key is stored in your browser only. Never sent to our servers.
            </p>
          </div>

          {/* Model */}
          <div>
            <label htmlFor="model" className="mb-2 block text-sm font-medium">
              Model
            </label>
            <input
              id="model"
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-600">
              Default: {DEFAULT_MODELS[provider]}
            </p>
          </div>

          {/* Remember Key */}
          <div className="flex items-start gap-3">
            <input
              id="remember-key"
              type="checkbox"
              checked={rememberKey}
              onChange={(e) => setRememberKey(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-zinc-300 text-[--color-wechat-green] focus:ring-[--color-wechat-green]"
            />
            <div>
              <label htmlFor="remember-key" className="text-sm font-medium">
                Remember on this device
              </label>
              <p className="text-xs text-zinc-500 dark:text-zinc-600">
                Store in localStorage (persists across sessions). Otherwise sessionStorage (current
                tab only).
              </p>
            </div>
          </div>

          {/* Security Notice */}
          <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm dark:border-yellow-900 dark:bg-yellow-950">
            <p className="font-medium text-yellow-900 dark:text-yellow-200">Security Notice</p>
            <ul className="mt-2 space-y-1 text-xs text-yellow-800 dark:text-yellow-300">
              <li>• Keys stored locally in your browser</li>
              <li>• Calls go directly from your browser to {provider === 'anthropic' ? 'Anthropic' : 'OpenAI'}</li>
              <li>• Our server never sees your key or prompts</li>
              <li>• All interactions logged in the AI audit trail</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t p-6 dark:border-zinc-800">
          {hasKey && (
            <button
              onClick={handleForget}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
            >
              Forget Key
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasKey}
            className="rounded-lg bg-[--color-wechat-green] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
