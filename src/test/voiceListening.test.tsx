import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppProvider, useApp } from '../context/AppContext';
import { TalkToSaathiModal } from '../components/TalkToSaathiModal';
import { mergeTranscriptSegments } from '../services/speechService';
import * as speechService from '../services/speechService';
import { TestIntentDetector } from '../services/aiProvider';

// Helper component that opens modal automatically for testing
const TestVoiceModalWrapper: React.FC = () => {
  const { setIsTalkModalOpen } = useApp();

  React.useEffect(() => {
    setIsTalkModalOpen(true);
  }, [setIsTalkModalOpen]);

  return <TalkToSaathiModal />;
};

describe('SAATHI AI — Speech Transcript Segment Merging & Anti-Duplication', () => {
  it('merges new segment without duplicate phrases (Requirement 6)', () => {
    const existing = 'Mujhe kal doctor ke paas';
    const newSegment = 'doctor ke paas jaana hai';
    const merged = mergeTranscriptSegments(existing, newSegment);

    expect(merged).toBe('Mujhe kal doctor ke paas jaana hai');
  });

  it('merges natural pause segments cleanly', () => {
    const part1 = 'Mujhe kal doctor ke paas jaana hai';
    const part2 = 'at 11 AM';
    const part3 = 'aur please mujhe ek reminder bhi bana dena';

    const step1 = mergeTranscriptSegments(part1, part2);
    expect(step1).toBe('Mujhe kal doctor ke paas jaana hai at 11 AM');

    const step2 = mergeTranscriptSegments(step1, part3);
    expect(step2).toBe(
      'Mujhe kal doctor ke paas jaana hai at 11 AM aur please mujhe ek reminder bhi bana dena'
    );
  });

  it('handles empty segments safely', () => {
    expect(mergeTranscriptSegments('', 'test')).toBe('test');
    expect(mergeTranscriptSegments('test', '')).toBe('test');
  });
});

