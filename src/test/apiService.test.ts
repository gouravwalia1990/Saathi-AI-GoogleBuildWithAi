import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeDocument, analyzeSafety, detectIntent, clearAICache } from '../services/apiService';

describe('API Service, Real Gemini Provider, Error Propagation & Caching Test Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearAICache();
  });

  it('propagates error when server returns 503 or fails for document analysis without mock fallback', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: 'Gemini AI service unavailable. Please try again.' }),
    });

    await expect(
      analyzeDocument({
        text: 'BSES Rajdhani Electricity Bill for Mrs. Sharma. Total Amount: Rs 1842. Due Date: 24 September 2026.',
        language: 'en',
        useTestProvider: false,
      })
    ).rejects.toThrow(/Gemini AI service unavailable|Server status 503/);
  });

  it('propagates error when server returns 500 or fails for scam safety check without mock fallback', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Safety analysis failed on backend' }),
    });

    await expect(
      analyzeSafety({
        text: 'Congratulations! You won Rs 25,00,000 from KBC Lottery. Send your bank account details and OTP.',
        language: 'en',
        useTestProvider: false,
      })
    ).rejects.toThrow(/Safety analysis failed|Server status 500/);
  });

  it('propagates error when server returns 503 or network fails for intent detection without mock fallback', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: 'AI endpoint timeout or uninitialized' }),
    });

    await expect(
      detectIntent({
        query: 'Remind me tomorrow at 11 am to visit doctor',
        language: 'en',
        useTestProvider: false,
      })
    ).rejects.toThrow(/AI endpoint timeout|Server status 503/);
  });

  it('serves cached responses on duplicate queries to maximize efficiency and reduce latency', async () => {
    const mockSuccessResponse = {
      ok: true,
      json: async () => ({
        documentType: 'Water Utility Bill',
        simpleSummary: 'Water bill due next week',
        amount: 320,
        currency: '₹',
        dueDate: '2026-09-30',
        urgency: 'LOW',
        confidence: 0.95,
      }),
    };

    const fetchSpy = vi.fn().mockResolvedValue(mockSuccessResponse);
    global.fetch = fetchSpy;

    const query = {
      text: 'Water Utility Bill due date 30 September 2026 amount 320',
      language: 'en' as const,
      useTestProvider: false,
    };

    // First call fetches from API
    const firstResult = await analyzeDocument(query);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(firstResult.amount).toBe(320);

    // Second identical call hits memory cache
    const secondResult = await analyzeDocument(query);
    expect(fetchSpy).toHaveBeenCalledTimes(1); // Cached, no second fetch
    expect(secondResult.amount).toBe(firstResult.amount);
  });
});
