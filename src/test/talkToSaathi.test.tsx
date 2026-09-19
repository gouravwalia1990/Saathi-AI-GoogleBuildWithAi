import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppProvider, useApp } from '../context/AppContext';
import { TalkToSaathiModal } from '../components/TalkToSaathiModal';
import { TestIntentDetector } from '../services/aiProvider';

// Mock speech service
vi.mock('../services/speechService', () => ({
  startSpeechRecognition: vi.fn(),
  isSpeechRecognitionSupported: vi.fn(() => false),
  speakText: vi.fn(),
  stopSpeaking: vi.fn(),
}));

describe('SAATHI AI — Intent Classification & Talk to SAATHI Suite (Requirement 16)', () => {
  const detector = new TestIntentDetector();

  it('Test A — Appointment: correctly detects appointment, requiresConfirmation, and time 11:00', async () => {
    const input = 'Mujhe kal doctor ke paas jaana hai at 11 AM.';
    const result = await detector.detect({ query: input, language: 'en' });

    expect(result.intent).toBe('CREATE_APPOINTMENT');
    expect(result.requiresConfirmation).toBe(true);
    expect(result.time).toBe('11:00');
    expect(result.title?.toLowerCase()).toContain('doctor');
  });

  it('Test B — Reminder: correctly detects reminder, requiresConfirmation, and bill title', async () => {
    const input = 'Please remind me to pay my electricity bill tomorrow.';
    const result = await detector.detect({ query: input, language: 'en' });

    expect(result.intent).toBe('CREATE_REMINDER');
    expect(result.requiresConfirmation).toBe(true);
    const titleLower = (result.title || '').toLowerCase();
    expect(titleLower.includes('bill') || titleLower.includes('electricity')).toBe(true);
  });

  it('Test C — Safety: detects safety check with requiresConfirmation === false', async () => {
    const input = 'Is this message safe?';
    const result = await detector.detect({ query: input, language: 'en' });

    expect(result.intent).toBe('CHECK_SAFETY');
    expect(result.requiresConfirmation).toBe(false);
  });

  it('Test D — Generic Help: detects general help with requiresConfirmation === false', async () => {
    const input = 'What can you help me with?';
    const result = await detector.detect({ query: input, language: 'en' });

    expect(result.intent).toBe('GENERAL_HELP');
    expect(result.requiresConfirmation).toBe(false);
  });
});

// Helper component that opens modal automatically for testing
const TestModalWrapper: React.FC = () => {
  const { setIsTalkModalOpen } = useApp();

  React.useEffect(() => {
    setIsTalkModalOpen(true);
  }, [setIsTalkModalOpen]);

  return <TalkToSaathiModal />;
};

describe('SAATHI AI — Talk to SAATHI Modal End-to-End Workflow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders initial welcoming guidance when conversation has not started', async () => {
    render(
      <AppProvider>
        <TestModalWrapper />
      </AppProvider>
    );

    const greeting = await screen.findByText(/I am here to help. Would you like me to explain a document/i);
    expect(greeting).toBeTruthy();

    expect(screen.getByTestId('talk-input')).toBeTruthy();
    expect(screen.getByTestId('talk-send')).toBeTruthy();
  });

  it('handles appointment flow: input -> response -> confirmation card -> confirm -> saved', async () => {
    render(
      <AppProvider>
        <TestModalWrapper />
      </AppProvider>
    );

    const input = screen.getByTestId('talk-input');
    const sendBtn = screen.getByTestId('talk-send');

    fireEvent.change(input, {
      target: { value: 'Mujhe kal doctor ke paas jaana hai at 11 AM.' },
    });
    fireEvent.click(sendBtn);

    // Should find response bubble with testid
    const responseEl = await screen.findByTestId('saathi-response');
    expect(responseEl).toBeTruthy();

    // Intent result tag
    const intentResult = await screen.findByTestId('intent-result');
    expect(intentResult).toBeTruthy();

    // Confirmation dialog card
    const confirmDialog = await screen.findByTestId('confirmation-dialog');
    expect(confirmDialog).toBeTruthy();

    // Confirm button
    const confirmBtn = screen.getByTestId('confirm-action');
    expect(confirmBtn).toBeTruthy();

    // Click confirm
    fireEvent.click(confirmBtn);

    // Check saved state
    await waitFor(() => {
      expect(screen.getByText(/Saved successfully/i)).toBeTruthy();
    });
  });

  it('allows user to cancel an appointment from confirmation card', async () => {
    render(
      <AppProvider>
        <TestModalWrapper />
      </AppProvider>
    );

    const input = screen.getByTestId('talk-input');
    const sendBtn = screen.getByTestId('talk-send');

    fireEvent.change(input, {
      target: { value: 'Mujhe kal doctor ke paas jaana hai at 11 AM.' },
    });
    fireEvent.click(sendBtn);

    await screen.findByTestId('confirmation-dialog');

    const cancelBtn = screen.getByTestId('cancel-action');
    expect(cancelBtn).toBeTruthy();

    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.getByText(/Cancelled/i)).toBeTruthy();
    });
  });
});
