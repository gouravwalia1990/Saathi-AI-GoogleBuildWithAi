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

export function isDemoModeActive(): boolean {
  if (typeof window === 'undefined') return false;
  const search = window.location.search || '';
  const pathname = window.location.pathname || '';
  return (
    search.includes('mode=demo') ||
    search.includes('demo=true') ||
    pathname.startsWith('/demo') ||
    localStorage.getItem('saathi_demo_mode_active') === 'true'
  );
}

function resolveSessionScope(isDemo: boolean, customScope?: string): string {
  if (customScope) return customScope;
  if (isDemo) return 'demo';
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('saathi_active_session_id');
    if (stored) return stored;
  }
  return 'visitor';
}

export async function analyzeDocument(params: DocumentAnalysisInput & {
  isDemoMode?: boolean;
}): Promise<DocumentAnalysisResult> {
  const isDemo = params.isDemoMode !== undefined ? params.isDemoMode : isDemoModeActive();
  const sessionScope = resolveSessionScope(isDemo, params.sessionScope);
  const analyzer = getDocumentAnalyzer(isDemo);
  return analyzer.analyze({ ...params, sessionScope });
}

export async function analyzeSafety(params: SafetyAnalysisInput & {
  isDemoMode?: boolean;
}): Promise<SafetyAnalysisResult> {
  const isDemo = params.isDemoMode !== undefined ? params.isDemoMode : isDemoModeActive();
  const sessionScope = resolveSessionScope(isDemo, params.sessionScope);
  const analyzer = getSafetyAnalyzer(isDemo);
  return analyzer.analyze({ ...params, sessionScope });
}

export async function detectIntent(params: IntentDetectionInput & {
  isDemoMode?: boolean;
}): Promise<DetectedIntent> {
  const isDemo = params.isDemoMode !== undefined ? params.isDemoMode : isDemoModeActive();
  const sessionScope = resolveSessionScope(isDemo, params.sessionScope);
  const detector = getIntentDetector(isDemo);
  return detector.detect({ ...params, sessionScope });
}
