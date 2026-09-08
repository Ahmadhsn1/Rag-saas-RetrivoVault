export type PlanId = "free" | "pro" | "max";

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  priceMonthly: number; // USD; 0 = free
  priceAnnual: number; // USD per month billed annually
  highlight?: boolean;
  cta: string;
  limits: {
    documents: number;
    storageMb: number;
    queriesPerMonth: number;
    collections: number;
  };
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "A small vault, free forever",
    priceMonthly: 0,
    priceAnnual: 0,
    cta: "Start free",
    limits: {
      documents: 20,
      storageMb: 50,
      queriesPerMonth: 100,
      collections: 3,
    },
    features: [
      "20 documents · 50 MB",
      "100 questions a month",
      "3 collections",
      "Sourced, streaming answers",
      "Share a chat by link",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For a working research library",
    priceMonthly: 12,
    priceAnnual: 9,
    highlight: true,
    cta: "Choose Pro",
    limits: {
      documents: 500,
      storageMb: 2048,
      queriesPerMonth: 3000,
      collections: 50,
    },
    features: [
      "500 documents · 2 GB",
      "3,000 questions a month",
      "50 collections",
      "Priority processing",
      "Bring your own Gemini key",
      "Email support",
    ],
  },
  {
    id: "max",
    name: "Max",
    tagline: "For heavy users and builders",
    priceMonthly: 29,
    priceAnnual: 24,
    cta: "Choose Max",
    limits: {
      documents: 5000,
      storageMb: 20480,
      queriesPerMonth: 20000,
      collections: 500,
    },
    features: [
      "5,000 documents · 20 GB",
      "20,000 questions a month",
      "API access + personal keys",
      "Signed webhooks",
      "Bring your own Gemini key",
      "Priority support",
    ],
  },
];

export const planById = (id: PlanId) =>
  PLANS.find((p) => p.id === id) ?? PLANS[0];
