// Senior-first Speech utilities: Voice Recognition & Text-to-Speech

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function startSpeechRecognition(options: {
  lang: string;
  onResult: (transcript: string) => void;
  onError?: (error: any) => void;
  onEnd?: () => void;
}): { stop: () => void } | null {
  if (!isSpeechRecognitionSupported()) {
    options.onError?.(new Error('Speech recognition not supported in this browser.'));
    return null;
  }

  const SpeechRecognitionConstructor =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  const recognition = new SpeechRecognitionConstructor();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = options.lang === 'hi' ? 'hi-IN' : 'en-IN';

  recognition.onresult = (event: any) => {
    let transcript = '';
    for (let i = 0; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    options.onResult(transcript);
  };

  recognition.onerror = (event: any) => {
    console.warn('Speech recognition error event:', event);
    options.onError?.(event);
  };

  recognition.onend = () => {
    options.onEnd?.();
  };

  try {
    recognition.start();
  } catch (err) {
    console.warn('Failed to start speech recognition:', err);
    options.onError?.(err);
  }

  return {
    stop: () => {
      try {
        recognition.stop();
      } catch (err) {
        // ignore
      }
    },
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
