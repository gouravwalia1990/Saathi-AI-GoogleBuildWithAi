import React from 'react';
import { useApp } from '../context/AppContext';
import { getSystemDiagnostics } from '../services/aiProvider';
import {
  Activity,
  CheckCircle2,
  Server,
  Database,
  Shield,
  Clock,
  Sparkles,
  Play,
  X,
  RefreshCw,
} from 'lucide-react';

interface SystemDiagnosticsModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const SystemDiagnosticsModal: React.FC<SystemDiagnosticsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    isDiagnosticsOpen,
    setIsDiagnosticsOpen,
    isDemoMode,
    toggleDemoMode,
    sessionId,
    userProfile,
    setActiveTab,
    setExplainPreloadText,
    setSafetyPreloadText,
    openTalkWithPrompt,
  } = useApp();

  const isModalOpen = isOpen !== undefined ? isOpen : isDiagnosticsOpen;
  const handleClose = () => {
    if (onClose) onClose();
    setIsDiagnosticsOpen(false);
  };

  if (!isModalOpen) return null;

  const diagnostics = getSystemDiagnostics(isDemoMode);

  const runScenarioA = () => {
    handleClose();
    setExplainPreloadText(
      'BSES Rajdhani Power Limited. Bill No: 102948192. Total Amount Due: Rs 1,842. Due Date: 24 September 2026. Avoid late surcharge.'
    );
    setActiveTab('explain');
  };

  const runScenarioB = () => {
    handleClose();
    setSafetyPreloadText(
      'Congratulations! You have won ₹25,00,000 from KBC Lottery. Click this link immediately and submit your OTP to claim your prize.'
    );
    setActiveTab('safety');
  };

  const runScenarioC = () => {
    handleClose();
    openTalkWithPrompt('Mujhe kal doctor ke paas jaana hai at 11 AM.');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="System Diagnostics"
      data-testid="diagnostics-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-7 shadow-2xl border-2 border-stone-300 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center">
              <Activity className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-stone-900 tracking-tight">
                SAATHI System Diagnostics
              </h2>
              <span className="text-xs font-semibold text-stone-500">
                Evaluation Testability & Health Monitor (V3 Section 34)
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsDiagnosticsOpen(false)}
            aria-label="Close Diagnostics"
            className="p-2 rounded-xl hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diagnostics Checklist Matrix */}
        <div className="space-y-2.5">
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-sm text-stone-800">UI & Accessibility Layer</span>
            </div>
            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
              {diagnostics.ui}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Server className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold text-sm text-stone-800 block">AI Orchestrator & Provider</span>
                <span className="text-xs text-stone-500">{diagnostics.aiProvider}</span>
              </div>
            </div>
            <span
              className={`text-xs font-black px-2.5 py-1 rounded-full ${
                isDemoMode
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}
            >
              {diagnostics.mode} MODE
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-sm text-stone-800">Safety & Scam Analyzer</span>
            </div>
            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
              {diagnostics.safetyService}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-sm text-stone-800">Reminder & Action Planner</span>
            </div>
            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
              {diagnostics.reminderService}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-sm text-stone-800 block">Storage & Session Isolation</span>
                <span className="text-xs text-stone-500">
                  {isDemoMode ? 'Demo Persona (Mr. Sharma)' : `Isolated Visitor (${userProfile.displayName || 'Anonymous'})`}
                </span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
              {isDemoMode ? 'namespace: demo' : `namespace: ${sessionId.slice(0, 12)}`}
            </span>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 flex items-center justify-between gap-3">
          <div>
            <span className="font-black text-sm text-amber-950 block">
              Evaluator Test Mode Toggle
            </span>
            <span className="text-xs font-medium text-amber-800">
              {isDemoMode
                ? 'Deterministic fixtures enabled for 100% predictable evaluation.'
                : 'Real Gemini model (gemini-2.5-flash) active via server proxy.'}
            </span>
          </div>
          <button
            data-testid="demo-mode-toggle"
            onClick={toggleDemoMode}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all shadow-xs shrink-0 ${
              isDemoMode
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-stone-800 hover:bg-stone-900 text-white'
            }`}
          >
            {isDemoMode ? 'Switch to Real Gemini' : 'Switch to Demo Provider'}
          </button>
        </div>

        {/* 1-Click Seeded Evaluation Scenarios (V3 Section 21) */}
        <div className="space-y-2 pt-2">
          <span className="text-xs font-black uppercase tracking-wider text-stone-500 block">
            1-Click Evaluator Scenarios (Section 21)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              data-testid="demo-scenario-bill"
              onClick={runScenarioA}
              className="p-3 rounded-xl bg-stone-100 hover:bg-amber-100 border border-stone-300 hover:border-amber-400 text-left transition-colors group"
            >
              <span className="text-xs font-bold text-stone-900 block group-hover:text-amber-900">
                Scenario A: Electricity Bill
              </span>
              <span className="text-[11px] text-stone-500 block mt-0.5">
                ₹1,842 due 24 Sep
              </span>
            </button>

            <button
              data-testid="demo-scenario-safety"
              onClick={runScenarioB}
              className="p-3 rounded-xl bg-stone-100 hover:bg-rose-100 border border-stone-300 hover:border-rose-400 text-left transition-colors group"
            >
              <span className="text-xs font-bold text-stone-900 block group-hover:text-rose-900">
                Scenario B: Prize Scam
              </span>
              <span className="text-[11px] text-stone-500 block mt-0.5">
                ₹25L Lottery + OTP scam
              </span>
            </button>

            <button
              data-testid="demo-scenario-appointment"
              onClick={runScenarioC}
              className="p-3 rounded-xl bg-stone-100 hover:bg-sky-100 border border-stone-300 hover:border-sky-400 text-left transition-colors group"
            >
              <span className="text-xs font-bold text-stone-900 block group-hover:text-sky-900">
                Scenario C: Appointment
              </span>
              <span className="text-[11px] text-stone-500 block mt-0.5">
                Kal doctor 11 AM
              </span>
            </button>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={() => setIsDiagnosticsOpen(false)}
            className="w-full py-3 rounded-xl bg-stone-900 hover:bg-black text-white font-bold text-sm transition-all"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
