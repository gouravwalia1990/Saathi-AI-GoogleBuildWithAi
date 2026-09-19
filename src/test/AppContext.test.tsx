import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AppProvider, useApp } from '../context/AppContext';

describe('AppContext & State Management Test Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AppProvider>{children}</AppProvider>
  );

  it('initializes with default senior settings and demo reminders', () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    expect(result.current.settings.userName).toBe('Mrs. Sharma');
    expect(result.current.settings.language).toBe('en');
    expect(result.current.settings.textSize).toBe('large');
    expect(result.current.reminders.length).toBeGreaterThan(0);
    expect(result.current.safetyChecks.length).toBeGreaterThan(0);
  });

  it('adds a new reminder and records it in state', () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    act(() => {
      result.current.addReminder({
        userId: 'user-sharma',
        title: 'Water Bill Payment',
        date: '2026-09-28',
        time: '10:00 AM',
        amount: 450,
        currency: '₹',
        category: 'Bills',
        status: 'PENDING',
        source: 'DOCUMENT_ANALYSIS',
      });
    });

    const added = result.current.reminders.find((r) => r.title === 'Water Bill Payment');
    expect(added).toBeDefined();
    expect(added?.amount).toBe(450);
    expect(added?.status).toBe('PENDING');
  });

  it('toggles reminder status between PENDING and COMPLETED', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const firstRem = result.current.reminders[0];
    const initialStatus = firstRem.status;

    act(() => {
      result.current.toggleReminderStatus(firstRem.id);
    });

    const updated = result.current.reminders.find((r) => r.id === firstRem.id);
    expect(updated?.status).not.toBe(initialStatus);
  });

  it('deletes a reminder from state', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const target = result.current.reminders[0];

    act(() => {
      result.current.deleteReminder(target.id);
    });

    const found = result.current.reminders.find((r) => r.id === target.id);
    expect(found).toBeUndefined();
  });

  it('updates controlled personal settings including reminder timing preference', () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    act(() => {
      result.current.updateSettings({
        language: 'hi',
        textSize: 'xlarge',
        reminderPreference: '2_days_before',
        highContrast: true,
      });
    });

    expect(result.current.settings.language).toBe('hi');
    expect(result.current.settings.textSize).toBe('xlarge');
    expect(result.current.settings.reminderPreference).toBe('2_days_before');
    expect(result.current.settings.highContrast).toBe(true);
  });

  it('dispatches simulated family notifications and logs event', () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    act(() => {
      result.current.notifyFamily({
        message: 'Suspicious lottery message detected demanding bank OTP',
        riskLevel: 'HIGH',
      });
    });

    expect(result.current.familyNotifications.length).toBeGreaterThan(0);
    expect(result.current.familyNotifications[0].riskLevel).toBe('HIGH');
    expect(result.current.familyNotifications[0].status).toBe('SENT_SIMULATED');
  });

  it('records safety checks in Digital Safety Center history', () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    act(() => {
      result.current.addSafetyCheckRecord({
        snippet: 'Electricity disconnection threat SMS',
        riskLevel: 'HIGH',
        summary: 'Urgent threat designed to force payment',
        confidence: 0.94,
      });
    });

    const found = result.current.safetyChecks.find((c) =>
      c.snippet.includes('disconnection threat')
    );
    expect(found).toBeDefined();
    expect(found?.riskLevel).toBe('HIGH');
  });

  it('resets demo data cleanly back to initial state', () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    act(() => {
      result.current.deleteReminder(result.current.reminders[0].id);
      result.current.updateSettings({ textSize: 'normal' });
    });

    act(() => {
      result.current.resetDemoData();
    });

    expect(result.current.settings.textSize).toBe('large');
  });
});
