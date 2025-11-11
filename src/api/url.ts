export const API_URL = {
  base: "http://cloud.ninesense.lk:3001/",
  auth: {
    login: "api/Authentication/login",
    register: "api/Authentication/register",
  },
  patient: {
    create: "api/Patient",
    update: "api/Patient",
    delete: "api/Patient",
    get: "api/Patient",
    list: "api/Patient/list",
    search: "api/Patient/search",
  },
  appointment: {
    create: "api/Appointment",
    update: "api/Appointment",
    delete: "api/Appointment",
    get: "api/Appointment",
    list: "api/Appointment/list",
    nextAppoinmentNo: "/api/Appointment/NextAppoinmentNo",
  },
  clinicalNote: {
    get(patientId: number) {
      return `api/ClinicalNote?patientId=${patientId}`;
    },
    list(patientId: number) {
      return `api/ClinicalNote/list?patientId=${patientId}`;
    },
  },
  consultant: {
    create: "api/Consultant",
    update: "api/Consultant",
    delete: "api/Consultant",
    get: "api/Consultant",
    list: "api/Consultant/list",
  },
  diagnosis: {
    get(patientId: number) {
      return `api/Diagnosis?patientId=${patientId}`;
    },
    list(patientId: number) {
      return `api/Diagnosis/list?patientId=${patientId}`;
    },
  },
  doctorConsultation: {
    create: "api/DoctorConsultation",
    list(consultantId: number, status: string) {
      return `api/DoctorConsultation/list?consultantId=${consultantId}&status=${status}`;
    },
    lastHistory: (patientId: number) =>
      `/api/DoctorConsultation/lasthistory?PatientId=${patientId}`,
    history: (patientId: number, mainType: string, subType: string) =>
      `/api/DoctorConsultation/history?PatientId=${patientId}&mainType=${mainType}&subType=${subType}`,
    investigationHistory: (
      patientId: number,
      dateFrom: string,
      dateTo: string
    ) =>
      `/api/DoctorConsultation/investigationhistory?PatientId=${patientId}&dateFrom=${dateFrom}&dateTo=${dateTo}`,
    managementHistory: (patientId: number) =>
      `/api/DoctorConsultation/Managementhistory?PatientId=${patientId}`,
  },
  doctorSchedule: {
    update: "api/DoctorSchedule",
    get: "api/DoctorSchedule",
  },
  labTest: {
    create: "/api/LabTest",
    update: "/api/LabTest",
    delete: "/api/LabTest",
    get: "/api/LabTest",
    list: "/api/LabTest/list",
  },
};
