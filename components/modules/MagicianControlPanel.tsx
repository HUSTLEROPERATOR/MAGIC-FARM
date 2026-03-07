'use client';

import { useState } from 'react';
import { MagicWand, Zap, RefreshCw, Eye, ChevronRight } from '@/lib/ui/icons';

interface ControlField {
  name: string;
  type: 'text' | 'number' | 'select' | 'action';
  label: string;
  options?: string[];
  min?: number;
  max?: number;
  placeholder?: string;
  defaultValue?: string | number;
}

interface MagicianControlPanelProps {
  moduleKey: string;
  moduleName: string;
  fields: ControlField[];
  onExecute: (input: Record<string, unknown>) => Promise<void>;
  onReset?: () => void;
  currentStep?: number;
  totalSteps?: number;
  loading?: boolean;
}

/**
 * Universal control panel for magician-controlled modules.
 * Renders input fields, action buttons, and step navigation.
 * Used when a module requires input but doesn't have custom UI.
 */
export function MagicianControlPanel({
  moduleKey,
  moduleName,
  fields,
  onExecute,
  onReset,
  currentStep,
  totalSteps,
  loading = false,
}: MagicianControlPanelProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [collapsed, setCollapsed] = useState(false);

  const updateField = (name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleExecute = async () => {
    await onExecute(formData);
  };

  const handleQuickAction = async (actionValue: string) => {
    await onExecute({ action: actionValue, ...formData });
  };

  // Auto-generate random values for common field types
  const generateRandomValue = (field: ControlField): unknown => {
    if (field.type === 'number') {
      const min = field.min ?? 1;
      const max = field.max ?? 100;
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    if (field.type === 'select' && field.options && field.options.length > 0) {
      return field.options[Math.floor(Math.random() * field.options.length)];
    }
    if (field.name.toLowerCase().includes('card')) {
      const cards = ['7 di Cuori', 'Asso di Picche', 'Re di Fiori', '9 di Quadri', 'Regina di Cuori'];
      return cards[Math.floor(Math.random() * cards.length)];
    }
    return field.defaultValue ?? '';
  };

  const fillRandom = () => {
    const randomData: Record<string, unknown> = {};
    fields.forEach((field) => {
      if (field.type !== 'action') {
        randomData[field.name] = generateRandomValue(field);
      }
    });
    setFormData(randomData);
  };

  const actionFields = fields.filter((f) => f.type === 'action');
  const inputFields = fields.filter((f) => f.type !== 'action');

  return (
    <div className="bg-magic-purple/10 border border-magic-purple/30 rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className="px-3 py-2 bg-magic-purple/20 flex items-center justify-between cursor-pointer select-none"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          <MagicWand className="w-4 h-4 text-magic-gold" />
          <span className="text-magic-gold text-xs font-semibold">Controllo Mago</span>
          {currentStep !== undefined && totalSteps && (
            <span className="text-white/40 text-xs">
              {currentStep}/{totalSteps}
            </span>
          )}
        </div>
        <ChevronRight
          className={`w-4 h-4 text-white/40 transition-transform ${collapsed ? '' : 'rotate-90'}`}
        />
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="p-3 space-y-3">
          {/* Input Fields */}
          {inputFields.length > 0 && (
            <div className="space-y-2">
              {inputFields.map((field) => (
                <div key={field.name}>
                  <label className="text-white/60 text-xs block mb-1">{field.label}</label>
                  {field.type === 'text' && (
                    <input
                      type="text"
                      value={(formData[field.name] as string) ?? ''}
                      onChange={(e) => updateField(field.name, e.target.value)}
                      placeholder={field.placeholder ?? field.label}
                      className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:border-magic-purple/50"
                      disabled={loading}
                    />
                  )}
                  {field.type === 'number' && (
                    <input
                      type="number"
                      value={(formData[field.name] as number) ?? ''}
                      onChange={(e) => updateField(field.name, Number(e.target.value))}
                      min={field.min}
                      max={field.max}
                      placeholder={field.placeholder ?? field.label}
                      className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:border-magic-purple/50"
                      disabled={loading}
                    />
                  )}
                  {field.type === 'select' && field.options && (
                    <select
                      value={(formData[field.name] as string) ?? ''}
                      onChange={(e) => updateField(field.name, e.target.value)}
                      className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:border-magic-purple/50"
                      disabled={loading}
                    >
                      <option value="">-- Scegli --</option>
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}

              {/* Quick Fill Button */}
              {inputFields.length > 0 && (
                <button
                  onClick={fillRandom}
                  disabled={loading}
                  className="text-xs text-magic-mystic hover:text-magic-gold transition-colors disabled:opacity-40"
                >
                  ✨ Compila Automatico
                </button>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {actionFields.length > 0 ? (
            <div className="flex gap-2 flex-wrap">
              {actionFields.map((action) => (
                <button
                  key={action.name}
                  onClick={() => handleQuickAction(action.name)}
                  disabled={loading}
                  className="flex-1 min-w-[100px] py-2 rounded-lg bg-magic-gold/20 text-magic-gold hover:bg-magic-gold/30 text-xs font-medium disabled:opacity-40 transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex gap-2">
              {/* Execute Button */}
              <button
                onClick={handleExecute}
                disabled={loading}
                className="flex-1 py-2 rounded-lg bg-magic-purple/30 text-magic-mystic hover:bg-magic-purple/50 text-sm font-medium disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    {currentStep !== undefined ? 'Avanti' : 'Esegui'}
                  </>
                )}
              </button>

              {/* Reset Button */}
              {onReset && (
                <button
                  onClick={onReset}
                  disabled={loading}
                  className="px-3 py-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 text-sm disabled:opacity-40 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Info */}
          <p className="text-white/30 text-[10px] italic">
            Il mago guida verbalmente. Il pubblico non vede questo pannello.
          </p>
        </div>
      )}
    </div>
  );
}