describe('SAATHI AI — Voice Input / Speech Listening Experience Tests (Requirement 17)', () => {
  const detector = new TestIntentDetector();

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('Test 1 — Long sentence: Captures complete transcript without early submission, and intent receives complete text', async () => {
    const longSentence =
      'Mujhe kal doctor ke paas jaana hai at 11 AM aur please mujhe reminder bhi bana dena.';

    let capturedOptions: any = null;
    vi.spyOn(speechService, 'isSpeechRecognitionSupported').mockReturnValue(true);
    vi.spyOn(speechService, 'startSpeechRecognition').mockImplementation((options: any) => {
      capturedOptions = options;
      return {
        stop: vi.fn(() => {
          options.onEnd?.(longSentence, 'USER_STOPPED');
        }),
        abort: vi.fn(),
        getFinalTranscript: () => longSentence,
      };
    });

    render(
      <AppProvider>
        <TestVoiceModalWrapper />
      </AppProvider>
    );

    // 1. User starts speaking
    const micBtn = screen.getByTestId('talk-big-mic-button');
    expect(micBtn.getAttribute('aria-label')).toBe('Start voice input');

    fireEvent.click(micBtn);

    // 2. Listening indicator appears with Stop aria-label
    expect(screen.getByTestId('listening-indicator')).toBeTruthy();
    expect(micBtn.getAttribute('aria-label')).toBe('Stop voice input');
    expect(screen.getByText(/Stop Listening/i)).toBeTruthy();

    // 3. Transcript grows progressively via callbacks
    capturedOptions.onInterim('Mujhe kal doctor...', '');
    await waitFor(() => {
      expect(screen.getByTestId('interim-transcript').textContent).toContain('Mujhe kal doctor...');
    });

    // 4. Short pauses do not submit immediately: Provide full final segment
    capturedOptions.onFinalSegment(longSentence);

    // 5. Complete transcript remains visible in final transcript area & input
    await waitFor(() => {
      expect(screen.getByTestId('final-transcript').textContent).toContain(longSentence);
    });

    // 6. User stops listening
    fireEvent.click(micBtn);

    // 7. Verify transcript remains visible in the input box for review
    const inputEl = screen.getByTestId('talk-input') as HTMLInputElement;
    expect(inputEl.value).toBe(longSentence);

    // 8. User presses Send
    const sendBtn = screen.getByTestId('talk-send');
    fireEvent.click(sendBtn);

    // 9. Verify the existing Talk to SAATHI intent pipeline processes the COMPLETE text
    const responseEl = await screen.findByTestId('saathi-response');
    expect(responseEl).toBeTruthy();

    const confirmDialog = await screen.findByTestId('confirmation-dialog');
    expect(confirmDialog).toBeTruthy();
    expect(screen.getByTestId('confirm-action')).toBeTruthy();
  });

  it('Test 2 — Natural pause: Simulates 2-second pause between chunks and verifies accumulated transcript', async () => {
    let capturedOptions: any = null;
    vi.spyOn(speechService, 'isSpeechRecognitionSupported').mockReturnValue(true);
    vi.spyOn(speechService, 'startSpeechRecognition').mockImplementation((options: any) => {
      capturedOptions = options;
      return {
        stop: vi.fn(() => {
          options.onEnd?.(
            'Mujhe kal doctor ke paas jaana hai at 11 AM.',
            'USER_STOPPED'
          );
        }),
        abort: vi.fn(),
        getFinalTranscript: () => 'Mujhe kal doctor ke paas jaana hai at 11 AM.',
      };
    });

    render(
      <AppProvider>
        <TestVoiceModalWrapper />
      </AppProvider>
    );

    const micBtn = screen.getByTestId('talk-big-mic-button');
    fireEvent.click(micBtn);

    // Chunk 1 before pause
    capturedOptions.onFinalSegment('Mujhe kal doctor ke paas jaana hai');
    await waitFor(() => {
      expect(screen.getByTestId('final-transcript').textContent).toContain(
        'Mujhe kal doctor ke paas jaana hai'
      );
    });

    // Natural pause happens — listening is STILL active (no auto submission!)
    expect(screen.queryByTestId('saathi-response')).toBeNull();

    // Chunk 2 after pause
    const fullText = 'Mujhe kal doctor ke paas jaana hai at 11 AM.';
    capturedOptions.onFinalSegment(fullText);

    await waitFor(() => {
      expect(screen.getByTestId('final-transcript').textContent).toContain(fullText);
    });

    // Input holds the merged sentence
    const inputEl = screen.getByTestId('talk-input') as HTMLInputElement;
    expect(inputEl.value).toBe(fullText);
  });

  it('Test 3 — Hindi / Hinglish: captures full sentence and classifies CREATE_REMINDER correctly', async () => {
    const query = 'Mujhe electricity bill kal pay karna hai, please reminder bana dena.';
    const result = await detector.detect({ query, language: 'en' });

    expect(result.intent).toBe('CREATE_REMINDER');
    expect(result.requiresConfirmation).toBe(true);
    const title = (result.title || '').toLowerCase();
    expect(title.includes('bill') || title.includes('electricity')).toBe(true);
  });

  it('Test 4 — Manual stop: User starts, speaks, taps Stop -> transcript remains visible and is NOT discarded', async () => {
    const spokenText = 'Doctor appointment for tomorrow at 10 AM';

    vi.spyOn(speechService, 'isSpeechRecognitionSupported').mockReturnValue(true);
    vi.spyOn(speechService, 'startSpeechRecognition').mockImplementation((options: any) => {
      return {
        stop: vi.fn(() => {
          options.onEnd?.(spokenText, 'USER_STOPPED');
        }),
        abort: vi.fn(),
        getFinalTranscript: () => spokenText,
      };
    });

    render(
      <AppProvider>
        <TestVoiceModalWrapper />
      </AppProvider>
    );

    const micBtn = screen.getByTestId('talk-big-mic-button');
    // Start
    fireEvent.click(micBtn);
    expect(screen.getByTestId('listening-indicator')).toBeTruthy();

    // Stop
    fireEvent.click(micBtn);

    // Check that listening stopped and transcript is kept in the input box for user review
    await waitFor(() => {
      const inputEl = screen.getByTestId('talk-input') as HTMLInputElement;
      expect(inputEl.value).toBe(spokenText);
    });

    // Verify confirmation prompt before sending
    expect(screen.getByTestId('voice-stopped-banner')).toBeTruthy();
  });

  it('Test 5 — Empty speech: User starts mic, says nothing, stops -> No AI request is sent', async () => {
    vi.spyOn(speechService, 'isSpeechRecognitionSupported').mockReturnValue(true);
    vi.spyOn(speechService, 'startSpeechRecognition').mockImplementation((options: any) => {
      return {
        stop: vi.fn(() => {
          options.onEnd?.('', 'USER_STOPPED');
        }),
        abort: vi.fn(),
        getFinalTranscript: () => '',
      };
    });

    render(
      <AppProvider>
        <TestVoiceModalWrapper />
      </AppProvider>
    );

    const micBtn = screen.getByTestId('talk-big-mic-button');
    // Start
    fireEvent.click(micBtn);
    expect(screen.getByTestId('listening-indicator')).toBeTruthy();

    // Stop without speaking
    fireEvent.click(micBtn);

    // Ensure no AI request was made
    expect(screen.queryByTestId('saathi-response')).toBeNull();
    expect(screen.queryByTestId('saathi-thinking')).toBeNull();
  });

  it('Test 6 — Browser unsupported: Displays graceful fallback and typed input continues working', async () => {
    vi.spyOn(speechService, 'isSpeechRecognitionSupported').mockReturnValue(false);

    render(
      <AppProvider>
        <TestVoiceModalWrapper />
      </AppProvider>
    );

    // Unsupported message is displayed
    expect(screen.getByTestId('voice-unsupported-banner')).toBeTruthy();
    expect(
      screen.getByText(/Voice input isn't available in this browser. You can type your request below./i)
    ).toBeTruthy();

    // Typed input works seamlessly
    const inputEl = screen.getByTestId('talk-input');
    const sendBtn = screen.getByTestId('talk-send');

    fireEvent.change(inputEl, {
      target: { value: 'What are my reminders today?' },
    });
    fireEvent.click(sendBtn);

    const responseEl = await screen.findByTestId('saathi-response');
    expect(responseEl).toBeTruthy();
  });
});
