// Prescribed Tests Data
// Patient ට prescribe කරපු investigation tests

export interface PrescribedTestParameter {
  name: string;
  unit?: string;
  normalRange?: string;
  reference?: string; // Alternative field name for compatibility
}

export interface PrescribedTest {
  name: string;
  prescribedDate: string;
  fields: PrescribedTestParameter[];
}

// Mock data - Backend API එකෙන් replace කරන්න
export const prescribedTestsData: PrescribedTest[] = [
  {
    name: "FBC (Full Blood Count)",
    prescribedDate: "2025-11-05",
    fields: [
      { name: "WBC", reference: "4.0-11.0 x10³/µL" },
      { name: "RBC", reference: "4.5-5.5 x10⁶/µL" },
      { name: "Hemoglobin", reference: "12.0-16.0 g/dL" },
      { name: "Platelets", reference: "150-400 x10³/µL" },
    ],
  },
  {
    name: "ESR (Erythrocyte Sedimentation Rate)",
    prescribedDate: "2025-11-05",
    fields: [{ name: "ESR Value", reference: "0-20 mm/hr" }],
  },
  {
    name: "Blood Sugar (Fasting)",
    prescribedDate: "2025-11-03",
    fields: [
      { name: "Fasting", reference: "70-100 mg/dL" },
      { name: "Random", reference: "<140 mg/dL" },
      { name: "PP (Post Prandial)", reference: "<140 mg/dL" },
    ],
  },
];

// API Integration සඳහා function (Future)
export const fetchPrescribedTests = async (
  _patientId: string
): Promise<PrescribedTest[]> => {
  // TODO: Replace with actual API call
  // const response = await fetch(`/api/patients/${_patientId}/prescribed-tests`);
  // return response.json();

  return prescribedTestsData;
};
