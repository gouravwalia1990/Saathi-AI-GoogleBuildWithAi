// Senior-first Speech utilities: Voice Recognition & Text-to-Speech

export function isSpeechRecognitionSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
  );
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Merges two transcript segments, removing overlapping boundary words/phrases
 * to prevent duplicate speech segments (Requirement 6).
 */
export function mergeTranscriptSegments(existing: string, newSegment: string): string {
  const cleanExisting = (existing || '').trim();
  const cleanNew = (newSegment || '').trim();

  if (!cleanExisting) return cleanNew;
  if (!cleanNew) return cleanExisting;

  const existingWords = cleanExisting.split(/\s+/);
  const newWords = cleanNew.split(/\s+/);

  // Check for overlapping suffix in existing that matches prefix in newSegment
  const maxOverlap = Math.min(existingWords.length, newWords.length);
  for (let overlapLen = maxOverlap; overlapLen > 0; overlapLen--) {
    const existingSuffix = existingWords.slice(-overlapLen).map((w) => w.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ''));
    const newPrefix = newWords.slice(0, overlapLen).map((w) => w.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ''));

    const isMatch = existingSuffix.every((word, idx) => word === newPrefix[idx]);
    if (isMatch) {
      const remainingNewWords = newWords.slice(overlapLen);
      if (remainingNewWords.length === 0) {
        return cleanExisting;
      }
      return `${cleanExisting} ${remainingNewWords.join(' ')}`;
    }
  }

  return `${cleanExisting} ${cleanNew}`;
}

export type VoiceListeningState =
  | 'IDLE'
  | 'LISTENING'
  | 'TRANSCRIBING'
  | 'STOPPED'
  | 'PROCESSING'
  | 'ERROR';

export interface SpeechRecognitionOptions {
  lang: string;
  silenceGracePeriodMs?: number; // default 3500ms (Requirement 3: 2500–4000ms configurable)
  maxListeningDurationMs?: number; // default 60000ms safety ceiling
  onInterim?: (interim: string, currentFinal: string) => void;
  onFinalSegment?: (finalTranscript: string) => void;
  onResult?: (transcript: string) => void;
  onError?: (error: any) => void;
  onEnd?: (
    finalTranscript: string,
    reason: 'USER_STOPPED' | 'SILENCE_TIMEOUT' | 'MAX_DURATION' | 'ERROR' | 'SYSTEM_END'
  ) => void;
  onStatusChange?: (status: VoiceListeningState) => void;
}

export interface SpeechRecognizerHandle {
  stop: () => void;
  abort: () => void;
  getFinalTranscript: () => string;
}

