// Appointment related types

export interface IConsultant {
  id: number;
  firstName: string;
  lastName: string;
  specialityId?: number;
  consultantCode?: string;
  code?: string;
  professionalTypeCode?: string;
  title?: string;
  professinality?: string;
  createdBy?: string;
  createdOn?: string;
  isNew?: boolean;
}

export interface IConsultantListRes {
  items: IConsultant[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface IAppointmentData {
  id: number;
  appointmentCode?: string;
  appointmentNo?: string;
  patientId: number;
  consultantId: number;
  appointmentDate?: string;
  appointmentStatus?: string;
  channelType?: string;
  isEmergency?: boolean;
  chargeByDoctor?: number;
  chargeOnSchedule?: number;
  totalCharge?: number;
  createdBy?: string;
  createdOn?: string;
  isNew?: boolean;
}

export interface IAppointmentListRes {
  items: IAppointmentData[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface IAppointmentCreateRes {
  id?: number;
  appointmentCode?: string;
  success?: boolean;
  message?: string;
  data?: IAppointmentData;
}

export interface CreateAppointmentData {
  patientId?: number;
  consultantId?: number;
  appointmentDate?: string;
  channelType?: string;
  appointmentPaymentType?: string;
  amount?: number;
  appoNo?: string;
  patientCode?: string;
  patientName?: string;
  doctor?: string;
  note?: string;
  emergency?: boolean;
}

export type PatientSearchType = "PhoneNumber" | "NIC" | "PatientCode";
