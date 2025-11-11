// Patient related types

export interface PatientData {
  id?: string | number;
  patientCode?: string;
  phone?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  nic?: string;
  age?: string;
  birthMonth?: string;
  birthDay?: string;
  dob?: string;
  gender: string;
  address?: string;
  city?: string;
  email?: string;
  emergencyContact?: string;
}

export interface IPatientResponse {
  id?: number;
  patientCode?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  phoneNumber?: string;
  nic?: string;
  address?: string;
  city?: string;
  email?: string;
  emergencyContact?: string;
  createdBy?: string;
  createdOn?: string;
  isNew?: boolean;
}

export interface DOBModeInput {
  mode?: "DOB";
  year?: number;
  month?: number;
  day?: number;
}

export interface AgeModeInput {
  mode?: "AGE";
  years?: number;
  months?: number;
  days?: number;
}

export interface AgeBreakdown {
  years: number;
  months: number;
  days: number;
  text: string;
  isFuture: boolean;
}
