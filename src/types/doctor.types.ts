// Doctor/Clinical related types

export interface Tab {
  id:
    | "patients"
    | "presenting"
    | "examination"
    | "diagnosis"
    | "investigation"
    | "management";
  label: string;
  icon: React.ReactNode;
  shortcut: string;
}

export type TPatient = {
  id: string | number;
  appoNo: string;
  name: string;
  age: string | number;
  gender: string;
  situation: string;
  situationColor: string;
  phoneNumber: string;
  patientCode?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
};

export type TClinicalNote = {
  presentingComplains: string;
  medicalNotes: string;
  surgicalNotes: string;
  allergyNotes: string;
  presentingTemplateComment?: string;
};

export type TExamination = {
  general: string;
  cardioVascular: string;
  respiratory: string;
  centralNurve: string;
  gartroIntestinal: string;
  generalAppearance?: string;
  vitalSigns?: string;
  systemicExamination?: string;
  laboratoryFindings?: string;
};

export type TDiagnosis = {
  infectiousDiseases?: string;
  chronicDiseases?: string;
  gastrointestinal?: string;
  neurological?: string;
  musculoskeletal?: string;
  other?: string;
  provisionalDiagnosis?: string;
  differentialDiagnosis?: string;
  finalDiagnosis?: string;
};

export interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  historyData?: string[];
}

// Investigation/Test related types
export interface TestParameter {
  name: string;
  reference: string;
}

export interface TestResultValue {
  parameterName: string;
  value: string;
  referenceRange: string;
  comment?: string;
}

export interface TestResult {
  testName: string;
  date: string;
  results: TestResultValue[];
}

export interface PatientTestHistory {
  patientId: string;
  testHistory: TestResult[];
}

export interface Doctor {
  id: number;
  name: string;
  speciality: string;
  phone: string;
  email: string;
  status: string;
}
