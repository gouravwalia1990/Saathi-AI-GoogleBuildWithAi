import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message, subMessage }) => {
  const { settings } = useApp();
  const isHindi = settings.language === 'hi';

  const defaultMsg = isHindi ? 'साथी इसे समझ रहा है...' : 'SAATHI is understanding this...';
  const defaultSub = isHindi ? 'कृपया थोड़ा इंतज़ार करें, हम सरल शब्दों में जानकारी तैयार कर रहे हैं' : 'Please wait a moment, simplifying this for you';

  return (
    <div
      role="status"
      className="p-8 sm:p-10 my-4 rounded-3xl bg-amber-50/70 border-2 border-amber-200 text-center flex flex-col items-center justify-center space-y-4 shadow-sm"
    >
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 animate-pulse">
          <Sparkles className="w-8 h-8 text-amber-600" />
        </div>
        <Loader2 className="w-20 h-20 text-amber-600 animate-spin absolute -top-2 -left-2 opacity-50" />
      </div>

      <div className="space-y-1">
        <p className="text-xl font-bold text-stone-900 tracking-tight">
          {message || defaultMsg}
        </p>
        <p className="text-sm font-medium text-stone-600">
          {subMessage || defaultSub}
        </p>
      </div>
    </div>
  );
};
