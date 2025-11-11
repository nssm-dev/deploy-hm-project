// Sample drugs data for autocomplete search
export interface Drug {
  id: string;
  itemCode: string;
  itemName: string;
  genericName: string;
  form: string; // tablet, capsule, syrup, injection, etc.
  manufacturer?: string;
}

export const drugsData: Drug[] = [
  {
    id: "D001",
    itemCode: "10001",
    itemName: "Paracetamol 500mg",
    genericName: "Acetaminophen",
    form: "Tablet",
    manufacturer: "ABC Pharma",
  },
  {
    id: "D002",
    itemCode: "10002",
    itemName: "Paracetamol 250mg",
    genericName: "Acetaminophen",
    form: "Tablet",
    manufacturer: "ABC Pharma",
  },
  {
    id: "D003",
    itemCode: "10003",
    itemName: "Paracetamol 1000mg",
    genericName: "Acetaminophen",
    form: "Tablet",
    manufacturer: "ABC Pharma",
  },
  {
    id: "D004",
    itemCode: "10004",
    itemName: "Amoxicillin 250mg",
    genericName: "Amoxicillin",
    form: "Capsule",
    manufacturer: "MediCare",
  },
  {
    id: "D005",
    itemCode: "10005",
    itemName: "Amoxicillin 500mg",
    genericName: "Amoxicillin",
    form: "Capsule",
    manufacturer: "MediCare",
  },
  {
    id: "D006",
    itemCode: "10006",
    itemName: "Omeprazole 20mg",
    genericName: "Omeprazole",
    form: "Capsule",
    manufacturer: "PharmaCorp",
  },
  {
    id: "D007",
    itemCode: "10007",
    itemName: "Metformin 500mg",
    genericName: "Metformin HCl",
    form: "Tablet",
    manufacturer: "DiabeCare",
  },
  {
    id: "D008",
    itemCode: "10008",
    itemName: "Metformin 850mg",
    genericName: "Metformin HCl",
    form: "Tablet",
    manufacturer: "DiabeCare",
  },
  {
    id: "D009",
    itemCode: "10009",
    itemName: "Amlodipine 5mg",
    genericName: "Amlodipine Besylate",
    form: "Tablet",
    manufacturer: "CardioPharma",
  },
  {
    id: "D010",
    itemCode: "10010",
    itemName: "Amlodipine 10mg",
    genericName: "Amlodipine Besylate",
    form: "Tablet",
    manufacturer: "CardioPharma",
  },
  {
    id: "D011",
    itemCode: "10011",
    itemName: "Atorvastatin 10mg",
    genericName: "Atorvastatin Calcium",
    form: "Tablet",
    manufacturer: "LipidCare",
  },
  {
    id: "D012",
    itemCode: "10012",
    itemName: "Atorvastatin 20mg",
    genericName: "Atorvastatin Calcium",
    form: "Tablet",
    manufacturer: "LipidCare",
  },
  {
    id: "D013",
    itemCode: "10013",
    itemName: "Aspirin 75mg",
    genericName: "Acetylsalicylic Acid",
    form: "Tablet",
    manufacturer: "HeartGuard",
  },
  {
    id: "D014",
    itemCode: "10014",
    itemName: "Aspirin 150mg",
    genericName: "Acetylsalicylic Acid",
    form: "Tablet",
    manufacturer: "HeartGuard",
  },
  {
    id: "D015",
    itemCode: "10015",
    itemName: "Ciprofloxacin 500mg",
    genericName: "Ciprofloxacin HCl",
    form: "Tablet",
    manufacturer: "AntiBio",
  },
  {
    id: "D016",
    itemCode: "10016",
    itemName: "Azithromycin 250mg",
    genericName: "Azithromycin",
    form: "Tablet",
    manufacturer: "AntiBio",
  },
  {
    id: "D017",
    itemCode: "10017",
    itemName: "Azithromycin 500mg",
    genericName: "Azithromycin",
    form: "Tablet",
    manufacturer: "AntiBio",
  },
  {
    id: "D018",
    itemCode: "10018",
    itemName: "Losartan 50mg",
    genericName: "Losartan Potassium",
    form: "Tablet",
    manufacturer: "BPControl",
  },
  {
    id: "D019",
    itemCode: "10019",
    itemName: "Losartan 100mg",
    genericName: "Losartan Potassium",
    form: "Tablet",
    manufacturer: "BPControl",
  },
  {
    id: "D020",
    itemCode: "10020",
    itemName: "Cetirizine 10mg",
    genericName: "Cetirizine HCl",
    form: "Tablet",
    manufacturer: "AllergyFree",
  },
  {
    id: "D021",
    itemCode: "10021",
    itemName: "Loratadine 10mg",
    genericName: "Loratadine",
    form: "Tablet",
    manufacturer: "AllergyFree",
  },
  {
    id: "D022",
    itemCode: "10022",
    itemName: "Prednisolone 5mg",
    genericName: "Prednisolone",
    form: "Tablet",
    manufacturer: "SteroPharma",
  },
  {
    id: "D023",
    itemCode: "10023",
    itemName: "Prednisolone 10mg",
    genericName: "Prednisolone",
    form: "Tablet",
    manufacturer: "SteroPharma",
  },
  {
    id: "D024",
    itemCode: "10024",
    itemName: "Salbutamol 100mcg Inhaler",
    genericName: "Salbutamol Sulfate",
    form: "Inhaler",
    manufacturer: "RespiCare",
  },
  {
    id: "D025",
    itemCode: "10025",
    itemName: "Insulin Glargine 100 units/mL",
    genericName: "Insulin Glargine",
    form: "Injection",
    manufacturer: "DiabeCare",
  },
  {
    id: "D026",
    itemCode: "10026",
    itemName: "Vitamin D3 1000 IU",
    genericName: "Cholecalciferol",
    form: "Capsule",
    manufacturer: "VitaHealth",
  },
  {
    id: "D027",
    itemCode: "10027",
    itemName: "Vitamin B Complex",
    genericName: "B-Complex",
    form: "Tablet",
    manufacturer: "VitaHealth",
  },
  {
    id: "D028",
    itemCode: "10028",
    itemName: "Gabapentin 300mg",
    genericName: "Gabapentin",
    form: "Capsule",
    manufacturer: "NeuroPharma",
  },
  {
    id: "D029",
    itemCode: "10029",
    itemName: "Levothyroxine 50mcg",
    genericName: "Levothyroxine Sodium",
    form: "Tablet",
    manufacturer: "ThyroCare",
  },
  {
    id: "D030",
    itemCode: "10030",
    itemName: "Levothyroxine 100mcg",
    genericName: "Levothyroxine Sodium",
    form: "Tablet",
    manufacturer: "ThyroCare",
  },
  {
    id: "D031",
    itemCode: "10031",
    itemName: "Diclofenac 50mg",
    genericName: "Diclofenac Sodium",
    form: "Tablet",
    manufacturer: "PainRelief",
  },
  {
    id: "D032",
    itemCode: "10032",
    itemName: "Ibuprofen 400mg",
    genericName: "Ibuprofen",
    form: "Tablet",
    manufacturer: "PainRelief",
  },
];

// Simulate API call with delay
export const searchDrugs = async (query: string): Promise<Drug[]> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const lowerQuery = query.toLowerCase();
  return drugsData.filter(
    (drug) =>
      drug.itemName.toLowerCase().includes(lowerQuery) ||
      drug.genericName.toLowerCase().includes(lowerQuery)
  );
};
