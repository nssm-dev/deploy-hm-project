// Medication frequency and dosage options

export interface FrequencyOption {
  id: string;
  value: string;
  label: string;
  description: string;
}

export const frequencyOptions: FrequencyOption[] = [
  {
    id: "mane",
    value: "mane",
    label: "Mane",
    description: "Once daily in the morning",
  },
  {
    id: "nocte",
    value: "nocte",
    label: "Nocte",
    description: "Once daily at night",
  },
  {
    id: "bd",
    value: "bd",
    label: "BD",
    description: "Twice daily",
  },
  {
    id: "tds",
    value: "tds",
    label: "TDS",
    description: "Three times daily",
  },
  {
    id: "qds",
    value: "qds",
    label: "QDS",
    description: "Four times daily",
  },
  {
    id: "hourly",
    value: "hourly",
    label: "Hourly",
    description: "Every hour",
  },
  {
    id: "q2h",
    value: "q2h",
    label: "Q2H",
    description: "Every 2 hours",
  },
  {
    id: "q4h",
    value: "q4h",
    label: "Q4H",
    description: "Every 4 hours",
  },
  {
    id: "q6h",
    value: "q6h",
    label: "Q6H",
    description: "Every 6 hours",
  },
  {
    id: "q8h",
    value: "q8h",
    label: "Q8H",
    description: "Every 8 hours",
  },
  {
    id: "stat",
    value: "stat",
    label: "STAT",
    description: "Immediately, once only",
  },
  {
    id: "prn",
    value: "prn",
    label: "PRN",
    description: "As needed",
  },
];

export interface MedicationInstruction {
  id: string;
  instruction: string;
}

export const commonInstructions: MedicationInstruction[] = [
  { id: "1", instruction: "Take with food" },
  { id: "2", instruction: "Take on empty stomach" },
  { id: "3", instruction: "Take before meals" },
  { id: "4", instruction: "Take after meals" },
  { id: "5", instruction: "Take with plenty of water" },
  { id: "6", instruction: "Do not crush or chew" },
  { id: "7", instruction: "Avoid alcohol" },
  { id: "8", instruction: "Complete the course" },
  { id: "9", instruction: "Shake well before use" },
  { id: "10", instruction: "Store in cool place" },
];

export interface PrescribedMedication {
  id: string;
  drugId: string;
  itemCode?: string;
  drugName: string;
  strength: string;
  form: string;
  quantity: number;
  frequency: string;
  duration: number; // in days
  specialInstructions?: string;
}
