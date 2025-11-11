interface IList<L> {
  items: L[];
  totalPages: number;
  pageNumber: number;
  pageSize: number;
}
export interface IConsultationAppointment {
  appointmentId: number;
  consultantId: number;
  appointmentNo: string;
  isEmergency: boolean;
  appointmentStatus: string;
  chargeOnSchedule: number;
  chargeByDoctor: number;
  totalCharge: number;
  patientId: number;
  phoneNumber: string;
  firstName: string;
  middleName: string;
  lastName: string;
  nic: string;
  dateOfBirth: string;
  gender: string;
}

export interface ILabTesting {
  id: number;
  labTestCode: string;
  labTestName: string;
  fields: string;
  isNew: boolean;
  createdBy: string;
  createdOn: string;
  values?: string;
  refRange?: string;
  comment?: string;
}

export interface ISelectedTest {
  testId?: number;
  investigationId?: number;
  labTestCode: string;
  labTestName: string;
  fields: string;
  isNew: boolean;
  createdBy: string;
  createdOn: string;
  values?: string;
  refRange?: string;
  comment?: string;
}

export type IConsultationAppointmentList = IList<IConsultationAppointment>;

export type ILabTesingList = IList<ILabTesting>;

export interface IInvestigationHistoryRes {
  id: number;
  appointmentId: number;
  patientId: number;
  consultantId: number;
  labTestId: number;
  labTestName: string;
  values: string;
  refRange: string;
  comment: string;
  createdOn: string;
  createdBy: string;
  isNew: boolean;
}
