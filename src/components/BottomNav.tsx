import React from 'react';
import { useApp } from '../context/AppContext';
import { Home, FileText, ShieldAlert, Bell, Settings } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, reminders, settings } = useApp();

  const pendingCount = reminders.filter((r) => r.status === 'PENDING').length;
  const isHindi = settings.language === 'hi';

  const navItems = [
    {
      id: 'home' as const,
      label: isHindi ? 'होम' : 'Home',
      icon: Home,
    },
    {
      id: 'explain' as const,
      label: isHindi ? 'समझिए' : 'Explain',
      icon: FileText,
    },
    {
      id: 'safety' as const,
      label: isHindi ? 'सुरक्षा जाँच' : 'Safety Check',
      icon: ShieldAlert,
    },
    {
      id: 'reminders' as const,
      label: isHindi ? 'रिमाइंडर' : 'Reminders',
      icon: Bell,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      id: 'settings' as const,
      label: isHindi ? 'सेटिंग्स' : 'Settings',
      icon: Settings,
    },
  ];

  return (
    <nav
      id="main-bottom-navigation"
      data-testid="bottom-nav"
      aria-label="Main Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-lg px-2 py-1.5 safe-area-pb"
    >
      <div className="max-w-xl mx-auto flex items-center justify-around gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              data-testid={`nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center min-w-[64px] py-1 px-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                isActive
                  ? 'text-amber-800 font-bold bg-amber-50'
                  : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50 font-medium'
              }`}
              style={{ minHeight: '52px' }}
            >
              <div className="relative">
                <Icon
                  className={`w-6 h-6 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.5px] text-amber-700' : 'stroke-[2px]'
                  }`}
                />
                {item.badge !== null && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 bg-amber-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] sm:text-xs mt-0.5 tracking-tight ${
                  isActive ? 'font-bold text-amber-900' : 'text-stone-600'
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0.5 w-6 h-0.5 bg-amber-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
