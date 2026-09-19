import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeDocument, analyzeSafety, detectIntent } from '../services/apiService';

describe('API Service, Caching & Resilience Test Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('provides safe demo fallback for document analysis when server endpoint fails', async () => {
    // Force fetch to reject to test resilience
    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline or backend timeout'));

    const res = await analyzeDocument({
      text: 'BSES Rajdhani Electricity Bill for Mrs. Sharma. Total Amount: Rs 1842. Due Date: 24 September 2026.',
      language: 'en',
    });

    expect(res).toBeDefined();
    expect(res.documentType).toBeDefined();
    expect(res.amount).toBe(1842);
    expect(res.simpleSummary).toBeDefined();
    expect(res.actionPlan).toBeDefined();
  });

  it('provides safe defensive fallback for scam safety check when server endpoint fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network unavailable'));

    const res = await analyzeSafety({
      text: 'Congratulations! You won Rs 25,00,000 from KBC Lottery. Send your bank account details and OTP.',
      language: 'en',
    });

    expect(res).toBeDefined();
    expect(res.riskLevel).toBe('HIGH');
    expect(res.indicators.length).toBeGreaterThan(0);
    expect(res.thingsToAvoid.length).toBeGreaterThan(0);
    expect(res.confidence).toBeGreaterThan(0.9);
  });

  it('provides robust intent fallback for conversational voice queries', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('AI endpoint timeout'));

    const res = await detectIntent({
      query: 'Remind me tomorrow at 11 am to visit doctor',
      language: 'en',
    });

    expect(res).toBeDefined();
    expect(res.intent).toBeDefined();
    expect(res.conversationalReply).toBeDefined();
    expect(res.entities).toBeDefined();
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
    };

    // First call fetches from API
    const firstResult = await analyzeDocument(query);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Second identical call hits memory cache
    const secondResult = await analyzeDocument(query);
    expect(fetchSpy).toHaveBeenCalledTimes(1); // Cached, no second fetch
    expect(secondResult.amount).toBe(firstResult.amount);
  });
});
