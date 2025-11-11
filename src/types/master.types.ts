// Master data types

export interface Speciality {
  id: number;
  code: string;
  name: string;
  description: string;
  status: string;
}

export interface SpecialityFormData {
  code: string;
  name: string;
  description: string;
  status: string;
}

export interface Professional {
  id: number;
  code: string;
  name: string;
  description: string;
  status: string;
}

export interface ProfessionalFormData {
  code: string;
  name: string;
  description: string;
  status: string;
}

export interface ChannelItem {
  id: number;
  channelNo: string;
  doctor: string;
  date: string;
  time: string;
  patient: string;
  status: string;
}
