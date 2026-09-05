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
    tagline: "For trying things out",
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
      "100 questions / month",
      "3 collections",
      "Cited, streaming answers",
      "Community support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For a serious personal knowledge base",
    priceMonthly: 12,
    priceAnnual: 9,
    highlight: true,
    cta: "Upgrade to Pro",
    limits: {
      documents: 500,
      storageMb: 2048,
      queriesPerMonth: 3000,
      collections: 50,
    },
    features: [
      "500 documents · 2 GB",
      "3,000 questions / month",
      "50 collections",
      "Bring your own Gemini key",
      "Priority ingestion queue",
      "Email support",
    ],
  },
  {
    id: "max",
    name: "Max",
    tagline: "For power users and builders",
    priceMonthly: 29,
    priceAnnual: 24,
    cta: "Upgrade to Max",
    limits: {
      documents: 5000,
      storageMb: 20480,
      queriesPerMonth: 20000,
      collections: 500,
    },
    features: [
      "5,000 documents · 20 GB",
      "20,000 questions / month",
      "Unlimited-feel collections",
      "API access + personal API keys",
      "Bring your own Gemini key",
      "Priority support",
    ],
  },
];

export const planById = (id: PlanId) =>
  PLANS.find((p) => p.id === id) ?? PLANS[0];
