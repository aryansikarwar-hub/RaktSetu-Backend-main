/**
 * RAG KNOWLEDGE BASE
 * Curated, citable facts about blood donation and how to use RaktSetu.
 * The chatbot retrieves the most relevant entries for a question and grounds
 * its answer in them (Retrieval-Augmented Generation) — so it never makes
 * things up. Each entry has keywords for retrieval and an authoritative answer.
 */
export const KNOWLEDGE_BASE = [
  {
    id: 'kb-eligibility-basic',
    topic: 'eligibility',
    keywords: ['eligible', 'eligibility', 'can i donate', 'who can donate', 'requirements', 'qualify', 'age', 'weight'],
    answer:
      'To donate blood in India you generally must be 18–65 years old, weigh at least 50 kg, and be in good health with normal hemoglobin. You can use RaktSetu’s AI Eligibility Pre-Screen (Eligibility page) to check in under a minute before visiting a centre.',
  },
  {
    id: 'kb-frequency',
    topic: 'eligibility',
    keywords: ['how often', 'how often can i donate', 'frequency', 'gap between', 'how long to wait', 'days between', 'next donation', '90 days', 'three months', 'donate again'],
    answer:
      'Whole blood can be donated once every 90 days (about 3 months). Platelets and plasma have shorter intervals (around 2 weeks). RaktSetu tracks your last donation and shows a countdown to your next eligible date on your dashboard.',
  },
  {
    id: 'kb-compatibility',
    topic: 'compatibility',
    keywords: ['compatible', 'compatibility', 'who can receive', 'universal donor', 'universal recipient', 'blood type', 'match types', 'o negative', 'ab positive'],
    answer:
      'O− is the universal red-cell donor (can give to all types) and AB+ is the universal recipient (can receive from all types). Use the Compatibility Checker on the Find Blood page to see exactly who any type can give to and receive from.',
  },
  {
    id: 'kb-emergency-post',
    topic: 'emergency',
    keywords: ['emergency', 'urgent', 'post request', 'need blood', 'request blood', 'broadcast', 'how to request'],
    answer:
      'To request blood urgently, open the Emergency page and fill the request form (blood type, units, hospital, city, contact). Our AI triage instantly assigns a priority (P1–P4) and the request appears on the live feed for compatible, available donors and hospitals nearby.',
  },
  {
    id: 'kb-find-donor',
    topic: 'donors',
    keywords: ['find donor', 'search donor', 'nearby donor', 'locate', 'find blood', 'donor near me'],
    answer:
      'Use the Find Blood page to search verified donors by blood type, city, and live availability. The AI Match tab ranks the best donors for a request by compatibility, distance, eligibility, and reliability.',
  },
  {
    id: 'kb-process',
    topic: 'process',
    keywords: ['process', 'how does donation work', 'what happens', 'procedure', 'safe', 'painful', 'how long', 'time'],
    answer:
      'Donation is safe and takes about 10–15 minutes for the actual draw (30–45 minutes total with registration and rest). A sterile, single-use needle is used. You’ll get a quick health check (hemoglobin, BP) before donating. Drink water and avoid heavy activity right after.',
  },
  {
    id: 'kb-after-care',
    topic: 'process',
    keywords: ['after donation', 'aftercare', 'recover', 'rest', 'eat', 'side effects', 'dizzy'],
    answer:
      'After donating: rest 10–15 minutes, drink plenty of fluids, eat a snack, avoid strenuous exercise and alcohol for 24 hours, and keep the bandage on for a few hours. Mild tiredness is normal; your body replaces the fluid within a day.',
  },
  {
    id: 'kb-register',
    topic: 'account',
    keywords: ['register', 'sign up', 'create account', 'join', 'become donor', 'how to join'],
    answer:
      'Click Register and choose your role — Donor, Hospital, or Admin. Donors provide blood type and city; hospitals provide their hospital name and license. Once registered you can manage availability, respond to emergencies, and track donations.',
  },
  {
    id: 'kb-roles',
    topic: 'account',
    keywords: ['role', 'hospital account', 'admin', 'donor account', 'difference', 'types of account'],
    answer:
      'RaktSetu has three account types: Donors (donate and respond to requests), Hospitals (post requests and manage blood inventory), and Admins (oversee the network). You pick your role during signup.',
  },
  {
    id: 'kb-forecast',
    topic: 'forecast',
    keywords: ['forecast', 'shortage', 'demand', 'prediction', 'stock', 'inventory', 'supply'],
    answer:
      'The Forecast page shows a 7-day AI prediction of which blood types will run critical in a city, with recommended actions. Hospitals use it to launch donation drives before a shortage hits.',
  },
  {
    id: 'kb-safety',
    topic: 'safety',
    keywords: ['safe to donate', 'risk', 'infection', 'covid', 'disease', 'reuse needle', 'is it safe'],
    answer:
      'Donating is very safe. Equipment is sterile and single-use, so there is no risk of infection from donating. The blood is screened before transfusion. If you feel unwell, were recently ill, or are unsure, run the Eligibility Pre-Screen first.',
  },
  {
    id: 'kb-contact',
    topic: 'support',
    keywords: ['contact', 'help', 'support', 'phone', 'reach', 'helpline'],
    answer:
      'For help, use the 24/7 helpline 1800-RAKTSETU or email help@raktsetu.in. For a medical emergency, post on the Emergency page so nearby donors and hospitals are alerted immediately.',
  },
];

/** Quick-suggestion chips shown when the chat opens. */
export const SUGGESTED_QUESTIONS = [
  'Am I eligible to donate?',
  'How often can I donate blood?',
  'Who can receive O− blood?',
  'How do I post an emergency request?',
  'Is donating blood safe?',
];