export function startSpeechRecognition(
  options: SpeechRecognitionOptions
): SpeechRecognizerHandle | null {
  if (!isSpeechRecognitionSupported()) {
    options.onError?.(new Error('Speech recognition not supported in this browser.'));
    return null;
  }

  const SpeechRecognitionConstructor =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  const silenceGracePeriodMs = options.silenceGracePeriodMs ?? 6000;
  const maxListeningDurationMs = options.maxListeningDurationMs ?? 60000;

  let accumulatedFinalTranscript = '';
  let currentInterimTranscript = '';
  let isUserStopped = false;
  let hasReceivedSpeech = false;
  let silenceTimer: ReturnType<typeof setTimeout> | null = null;
  let maxDurationTimer: ReturnType<typeof setTimeout> | null = null;
  let restartCount = 0;
  const MAX_AUTO_RESTARTS = 10;

  let recognition: any = null;

  const resetSilenceTimer = () => {
    if (silenceTimer) clearTimeout(silenceTimer);
    // Silence timer only starts counting down once speech has actually been detected
    silenceTimer = setTimeout(() => {
      if (!isUserStopped) {
        isUserStopped = true;
        stopInternal('SILENCE_TIMEOUT');
      }
    }, silenceGracePeriodMs);
  };

  const stopInternal = (
    reason: 'USER_STOPPED' | 'SILENCE_TIMEOUT' | 'MAX_DURATION' | 'ERROR' | 'SYSTEM_END'
  ) => {
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      silenceTimer = null;
    }
    if (maxDurationTimer) {
      clearTimeout(maxDurationTimer);
      maxDurationTimer = null;
    }

    // Merge any trailing interim text into the final transcript
    if (currentInterimTranscript.trim()) {
      accumulatedFinalTranscript = mergeTranscriptSegments(
        accumulatedFinalTranscript,
        currentInterimTranscript.trim()
      );
      currentInterimTranscript = '';
    }

    try {
      recognition?.stop();
    } catch (err) {
      // ignore
    }

    options.onStatusChange?.('STOPPED');
    options.onEnd?.(accumulatedFinalTranscript.trim(), reason);
  };

  const createAndStartRecognition = () => {
    try {
      recognition = new SpeechRecognitionConstructor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = options.lang === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onresult = (event: any) => {
        restartCount = 0;
        hasReceivedSpeech = true;
        resetSilenceTimer();

        let sessionFinal = '';
        let sessionInterim = '';

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0]?.transcript || '';
          if (result.isFinal) {
            sessionFinal = mergeTranscriptSegments(sessionFinal, text);
          } else {
            sessionInterim += text;
          }
        }

        if (sessionFinal) {
          accumulatedFinalTranscript = mergeTranscriptSegments(
            accumulatedFinalTranscript,
            sessionFinal
          );
        }
        currentInterimTranscript = sessionInterim;

        const currentFull = accumulatedFinalTranscript
          ? currentInterimTranscript
            ? `${accumulatedFinalTranscript} ${currentInterimTranscript}`
            : accumulatedFinalTranscript
          : currentInterimTranscript;

        if (sessionInterim.trim()) {
          options.onStatusChange?.('TRANSCRIBING');
        } else if (!isUserStopped) {
          options.onStatusChange?.('LISTENING');
        }

        options.onInterim?.(currentInterimTranscript, accumulatedFinalTranscript);
        if (accumulatedFinalTranscript) {
          options.onFinalSegment?.(accumulatedFinalTranscript);
        }
        options.onResult?.(currentFull.trim());
      };

      recognition.onerror = (event: any) => {
        const errType = event?.error;
        if (errType === 'no-speech') {
          // Chrome emits 'no-speech' if the user pauses briefly. Do NOT treat this as fatal!
          return;
        }
        if (errType === 'aborted') {
          // Normal when recognition is manually stopped
          return;
        }

        console.warn('Speech recognition error event:', errType);
        options.onStatusChange?.('ERROR');
        options.onError?.(event);
      };

      recognition.onend = () => {
        if (isUserStopped) {
          return;
        }

        // Browser ended recognition prematurely (e.g. pause during continuous listening)
        // If user hasn't stopped and silence timeout hasn't fired, resume gracefully
        if (restartCount < MAX_AUTO_RESTARTS) {
          restartCount++;
          try {
            recognition.start();
            options.onStatusChange?.('LISTENING');
            return;
          } catch (err) {
            // Re-instantiate recognition if browser invalidated the previous instance
            try {
              createAndStartRecognition();
              return;
            } catch (createErr) {
              console.warn('Failed to restart speech recognition:', err, createErr);
            }
          }
        }

        // Limit reached or unrecoverable, stop cleanly
        stopInternal('SYSTEM_END');
      };

      recognition.start();
      options.onStatusChange?.('LISTENING');
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
      options.onStatusChange?.('ERROR');
      options.onError?.(err);
    }
  };

  createAndStartRecognition();

  // Safety ceiling: Maximum listening duration
  maxDurationTimer = setTimeout(() => {
    if (!isUserStopped) {
      isUserStopped = true;
      stopInternal('MAX_DURATION');
    }
  }, maxListeningDurationMs);

  return {
    stop: () => {
      if (!isUserStopped) {
        isUserStopped = true;
        stopInternal('USER_STOPPED');
      }
    },
    abort: () => {
      isUserStopped = true;
      if (silenceTimer) clearTimeout(silenceTimer);
      if (maxDurationTimer) clearTimeout(maxDurationTimer);
      try {
        recognition?.abort();
      } catch (err) {
        // ignore
      }
      options.onStatusChange?.('STOPPED');
    },
    getFinalTranscript: () => accumulatedFinalTranscript.trim(),
  };
}

export function speakText(text: string, lang: 'en' | 'hi' = 'en') {
  if (!isSpeechSynthesisSupported()) return;

  try {
    window.speechSynthesis.cancel(); // cancel previous
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.9; // Slightly slower for senior citizen clarity
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
  }
}

export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}
