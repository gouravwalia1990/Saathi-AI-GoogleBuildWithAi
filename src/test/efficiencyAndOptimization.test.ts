import { describe, it, expect, vi, beforeEach } from 'vitest';
import { optimizeImage, fastDataHash } from '../utils/imageOptimizer';
import { analyzeDocument, detectIntent, clearAICache } from '../services/apiService';
import { startSpeechRecognition, isSpeechRecognitionSupported } from '../services/speechService';

describe('Efficiency, Image Compression & Request Deduplication Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearAICache();
  });

  describe('Client-Side Image Optimizer', () => {
    it('fastDataHash generates deterministic short hash for image payloads', () => {
      const dataA = 'data:image/jpeg;base64,' + 'A'.repeat(500);
      const dataB = 'data:image/jpeg;base64,' + 'B'.repeat(500);
      const hashA1 = fastDataHash(dataA);
      const hashA2 = fastDataHash(dataA);
      const hashB = fastDataHash(dataB);

      expect(hashA1).toBe(hashA2);
      expect(hashA1).not.toBe(hashB);
      expect(hashA1.length).toBeLessThan(30);
    });

    it('optimizeImage handles lightweight data URLs safely and promptly', async () => {
      const smallBase64 = 'data:image/jpeg;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      const result = await optimizeImage(smallBase64);
      expect(result).toBeDefined();
      expect(result.dataUrl).toBeDefined();
      expect(typeof result.wasCompressed).toBe('boolean');
    });
  });

  describe('Concurrent In-Flight Request Deduplication', () => {
    it('collapses concurrent duplicate document analysis requests into a single network call', async () => {
      let resolveFetch: (val: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });

      const fetchSpy = vi.fn().mockReturnValue(fetchPromise);
      global.fetch = fetchSpy;

      const input = {
        text: 'Electricity Bill BSES amount 1842 due 24 September 2026',
        language: 'en' as const,
        sessionScope: 'test-session-dedup',
        useTestProvider: false,
      };

      // Launch two concurrent requests simultaneously before network responds
      const req1 = analyzeDocument(input);
      const req2 = analyzeDocument(input);

      // Verify that only 1 network fetch was dispatched
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // Fulfill the single network request
      resolveFetch!({
        ok: true,
        json: async () => ({
          documentType: 'Electricity Bill',
          simpleSummary: 'BSES Bill for Rs 1842',
          amount: 1842,
          currency: '₹',
          dueDate: '2026-09-24',
          urgency: 'MEDIUM',
          confidence: 0.95,
        }),
      });

      const [res1, res2] = await Promise.all([req1, req2]);
      expect(res1.amount).toBe(1842);
      expect(res2.amount).toBe(1842);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('collapses concurrent duplicate intent queries into a single call', async () => {
      let resolveFetch: (val: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });

      const fetchSpy = vi.fn().mockReturnValue(fetchPromise);
      global.fetch = fetchSpy;

      const input = {
        query: 'Remind me tomorrow at 11 am for clinic',
        language: 'en' as const,
        sessionScope: 'test-intent-dedup',
        useTestProvider: false,
      };

      const req1 = detectIntent(input);
      const req2 = detectIntent(input);

      expect(fetchSpy).toHaveBeenCalledTimes(1);

      resolveFetch!({
        ok: true,
        json: async () => ({
          intent: 'CREATE_APPOINTMENT',
          confidence: 0.95,
          conversationalReply: 'I have set a reminder for your clinic visit tomorrow at 11 AM.',
          entities: {
            title: 'Clinic visit',
            date: '2026-09-24',
            time: '11:00 AM',
            category: 'Appointments',
          },
        }),
      });

      const [res1, res2] = await Promise.all([req1, req2]);
      expect(res1.intent).toBe('CREATE_APPOINTMENT');
      expect(res2.intent).toBe('CREATE_APPOINTMENT');
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Senior Voice Listening Grace Period & Recognition', () => {
    it('provides speech recognition utilities with safe fallbacks', () => {
      expect(isSpeechRecognitionSupported).toBeDefined();
      const mockOnError = vi.fn();

      // In jsdom without webkitSpeechRecognition, it gracefully reports error callback
      const recognizer = startSpeechRecognition({
        lang: 'en',
        onError: mockOnError,
      });

      expect(recognizer).toBeNull();
      expect(mockOnError).toHaveBeenCalled();
    });
  });
});

