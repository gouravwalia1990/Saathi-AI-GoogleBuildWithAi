import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AppProvider, useApp } from '../context/AppContext';

describe('AppContext & User Isolation Test Suite (P0)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AppProvider>{children}</AppProvider>
  );

  it('initializes anonymous visitor with clean isolated state and pending onboarding', () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    // Must NOT default to hardcoded Mr. Sharma in normal visitor mode
    expect(result.current.isDemoMode).toBe(false);
    expect(result.current.userProfile.displayName).toBe('');
    expect(result.current.userProfile.isOnboarded).toBe(false);
    expect(result.current.reminders.length).toBe(0); // Clean slate for visitor
    expect(result.current.isOnboardingOpen).toBe(true);
  });

  it('completes onboarding and updates user profile and settings in isolated namespace', () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    act(() => {
      result.current.completeOnboarding({
        displayName: 'Priya Mehra',
        trustedContactName: 'Aman Mehra',
        trustedContactRelation: 'Son',
        trustedContactPhone: '+91 98765 00000',
      });
    });

    expect(result.current.userProfile.displayName).toBe('Priya Mehra');
    expect(result.current.userProfile.trustedContactName).toBe('Aman Mehra');
    expect(result.current.userProfile.isOnboarded).toBe(true);
    expect(result.current.settings.userName).toBe('Priya Mehra');
    expect(result.current.settings.trustedContactName).toBe('Aman Mehra');
  });

  it('adds a reminder tagged with active user ID', () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    act(() => {
      result.current.addReminder({
        userId: result.current.userProfile.userId,
        title: 'Electricity Bill Payment',
        date: '2026-09-28',
        time: '10:00 AM',
        amount: 850,
        currency: '₹',
        category: 'Bills',
        status: 'PENDING',
        source: 'MANUAL',
      });
    });

    expect(result.current.reminders.length).toBe(1);
    expect(result.current.reminders[0].title).toBe('Electricity Bill Payment');
    expect(result.current.reminders[0].userId).toBe(result.current.userProfile.userId);
  });

  it('isolates data between two distinct visitor sessions (Session A vs Session B)', () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    // Step 1: User A onboards and adds a private reminder
    act(() => {
      result.current.completeOnboarding({
        displayName: 'User A (Sunita)',
        trustedContactName: 'Anand',
        trustedContactRelation: 'Son',
      });
      result.current.addReminder({
        userId: result.current.userProfile.userId,
        title: "Sunita's Blood Test",
        date: '2026-09-22',
        time: '08:00 AM',
        category: 'Appointments',
        status: 'PENDING',
        source: 'MANUAL',
      });
    });

    const sessionA_Id = result.current.sessionId;
    expect(result.current.userProfile.displayName).toBe('User A (Sunita)');
    expect(result.current.reminders.some((r) => r.title === "Sunita's Blood Test")).toBe(true);

    // Step 2: Switch to Session B (simulating another user/browser)
    const sessionB_Id = 'session_test_user_b_' + Date.now();
    act(() => {
      result.current.switchSession(sessionB_Id);
    });

    // Session B must NOT see User A's data
    expect(result.current.sessionId).toBe(sessionB_Id);
    expect(result.current.userProfile.displayName).toBe('');
    expect(result.current.userProfile.isOnboarded).toBe(false);
    expect(result.current.reminders.length).toBe(0); // Zero reminders from User A!

    // Step 3: Session B onboards with their own info
    act(() => {
      result.current.completeOnboarding({
        displayName: 'User B (Vikram)',
        trustedContactName: 'Pooja',
        trustedContactRelation: 'Daughter',
      });
      result.current.addReminder({
        userId: result.current.userProfile.userId,
        title: "Vikram's Eye Clinic Visit",
        date: '2026-09-25',
        time: '11:00 AM',
        category: 'Appointments',
        status: 'PENDING',
        source: 'MANUAL',
      });
    });

    expect(result.current.userProfile.displayName).toBe('User B (Vikram)');
    expect(result.current.reminders.some((r) => r.title === "Vikram's Eye Clinic Visit")).toBe(true);
    expect(result.current.reminders.some((r) => r.title === "Sunita's Blood Test")).toBe(false);

    // Step 4: Switch back to Session A
    act(() => {
      result.current.switchSession(sessionA_Id);
    });

    // Session A still has their own data, and none of Session B's
    expect(result.current.userProfile.displayName).toBe('User A (Sunita)');
    expect(result.current.userProfile.trustedContactName).toBe('Anand');
    expect(result.current.reminders.some((r) => r.title === "Sunita's Blood Test")).toBe(true);
    expect(result.current.reminders.some((r) => r.title === "Vikram's Eye Clinic Visit")).toBe(false);
  });

  it('isolates Demo Mode data (Mr. Sharma fixture) from normal visitor mode', () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    // Initial visitor mode
    expect(result.current.isDemoMode).toBe(false);
    expect(result.current.userProfile.displayName).toBe('');

    // Toggle to Demo Mode
    act(() => {
      result.current.toggleDemoMode();
    });

    // In demo mode, deterministic Mr. Sharma fixture is loaded
    expect(result.current.isDemoMode).toBe(true);
    expect(result.current.userProfile.displayName).toBe('Mr. Sharma');
    expect(result.current.userProfile.trustedContactName).toBe('Rahul Sharma');
    expect(result.current.reminders.length).toBeGreaterThan(0);

    // Toggle back to Visitor Mode
    act(() => {
      result.current.toggleDemoMode();
    });

    // Back in visitor mode, Mr. Sharma data is NOT mixed in
    expect(result.current.isDemoMode).toBe(false);
    expect(result.current.userProfile.displayName).toBe('');
    expect(result.current.reminders.length).toBe(0);
  });

  it('resets session data cleanly without affecting demo mode or other storage', () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    act(() => {
      result.current.completeOnboarding({
        displayName: 'Test User',
        trustedContactName: 'Test Contact',
      });
      result.current.addReminder({
        userId: result.current.userProfile.userId,
        title: 'Temporary Reminder',
        date: '2026-09-30',
        time: '12:00 PM',
        category: 'General',
        status: 'PENDING',
        source: 'MANUAL',
      });
    });

    expect(result.current.reminders.length).toBe(1);

    // Reset session data
    act(() => {
      result.current.resetSessionData();
    });

    expect(result.current.userProfile.displayName).toBe('');
    expect(result.current.userProfile.isOnboarded).toBe(false);
    expect(result.current.reminders.length).toBe(0);
    expect(result.current.isOnboardingOpen).toBe(true);
  });
});
