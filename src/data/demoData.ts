import { Reminder, UserSettings } from '../types';

export const INITIAL_SETTINGS: UserSettings = {
  userName: 'Mrs. Sharma',
  language: 'en',
  textSize: 'large', // Senior-first default
  highContrast: false,
  autoReadAloud: false,
  trustedContactName: 'Rahul Sharma',
  trustedContactRelation: 'Son',
  trustedContactPhone: '+91 98765 43210',
};

export const INITIAL_REMINDERS: Reminder[] = [
  {
    id: 'rem-1',
    userId: 'user-sharma',
    title: 'Electricity Bill',
    description: 'BSES Rajdhani Power Limited - Monthly consumption bill',
    date: '2026-09-24',
    time: '09:00 AM',
    amount: 1842,
    currency: '₹',
    category: 'Bills',
    status: 'PENDING',
    source: 'DOCUMENT_ANALYSIS',
    createdAt: '2026-09-18T10:00:00.000Z',
  },
  {
    id: 'rem-2',
    userId: 'user-sharma',
    title: 'Doctor Appointment',
    description: 'Routine blood pressure & sugar checkup with Dr. Mehra at Max Clinic',
    date: '2026-09-19', // Tomorrow
    time: '11:00 AM',
    amount: null,
    currency: null,
    category: 'Appointments',
    status: 'PENDING',
    source: 'VOICE_ASSISTANT',
    createdAt: '2026-09-18T11:30:00.000Z',
  },
  {
    id: 'rem-3',
    userId: 'user-sharma',
    title: 'Morning Heart Medication',
    description: 'Take 1 tablet of Ecosprin after breakfast with warm water',
    date: '2026-09-19',
    time: '08:30 AM',
    amount: null,
    currency: null,
    category: 'General',
    status: 'PENDING',
    source: 'MANUAL',
    createdAt: '2026-09-17T08:00:00.000Z',
  },
];

export interface DemoSample {
  id: string;
  title: string;
  hindiTitle: string;
  snippet: string;
  content: string;
  category: string;
}

export const SAMPLE_DOCUMENTS: DemoSample[] = [
  {
    id: 'doc-bill',
    title: 'Electricity Bill Notice',
    hindiTitle: 'बिजली का बिल',
    snippet: 'BSES Delhi • Due 24 Sept • ₹1,842',
    category: 'Bills',
    content: `BSES RAJDHANI POWER LIMITED
ELECTRICITY CONSUMPTION BILL
Consumer No: CA-102948192
Bill Date: 10 September 2026
Due Date for Payment: 24 September 2026
Total Current Dues: ₹1,842.00
After Due Date Amount: ₹1,985.00
Connection: Domestic (Single Phase)
Units Consumed: 218 kWh
Important Note: Please clear dues on or before 24-09-2026 to avoid disconnection or late surcharge fees.`,
  },
  {
    id: 'doc-pension',
    title: 'Life Certificate / Pension Notice',
    hindiTitle: 'पेंशन जीवन प्रमाण पत्र सूचना',
    snippet: 'SBI Pension Branch • Submit by 30 Nov',
    category: 'Documents',
    content: `CENTRAL PENSION ACCOUNTING OFFICE
Government of India - Annual Life Certificate Verification
Dear Pensioner Mrs. Sharma,
Your Annual Jeevan Pramaan (Life Certificate) submission is due by 30 November 2026.
You may complete digital biometric authentication at any nearby Citizen Service Centre or visit SBI Defence Colony Branch with your Pension Payment Order (PPO) number.
No fees are required for digital verification.`,
  },
  {
    id: 'doc-prescription',
    title: 'Doctor Prescription Note',
    hindiTitle: 'डॉक्टर की पर्ची',
    snippet: 'Dr. Mehra • Follow-up checkup required',
    category: 'Appointments',
    content: `MAX HEALTHCARE CLINIC
Dr. A. K. Mehra, MD (Internal Medicine)
Patient: Mrs. S. Sharma, Age 68
BP: 130/84 mmHg
Rx:
1. Tab Amlodipine 5mg - Once daily in morning
2. Tab Calcium + Vit D3 - Once daily after lunch
Advised: Check blood sugar fasting and visit for follow-up review on 25 September 2026 at 11:00 AM.`,
  },
];

export const SAMPLE_SCAMS: DemoSample[] = [
  {
    id: 'scam-lottery',
    title: 'WhatsApp Lottery Scam',
    hindiTitle: 'लॉटरी का फर्जी संदेश',
    snippet: 'Won ₹25 Lakhs • Click link for bank details',
    category: 'Scam Alert',
    content: `Congratulations! Your mobile number has been selected in the All India WhatsApp Lucky Draw 2026 and won ₹25,00,000 cash prize!
To claim your lottery prize into your bank account immediately, click this link http://bit.ly/claim-sbi-lottery2026 and submit your full bank account number, IFSC and debit card PIN. Hurry! Offer expires in 2 hours.`,
  },
  {
    id: 'scam-power-cut',
    title: 'Urgent Electricity Disconnection Threat',
    hindiTitle: 'बिजली कटने की धमकी',
    snippet: 'Urgent notice: Power disconnected tonight',
    category: 'Scam Alert',
    content: `Dear Consumer, Your electricity power supply will be disconnected tonight at 9:30 PM from the electricity office because your previous month bill was not updated.
Immediately call our power officer Mr. Verma at 9811234567 to pay ₹100 verification fee and install QuickSupport APK.`,
  },
  {
    id: 'safe-bank-sms',
    title: 'Genuine Bank OTP / Transaction SMS',
    hindiTitle: 'बैंक का सामान्य सूचना संदेश',
    snippet: 'Informational bank SMS • Safe if not shared',
    category: 'Genuine Message',
    content: `State Bank of India: Your A/C XX4921 has been debited by ₹350 on 18-Sep-2026 at Defence Colony Grocery Store. Available balance: ₹48,210. Call 1800112211 if not done by you. Never share OTP with anyone.`,
  },
];

export const SAMPLE_VOICE_PROMPTS = [
  {
    text: 'Mujhe kal doctor ke paas jaana hai at 11 AM.',
    hindi: 'मुझे कल डॉक्टर के पास जाना है सुबह 11 बजे।',
    desc: 'Create doctor appointment',
  },
  {
    text: 'Is bill mein mujhe kitna pay karna hai?',
    hindi: 'इस बिल में मुझे कितना पैसा देना है?',
    desc: 'Explain electricity bill',
  },
  {
    text: 'Kya ye message safe hai?',
    hindi: 'क्या यह संदेश सुरक्षित है?',
    desc: 'Check suspicious WhatsApp message',
  },
  {
    text: 'Show me all my upcoming reminders.',
    hindi: 'मेरे आने वाले सभी रिमाइंडर दिखाइए।',
    desc: 'View scheduled reminders',
  },
];
