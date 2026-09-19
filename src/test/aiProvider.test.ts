import { describe, it, expect } from 'vitest';
import {
  getDocumentAnalyzer,
  getSafetyAnalyzer,
  getIntentDetector,
  getSystemDiagnostics,
  TestDocumentAnalyzer,
  TestSafetyAnalyzer,
  TestIntentDetector,
} from '../services/aiProvider';

describe('Deterministic AI Provider & Scenario Fixtures Suite', () => {
  describe('Factory Instantiation', () => {
    it('returns Test Providers when isDemoMode is true', () => {
      const docAnalyzer = getDocumentAnalyzer(true);
      const safetyAnalyzer = getSafetyAnalyzer(true);
      const intentDetector = getIntentDetector(true);

      expect(docAnalyzer).toBeInstanceOf(TestDocumentAnalyzer);
      expect(safetyAnalyzer).toBeInstanceOf(TestSafetyAnalyzer);
      expect(intentDetector).toBeInstanceOf(TestIntentDetector);
    });
  });

  describe('Scenario A: Electricity Bill Deterministic Fixture', () => {
    it('returns structured electricity bill data with amount 1842 and suggested reminder', async () => {
      const analyzer = new TestDocumentAnalyzer();
      const result = await analyzer.analyze({
        text: 'Electricity Bill Notice: Amount Due Rs 1,842 due on 24 Sep 2026',
        language: 'en',
      });

      expect(result.documentType).toContain('Electricity Bill');
      expect(result.amount).toBe(1842);
      expect(result.currency).toBe('₹');
      expect(result.urgency).toBe('MEDIUM');
      expect(result.suggestedReminder).toBeDefined();
      expect(result.suggestedReminder.recommended).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });
  });

  describe('Scenario B: Prize Scam Deterministic Fixture', () => {
    it('identifies HIGH risk lottery scam and recommends family alert', async () => {
      const analyzer = new TestSafetyAnalyzer();
      const result = await analyzer.analyze({
        text: 'Congratulations! You won Rs 25,00,000 from KBC Lottery. Click link to claim now!',
        language: 'en',
      });

      expect(result.riskLevel).toBe('HIGH');
      expect(result.familyNotificationRecommended).toBe(true);
      expect(result.indicators.length).toBeGreaterThan(0);
      expect(result.thingsToAvoid.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });
  });

  describe('Scenario C: Doctor Appointment Intent Detection', () => {
    it('extracts doctor appointment intent and structured entities', async () => {
      const detector = new TestIntentDetector();
      const result = await detector.detect({
        query: 'kal subah 11 baje doctor appointment yaad dilana',
        language: 'hi',
      });

      expect(result.intent).toBe('CREATE_APPOINTMENT');
      expect(result.entities.title).toBeDefined();
      expect(result.entities.time).toBe('11:00 AM');
      expect(result.conversationalReply).toContain('11:00');
    });
  });

  describe('System Diagnostics Reporting', () => {
    it('reports accurate diagnostic status for DEMO and REAL modes', () => {
      const demoDiag = getSystemDiagnostics(true);
      expect(demoDiag.mode).toBe('DEMO');
      expect(demoDiag.aiProvider).toBe('Deterministic Test Provider');
      expect(demoDiag.ui).toBe('OK');
      expect(demoDiag.persistence).toBe('OK (localStorage Sync)');

      const realDiag = getSystemDiagnostics(false);
      expect(realDiag.mode).toBe('REAL');
      expect(realDiag.aiProvider).toBe('Gemini 2.5 Flash');
    });
  });
});
