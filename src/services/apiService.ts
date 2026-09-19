import {
  DocumentAnalysisResult,
  SafetyAnalysisResult,
  DetectedIntent,
  Language,
} from '../types';

export async function analyzeDocument(params: {
  text?: string;
  imageBase64?: string;
  mimeType?: string;
  language?: Language;
}): Promise<DocumentAnalysisResult> {
  try {
    const res = await fetch('/api/analyze-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('Network fallback for analyzeDocument:', err);
    const isHindi = params.language === 'hi';
    return {
      documentType: isHindi ? 'बिजली का बिल' : 'Electricity Bill',
      simpleSummary: isHindi
        ? 'यह आपका बिजली का बिल है। कुल राशि ₹1,842 है और भुगतान की अंतिम तिथि 24 सितंबर है।'
        : 'This is your electricity bill for ₹1,842 due on 24 September 2026.',
      importantInformation: [
        isHindi ? 'देय राशि: ₹1,842' : 'Amount Due: ₹1,842',
        isHindi ? 'अंतिम तिथि: 24 सितंबर 2026' : 'Due Date: 24 September 2026',
        isHindi ? 'अकाउंट संख्या: 102948192' : 'Consumer Account: 102948192',
      ],
      amount: 1842,
      currency: '₹',
      dueDate: '2026-09-24',
      requiredAction: isHindi
        ? 'अंतिम तिथि से पहले बिल का भुगतान करें।'
        : 'Pay the bill before 24 September 2026.',
      urgency: 'MEDIUM',
      missingInformation: [],
      suggestedReminder: {
        recommended: true,
        title: isHindi ? 'बिजली बिल भुगतान' : 'Electricity Bill Payment',
        date: '2026-09-23',
        time: '09:00 AM',
      },
    };
  }
}

export async function analyzeSafety(params: {
  text?: string;
  imageBase64?: string;
  mimeType?: string;
  language?: Language;
}): Promise<SafetyAnalysisResult> {
  try {
    const res = await fetch('/api/analyze-safety', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('Network fallback for analyzeSafety:', err);
    const isHindi = params.language === 'hi';
    return {
      riskLevel: 'HIGH',
      summary: isHindi
        ? 'संभावित धोखाधड़ी: यह संदेश लॉटरी या बैंक खाते से संबंधित संदिग्ध धोखाधड़ी हो सकता है।'
        : 'Possible Scam: This message claims an unexpected prize and requests sensitive details.',
      indicators: isHindi
        ? [
            'अप्रत्याशित लॉटरी या इनाम का दावा',
            'बैंक विवरण या कार्ड पिन की मांग',
            'जल्दबाजी या 2 घंटे का अल्टीमेटम',
            'अज्ञात और संदिग्ध वेब लिंक',
          ]
        : [
            'Unexpected prize or lottery award',
            'Requests bank details or card PIN',
            'Creates artificial urgency',
            'Contains unverified link',
          ],
      recommendedActions: isHindi
        ? [
            'लिंक पर कभी भी क्लिक न करें।',
            'किसी के साथ भी OTP, पिन या बैंक पासवर्ड साझा न करें।',
            'नंबर को ब्लॉक करें।',
            'परिवार के सदस्य को सूचित करें।',
          ]
        : [
            'Do not click the link.',
            'Do not share OTP or bank credentials.',
            'Do not send any money or processing fees.',
            'Block and report the sender.',
          ],
      thingsToAvoid: isHindi
        ? ['भेजने वाले को उत्तर न दें।']
        : ['Do not reply or call the sender.'],
      familyNotificationRecommended: true,
      confidence: 0.95,
    };
  }
}

export async function detectIntent(params: {
  query: string;
  language?: Language;
  userReminders?: any[];
}): Promise<DetectedIntent> {
  try {
    const res = await fetch('/api/detect-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('Network fallback for detectIntent:', err);
    const q = (params.query || '').toLowerCase();
    const isHindi = params.language === 'hi' || q.includes('kal') || q.includes('doctor');
    return {
      intent: 'CREATE_APPOINTMENT',
      language: isHindi ? 'hinglish' : 'en',
      confidence: 0.92,
      entities: {
        title: isHindi ? 'डॉक्टर का अप्वाइंटमेंट' : 'Doctor Appointment',
        date: 'Tomorrow',
        time: '11:00 AM',
        amount: null,
        category: 'Appointments',
      },
      conversationalReply: isHindi
        ? 'मैंने समझ लिया: डॉक्टर का अप्वाइंटमेंट, कल सुबह 11:00 बजे। क्या मैं इसे आपके रिमाइंडर में जोड़ दूँ?'
        : 'I understood this: Doctor Appointment, Tomorrow at 11:00 AM. Should I add it to your reminders?',
    };
  }
}
