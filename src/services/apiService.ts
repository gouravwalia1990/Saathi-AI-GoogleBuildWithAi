import {
  DocumentAnalysisResult,
  SafetyAnalysisResult,
  DetectedIntent,
  Language,
} from '../types';
import {
  getDocumentAnalyzer,
  getSafetyAnalyzer,
  getIntentDetector,
  clearAICache,
  DocumentAnalysisInput,
  SafetyAnalysisInput,
  IntentDetectionInput,
} from './aiProvider';

export { clearAICache };

export function isTestEnvironment(): boolean {
  try {
    return (
      typeof process !== 'undefined' &&
      (process.env?.NODE_ENV === 'test' || Boolean(process.env?.VITEST))
    );
  } catch {
    return false;
  }
}

// In production, isDemoMode is ALWAYS false. Test providers are strictly restricted to automated test suites.
export function isDemoModeActive(): boolean {
  return false;
}

function resolveSessionScope(isDemo: boolean, customScope?: string): string {
  if (customScope) return customScope;
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('saathi_active_session_id');
    if (stored) return stored;
  }
  return 'visitor';
}

export async function analyzeDocument(params: DocumentAnalysisInput & {
  isDemoMode?: boolean;
  useTestProvider?: boolean;
}): Promise<DocumentAnalysisResult> {
  const useTest = isTestEnvironment() && params.useTestProvider !== false;
  const sessionScope = resolveSessionScope(useTest, params.sessionScope);
  const analyzer = getDocumentAnalyzer(useTest);
  return analyzer.analyze({ ...params, sessionScope });
}

export async function analyzeSafety(params: SafetyAnalysisInput & {
  isDemoMode?: boolean;
  useTestProvider?: boolean;
}): Promise<SafetyAnalysisResult> {
  const useTest = isTestEnvironment() && params.useTestProvider !== false;
  const sessionScope = resolveSessionScope(useTest, params.sessionScope);
  const analyzer = getSafetyAnalyzer(useTest);
  return analyzer.analyze({ ...params, sessionScope });
}

export async function detectIntent(params: IntentDetectionInput & {
  isDemoMode?: boolean;
  useTestProvider?: boolean;
}): Promise<DetectedIntent> {
  const useTest = isTestEnvironment() && params.useTestProvider !== false;
  const sessionScope = resolveSessionScope(useTest, params.sessionScope);
  const detector = getIntentDetector(useTest);
  return detector.detect({ ...params, sessionScope });
}
