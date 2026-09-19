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
  DocumentAnalysisInput,
  SafetyAnalysisInput,
  IntentDetectionInput,
} from './aiProvider';

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

export async function analyzeDocument(params: DocumentAnalysisInput & {
  isDemoMode?: boolean;
}): Promise<DocumentAnalysisResult> {
  const isDemo = params.isDemoMode !== undefined ? params.isDemoMode : isDemoModeActive();
  const analyzer = getDocumentAnalyzer(isDemo);
  return analyzer.analyze(params);
}

export async function analyzeSafety(params: SafetyAnalysisInput & {
  isDemoMode?: boolean;
}): Promise<SafetyAnalysisResult> {
  const isDemo = params.isDemoMode !== undefined ? params.isDemoMode : isDemoModeActive();
  const analyzer = getSafetyAnalyzer(isDemo);
  return analyzer.analyze(params);
}

export async function detectIntent(params: IntentDetectionInput & {
  isDemoMode?: boolean;
}): Promise<DetectedIntent> {
  const isDemo = params.isDemoMode !== undefined ? params.isDemoMode : isDemoModeActive();
  const detector = getIntentDetector(isDemo);
  return detector.detect(params);
}
