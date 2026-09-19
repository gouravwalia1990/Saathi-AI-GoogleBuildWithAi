import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bell,
  Calendar,
  Clock,
  CheckCircle2,
  Plus,
  Trash2,
  Volume2,
  X,
  FileText,
  UserCheck,
  Shield,
  Filter,
} from 'lucide-react';
import { speakText } from '../services/speechService';
import { Reminder, ReminderCategory } from '../types';

export const Reminders: React.FC = () => {
  const {
    reminders,
    addReminder,
    toggleReminderStatus,
    deleteReminder,
    settings,
    showToast,
  } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ReminderCategory | 'ALL'>('ALL');

  // New Reminder Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDate, setNewDate] = useState('2026-09-19');
  const [newTime, setNewTime] = useState('10:00 AM');
  const [newCategory, setNewCategory] = useState<ReminderCategory>('General');
  const [newAmount, setNewAmount] = useState('');

  const isHindi = settings.language === 'hi';

  const categories: ReminderCategory[] = [
    'Bills',
    'Appointments',
    'Documents',
    'Family',
    'General',
    'Safety',
  ];

  // Group reminders by date logic
  const filteredReminders =
    selectedCategory === 'ALL'
      ? reminders
      : reminders.filter((r) => r.category === selectedCategory);

  const pending = filteredReminders.filter((r) => r.status === 'PENDING');
  const completed = filteredReminders.filter((r) => r.status === 'COMPLETED');

  // Simple classification for demo: Today (2026-09-18), Tomorrow (2026-09-19), Upcoming (> 2026-09-19 or others)
  const todayList = pending.filter(
    (r) =>
      r.date.toLowerCase().includes('today') ||
      r.date.toLowerCase().includes('aaj') ||
      r.date === '2026-09-18'
  );

  const tomorrowList = pending.filter(
    (r) =>
      r.date.toLowerCase().includes('tomorrow') ||
      r.date.toLowerCase().includes('kal') ||
      r.date === '2026-09-19'
  );

  const upcomingList = pending.filter(
    (r) => !todayList.includes(r) && !tomorrowList.includes(r)
  );

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addReminder({
      userId: 'user-sharma',
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      date: newDate || '2026-09-19',
      time: newTime || '10:00 AM',
      amount: newAmount ? parseFloat(newAmount) : null,
      currency: newAmount ? '₹' : null,
      category: newCategory,
      status: 'PENDING',
      source: 'MANUAL',
    });

    setIsAddModalOpen(false);
    setNewTitle('');
    setNewDescription('');
    setNewAmount('');
  };

  const handleReadAloudReminders = () => {
    if (pending.length === 0) {
      speakText(
        isHindi
          ? 'आपके पास अभी कोई पेंडिंग रिमाइंडर नहीं है।'
          : 'You do not have any pending reminders at the moment.',
        isHindi ? 'hi' : 'en'
      );
      return;
    }

    const itemsSummary = pending
      .map((r) => `${r.title}, ${r.date} ${r.time ? `at ${r.time}` : ''}`)
      .join('. ');

    const speech = isHindi
      ? `आपके पास कुल ${pending.length} पेंडिंग रिमाइंडर हैं। ${itemsSummary}`
      : `You have ${pending.length} pending reminders: ${itemsSummary}`;

    speakText(speech, isHindi ? 'hi' : 'en');
  };

  const getCategoryBadgeClass = (category: ReminderCategory) => {
    switch (category) {
      case 'Bills':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Appointments':
        return 'bg-sky-100 text-sky-900 border-sky-300';
      case 'Documents':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'Family':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'Safety':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      default:
        return 'bg-stone-100 text-stone-900 border-stone-300';
    }
  };

  const renderReminderItem = (item: Reminder) => (
    <div
      key={item.id}
      data-testid="reminder-card"
      className={`p-5 rounded-3xl border-2 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
        item.status === 'COMPLETED'
          ? 'bg-stone-100/70 border-stone-300 opacity-60'
          : 'bg-white border-stone-200 hover:border-amber-400'
      }`}
    >
      <div className="flex items-start gap-3.5">
        <button
          onClick={() => toggleReminderStatus(item.id)}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all mt-0.5 shrink-0 ${
            item.status === 'COMPLETED'
              ? 'bg-emerald-600 text-white'
              : 'border-2 border-stone-300 hover:border-emerald-600 text-transparent hover:text-emerald-600'
          }`}
          title={item.status === 'COMPLETED' ? 'Mark Pending' : 'Mark Completed'}
        >
          <CheckCircle2 className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-lg font-extrabold tracking-tight ${
                item.status === 'COMPLETED'
                  ? 'line-through text-stone-500'
                  : 'text-stone-900'
              }`}
            >
              {item.title}
            </span>
            <span
              className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(
                item.category
              )}`}
            >
              {item.category}
            </span>
            {item.amount && (
              <span className="text-xs font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                {item.currency || '₹'}
                {item.amount.toLocaleString()}
              </span>
            )}
          </div>

          {item.description && (
            <p className="text-sm font-medium text-stone-600">
              {item.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-stone-500 pt-0.5">
            <span className="flex items-center gap-1 font-bold text-stone-700">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              {item.date}
            </span>
            {item.time && (
              <span className="flex items-center gap-1 font-bold text-stone-700">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                {item.time}
              </span>
            )}
            <span className="text-stone-400">• Source: {item.source}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center">
        <button
          onClick={() => deleteReminder(item.id)}
          className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          title="Delete Reminder"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-emerald-50 border-2 border-emerald-200 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-xs shrink-0">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
              {isHindi ? 'मेरे सभी रिमाइंडर' : 'My Reminders'}
            </h2>
            <p className="text-sm font-semibold text-stone-600">
              {isHindi
                ? `${pending.length} कार्य बाकी हैं • समय पर याद दिलाना हमारा कर्तव्य है`
                : `${pending.length} pending tasks • Organized by Today, Tomorrow & Upcoming`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReadAloudReminders}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-stone-100 border border-emerald-300 text-emerald-900 font-bold text-xs sm:text-sm shadow-2xs transition-colors"
          >
            <Volume2 className="w-4 h-4 text-emerald-700" />
            <span>{isHindi ? 'बोलकर सुनें' : 'Listen Aloud'}</span>
          </button>

          <button
            id="reminders-add-new-btn"
            data-testid="add-reminder-btn"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{isHindi ? 'नया रिमाइंडर' : 'Add Reminder'}</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
            selectedCategory === 'ALL'
              ? 'bg-stone-900 text-white'
              : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
          }`}
        >
          {isHindi ? 'सभी' : 'All'} ({reminders.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-amber-700 text-white'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Section 1: TODAY */}
      {todayList.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <h3 className="text-lg font-extrabold uppercase tracking-wider text-stone-900">
              {isHindi ? 'आज के कार्य' : 'TODAY'}
            </h3>
            <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-stone-200 text-stone-700">
              {todayList.length}
            </span>
          </div>
          <div className="space-y-3">{todayList.map(renderReminderItem)}</div>
        </div>
      )}

      {/* Section 2: TOMORROW */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
          <h3 className="text-lg font-extrabold uppercase tracking-wider text-stone-900">
            {isHindi ? 'कल के कार्य' : 'TOMORROW'}
          </h3>
          <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-stone-200 text-stone-700">
            {tomorrowList.length}
          </span>
        </div>
        {tomorrowList.length === 0 ? (
          <div className="p-5 rounded-2xl bg-white border border-stone-200 text-stone-500 font-medium text-sm text-center">
            {isHindi ? 'कल के लिए कोई कार्य नहीं है।' : 'No tasks scheduled for tomorrow.'}
          </div>
        ) : (
          <div className="space-y-3">{tomorrowList.map(renderReminderItem)}</div>
        )}
      </div>

      {/* Section 3: UPCOMING */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
          <h3 className="text-lg font-extrabold uppercase tracking-wider text-stone-900">
            {isHindi ? 'आगे आने वाले कार्य' : 'UPCOMING'}
          </h3>
          <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-stone-200 text-stone-700">
            {upcomingList.length}
          </span>
        </div>
        {upcomingList.length === 0 ? (
          <div className="p-5 rounded-2xl bg-white border border-stone-200 text-stone-500 font-medium text-sm text-center">
            {isHindi ? 'आगे के लिए कोई कार्य नहीं है।' : 'No other upcoming tasks.'}
          </div>
        ) : (
          <div className="space-y-3">{upcomingList.map(renderReminderItem)}</div>
        )}
      </div>

      {/* Section 4: COMPLETED */}
      {completed.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-stone-400" />
            <h3 className="text-lg font-extrabold uppercase tracking-wider text-stone-500">
              {isHindi ? 'पूर्ण किए गए कार्य' : 'COMPLETED'}
            </h3>
            <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-stone-200 text-stone-600">
              {completed.length}
            </span>
          </div>
          <div className="space-y-3">{completed.map(renderReminderItem)}</div>
        </div>
      )}

      {/* Manual Add Reminder Modal */}
      {isAddModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border-2 border-emerald-300 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <h3 className="text-xl font-black text-stone-900">
                {isHindi ? 'नया रिमाइंडर जोड़ें' : 'Add New Reminder'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReminder} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">
                  {isHindi ? 'कार्य का नाम / शीर्षक *' : 'Reminder Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={
                    isHindi
                      ? 'जैसे: डॉक्टर का अप्वाइंटमेंट, दवा, बिल...'
                      : 'e.g. Doctor Visit, Heart Medication, Water Bill'
                  }
                  className="w-full p-3.5 rounded-xl border-2 border-stone-300 focus:border-emerald-600 font-semibold text-stone-900 text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">
                  {isHindi ? 'विवरण (वैकल्पिक)' : 'Description (Optional)'}
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder={
                    isHindi
                      ? 'अतिरिक्त विवरण या डॉक्टर का नाम...'
                      : 'Additional instructions, doctor clinic address, etc.'
                  }
                  className="w-full p-3 rounded-xl border-2 border-stone-300 focus:border-emerald-600 font-medium text-stone-900 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">
                    {isHindi ? 'तारीख' : 'Date'}
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full p-3 rounded-xl border-2 border-stone-300 focus:border-emerald-600 font-semibold text-stone-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">
                    {isHindi ? 'समय' : 'Time'}
                  </label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    placeholder="11:00 AM"
                    className="w-full p-3 rounded-xl border-2 border-stone-300 focus:border-emerald-600 font-semibold text-stone-900 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">
                    {isHindi ? 'श्रेणी' : 'Category'}
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ReminderCategory)}
                    className="w-full p-3 rounded-xl border-2 border-stone-300 focus:border-emerald-600 font-bold text-stone-800 text-sm"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">
                    {isHindi ? 'राशि (यदि कोई हो)' : 'Amount (₹)'}
                  </label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="e.g. 1842"
                    className="w-full p-3 rounded-xl border-2 border-stone-300 focus:border-emerald-600 font-semibold text-stone-900 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-extrabold text-base shadow-sm transition-all"
                >
                  {isHindi ? 'रिमाइंडर जोड़ें' : 'Save Reminder'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="py-3.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm"
                >
                  {isHindi ? 'रद्द करें' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
