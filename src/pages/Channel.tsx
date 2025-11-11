import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
import { serverAPI } from "../api";
import { API_URL } from "../api/url.ts";
import { useSelector } from "react-redux";
import { authUserSelector } from "../redux/slice/user-slice.ts";
import {
  differenceInDays,
  differenceInMonths,
  differenceInYears,
  format,
  isAfter,
  subDays,
  subMonths,
  subYears,
} from "date-fns";
import type {
  PatientData,
  IConsultantListRes,
  IAppointmentData,
  IAppointmentCreateRes,
  IAppointmentListRes,
  CreateAppointmentData,
  IPatientResponse,
  ISelectorList,
  ToastNotification,
  DOBModeInput,
  AgeModeInput,
} from "../types";
import { calculateAgeFromDOB } from "../libs/agecal.ts";

const loadAppointmentData = async (
  setter: Dispatch<SetStateAction<IAppointmentData[]>>
) => {
  const resAppointment = await serverAPI.post<IAppointmentListRes>(
    API_URL.appointment.list,
    {
      pageNumber: 1,
      pageSize: 10,
    }
  );
  console.log(resAppointment.data);
  if (resAppointment?.data) {
    const appointmentData = resAppointment.data;
    if (appointmentData.items && appointmentData.items.length) {
      setter(appointmentData.items);
    }
  }
};

const stateColorSelector = (status: string) => {
  switch (status) {
    case "Pending":
      return "warning";
    case "complete":
      return "success";
    default:
      return "danger";
  }
};

export type InputMode = "DOB" | "AGE";

export const getDOBAndAge = (
  input: DOBModeInput | AgeModeInput
): { dob: string; age: string; isFuture: boolean } => {
  const now = new Date();

  if (input.mode === "DOB") {
    const { year, month, day } = input;

    const finalYear = year ?? now.getFullYear();
    const finalMonth = month ?? now.getMonth() + 1;
    const finalDay = day ?? now.getDate();

    const dobDate = new Date(finalYear, finalMonth - 1, finalDay);
    const isFuture = isAfter(dobDate, now);

    const dob = format(dobDate, "yyyy-MM-dd");

    if (isFuture) return { dob, isFuture, age: "Invalid (future date)" };

    // Calculate exact difference
    const years = differenceInYears(now, dobDate);
    const months = differenceInMonths(now, dobDate) - years * 12;
    const days = differenceInDays(
      now,
      new Date(now.getFullYear(), now.getMonth() - months, now.getDate())
    );

    let ageText = "";
    if (years > 0) ageText += `${years} year${years > 1 ? "s" : ""} `;
    if (months > 0) ageText += `${months} month${months > 1 ? "s" : ""} `;
    if (years === 0 && days > 0) ageText += `${days} day${days > 1 ? "s" : ""}`;
    if (!ageText.trim()) ageText = "0 days";

    return { dob, isFuture, age: ageText.trim() };
  }

  // Mode 2 — Input is AGE
  const years = "years" in input ? input.years ?? 0 : 0;
  const months = "months" in input ? input.months ?? 0 : 0;
  const days = "days" in input ? input.days ?? 0 : 0;

  let dobDate = subYears(now, years);
  dobDate = subMonths(dobDate, months);
  dobDate = subDays(dobDate, days);

  const dob = format(dobDate, "yyyy-MM-dd");

  const ageText =
    `${years ? years + "y " : ""}${months ? months + "m " : ""}${
      days ? days + "d" : ""
    }`.trim() || "0 days";

  return { dob, isFuture: false, age: ageText };
};

const Channel = () => {
  const user = useSelector(authUserSelector);
  // const [patientCode, setPatientCode] = useState<string>("");
  const [selectedPatient, setSelectedPatient] =
    useState<IPatientResponse | null>(null);
  const [searchResults, setSearchResults] = useState<IPatientResponse[]>([]);
  const [showPatientModal, setShowPatientModal] = useState<boolean>(false);
  const [showEditAppointmentModal, setShowEditAppointmentModal] =
    useState<boolean>(false);
  const [editingAppointment, setEditingAppointment] =
    useState<IAppointmentData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [patientData, setPatientData] = useState<PatientData>({
    phone: "",
    firstName: "",
    middleName: "",
    lastName: "",
    nic: "",
    age: "",
    birthMonth: "",
    birthDay: "",
    dob: "",
    gender: "Male",
  });
  const [doctorList, setDoctorList] = useState<ISelectorList[]>([]);
  const [appointmentList, setAppointmentList] = useState<IAppointmentData[]>(
    []
  );

  const [appointmentData, setAppointmentData] = useState<CreateAppointmentData>(
    {
      appoNo: "008",
      patientCode: "",
      patientName: "",
      doctor: "",
      note: "",
      emergency: false,
    }
  );
  // Age inputs
  const [years, setYears] = useState<number | undefined>();
  const [months, setMonths] = useState<number | undefined>();
  const [days, setDays] = useState<number | undefined>();

  const { dob: patientDob } = useMemo(
    () => getDOBAndAge({ mode: "AGE", years, months, days }),
    [years, months, days]
  );

  // Toast notification functions
  const showToast = (
    type: "success" | "error" | "info" | "warning",
    title: string,
    message: string
  ) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, title, message }]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Calculate date of birth from age, month, and day
  // const calculateDobFromAge = (age: string, month: string, day: string) => {
  //     const today = new Date();
  //     const currentYear = today.getFullYear();
  //     const currentMonth = (today.getMonth() + 1).toString().padStart(2, "0");
  //     const currentDay = today.getDate().toString().padStart(2, "0");
  //
  //     // Check if month or day has valid value
  //     const hasValidMonth =
  //         month &&
  //         month.trim() !== "" &&
  //         parseInt(month) >= 1 &&
  //         parseInt(month) <= 12;
  //     const hasValidDay =
  //         day && day.trim() !== "" && parseInt(day) >= 1 && parseInt(day) <= 31;
  //     const hasMonthOrDay = hasValidMonth || hasValidDay;
  //
  //     // Calculate birth month and day
  //     // If month is provided, treat it as absolute month number (1-12)
  //     // But use current day from today
  //     const birthMonth = hasValidMonth
  //         ? parseInt(month).toString().padStart(2, "0")
  //         : currentMonth;
  //     const birthDay = hasValidDay
  //         ? parseInt(day).toString().padStart(2, "0")
  //         : currentDay;
  //
  //     if (!age || age.trim() === "" || isNaN(Number(age))) {
  //         // If no age but has month/day, we need to determine the year
  //         if (hasMonthOrDay) {
  //             // Create a date with the current year and provided month/day
  //             const enteredMonth = parseInt(birthMonth);
  //             const enteredDay = parseInt(birthDay);
  //             const todayMonth = today.getMonth() + 1; // 1-12
  //             const todayDay = today.getDate();
  //
  //             // If the entered month is after current month, or same month but day is after today,
  //             // it means the birthday hasn't occurred yet this year, so use previous year
  //             let birthYear = currentYear;
  //             if (
  //                 enteredMonth > todayMonth ||
  //                 (enteredMonth === todayMonth && enteredDay > todayDay)
  //             ) {
  //                 birthYear = currentYear - 1;
  //             }
  //
  //             return `${birthYear}-${birthMonth}-${birthDay}`;
  //         }
  //         return "";
  //     }
  //
  //     const birthYear = currentYear - parseInt(age);
  //     return `${birthYear}-${birthMonth}-${birthDay}`;
  // };

  // const handleAgeChange = (age: string) => {
  //     // Clear months/days-only when user sets age(years)
  //     setAgeMonthsOnly("");
  //     setAgeDaysOnly("");
  //     const dob = calculateDobFromAge(
  //         age,
  //         patientData.birthMonth,
  //         patientData.birthDay
  //     );
  //     setPatientData({
  //         ...patientData,
  //         age: age,
  //         dob: dob,
  //     });
  // };

  // Month and Day inputs removed from UI; no direct setters required now.

  // Compute exact DOB when entering age in months or days only (relative to today)
  // const formatDateYMD = (date: Date) => {
  //     const y = date.getFullYear();
  //     const m = String(date.getMonth() + 1).padStart(2, "0");
  //     const d = String(date.getDate()).padStart(2, "0");
  //     return `${y}-${m}-${d}`;
  // };
  //
  // const computeAgeYears = (dob: string): string => {
  //     if (!dob) return "";
  //     const birthDate = new Date(dob);
  //     const today = new Date();
  //     let years = today.getFullYear() - birthDate.getFullYear();
  //     const m = today.getMonth() - birthDate.getMonth();
  //     if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) years--;
  //     return years.toString();
  // };

  // const handleAgeMonthsOnlyChange = (val: string) => {
  //     const sanitized = val.replace(/[^0-9]/g, "");
  //     setAgeMonthsOnly(sanitized);
  //     setAgeDaysOnly("");
  //     if (sanitized === "") return;
  //     const months = parseInt(sanitized, 10);
  //     if (!isNaN(months)) {
  //         const d = new Date();
  //         d.setHours(0, 0, 0, 0);
  //         d.setMonth(d.getMonth() - months);
  //         const dob = formatDateYMD(d);
  //         setPatientData({
  //             ...patientData,
  //             dob,
  //             age: computeAgeYears(dob),
  //             // clear month/day-of-month when using months-only input
  //             birthMonth: "",
  //             birthDay: "",
  //         });
  //     }
  // };

  // const handleAgeDaysOnlyChange = (val: string) => {
  //     const sanitized = val.replace(/[^0-9]/g, "");
  //     setAgeDaysOnly(sanitized);
  //     setAgeMonthsOnly("");
  //     if (sanitized === "") return;
  //     const days = parseInt(sanitized, 10);
  //     if (!isNaN(days)) {
  //         const d = new Date();
  //         d.setHours(0, 0, 0, 0);
  //         d.setDate(d.getDate() - days);
  //         const dob = formatDateYMD(d);
  //         setPatientData({
  //             ...patientData,
  //             dob,
  //             age: computeAgeYears(dob),
  //             birthMonth: "",
  //             birthDay: "",
  //         });
  //     }
  // };

  useEffect(() => {
    // if (true) {
    if (serverAPI.getToken()) {
      (async () => {
        try {
          loadAppointmentData(setAppointmentList);
          const resConsultant = await serverAPI.post<IConsultantListRes>(
            API_URL.consultant.list,
            {
              pageNumber: 1,
              pageSize: 10,
            }
          );

          if (resConsultant?.data) {
            const consultantData = resConsultant.data;
            if (consultantData?.items) {
              setDoctorList(
                consultantData.items.map((d) => ({
                  value: `${d.id}`,
                  title: `${d.firstName} ${d.lastName}`,
                }))
              );
            }
          }
          console.log(resConsultant.data);
        } catch (e) {
          console.log(e);
        }
      })();
    }
  }, [user?.user?.accessToken]);

  const handlePatientSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    console.log("Patient Data:", patientData);
    const sendData = {
      phoneNumber: patientData.phone,
      firstName: patientData.firstName,
      middleName: patientData.middleName,
      lastName: patientData.lastName,
      nic: patientData.nic,
      dateOfBirth: patientDob,
      gender: patientData.gender,
      // patientCode: patientCode,
      userName: "sm@gmail.com",
    };

    try {
      // Check if we're updating an existing patient or creating a new one
      if (selectedPatient && selectedPatient.id) {
        // Update existing patient
        const updateData = {
          ...sendData,
          patientId: selectedPatient.id,
          patientCode: selectedPatient.patientCode,
        };
        const res = await serverAPI.put<{ data: IPatientResponse }>(
          API_URL.patient.update,
          updateData
        );
        if (res?.data?.data) {
          setSelectedPatient(res.data.data);
          setAppointmentData((p) => ({
            ...p,
            patientCode: res.data.data.patientCode,
            patientName: `${res.data.data.firstName} ${res.data.data.lastName}`,
          }));
          showToast(
            "success",
            "Patient Updated",
            `${res.data.data.firstName} ${res.data.data.lastName} has been updated successfully!`
          );
        }
        console.log("Updated patient:", res.data);
      } else {
        // Create new patient
        const res = await serverAPI.post<{ data: IPatientResponse }>(
          API_URL.patient.create,
          sendData
        );
        if (res?.data?.data) {
          setSelectedPatient(res.data.data);
          setAppointmentData((p) => ({
            ...p,
            patientCode: res.data.data.patientCode,
            patientName: `${res.data.data.firstName} ${res.data.data.lastName}`,
          }));
          showToast(
            "success",
            "Patient Created",
            `${res.data.data.firstName} ${res.data.data.lastName} has been registered successfully!`
          );
        }
        console.log("Created patient:", res.data);
      }
    } catch (e) {
      console.log(e);
      showToast(
        "error",
        "Operation Failed",
        "Error saving patient data. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAppointmentSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    console.log("Appointment Data:", appointmentData);
    const sendData = {
      patientId: selectedPatient?.id,
      consultantId: appointmentData.doctor,
      // appointmentNo: '10',
      // appointmentNo: appointmentData.appoNo,
      isEmergency: appointmentData.emergency,
      appointmentStatus: "Pending",
      chargeOnSchedule: 1,
      chargeByDoctor: 2,
      totalCharge: 1000,
      userName: "amila",
    };

    try {
      const res = await serverAPI.post<IAppointmentCreateRes>(
        API_URL.appointment.create,
        sendData
      );
      console.log(res.data);
      if (res?.data?.data) {
        setAppointmentData((p) => ({
          ...p,
          appoNo: res.data.data?.appointmentNo ?? "",
        }));
        showToast(
          "success",
          "Appointment Created",
          `Appointment #${res.data.data.appointmentNo} has been booked successfully!`
        );
      }
      loadAppointmentData(setAppointmentList);
    } catch (e) {
      console.log(e);
      showToast(
        "error",
        "Booking Failed",
        "Error creating appointment. Please try again."
      );
    }
  };

  // const generatePatientCode = () => {
  //   const newCode = `100${Math.floor(1000 + Math.random() * 9000)}`;
  //   setPatientCode(newCode);
  //   setPatientData({ ...patientData });
  // };

  const handleResetForm = () => {
    // Clear all patient data
    setSelectedPatient(null);
    setPatientData({
      phone: "",
      firstName: "",
      middleName: "",
      lastName: "",
      nic: "",
      age: "",
      birthMonth: "",
      birthDay: "",
      dob: "",
      gender: "Male",
    });
    // setAgeMonthsOnly("");
    // setAgeDaysOnly("");
    // setPatientCode("");
    // Clear appointment data related to patient
    setAppointmentData((prev) => ({
      ...prev,
      patientCode: "",
      patientName: "",
    }));
  };

  const handleSelectPatient = (patient: IPatientResponse) => {
    setSelectedPatient(patient);

    const { years, months, days } = calculateAgeFromDOB(
      patient.dateOfBirth ?? ""
    );

    setPatientData({
      phone: patient.phoneNumber ?? "",
      firstName: patient.firstName ?? "",
      middleName: patient.middleName ?? "",
      lastName: patient.lastName ?? "",
      nic: patient.nic ?? "",
      age: years.toString(),
      birthMonth: months.toString(),
      birthDay: days.toString(),
      dob: patient.dateOfBirth ?? "",
      gender: patient.gender ?? "",
    });

    setYears(years);
    setMonths(months);
    setDays(days);
    // setPatientCode(patient.patientCode);
    setAppointmentData((prev) => ({
      ...prev,
      patientCode: patient.patientCode,
      patientName: `${patient.firstName} ${patient.lastName}`,
    }));
    setShowPatientModal(false);
  };

  const handlePhoneSearch = async (phoneNumber: string) => {
    // if (phoneNumber.length >= 10) {
    if (true) {
      try {
        const res = await serverAPI.post<IPatientResponse[]>(
          API_URL.patient.search,
          {
            type: "PhoneNumber",
            searchValue: phoneNumber,
          }
        );
        if (res?.data?.length) {
          setSearchResults(res.data);
          setShowPatientModal(true);
        }
        console.log(res.data);
      } catch (e) {
        console.log(e);
      }
    }
  };

  const handleNICSearch = async (nic: string) => {
    if (nic.length >= 10) {
      try {
        const res = await serverAPI.post<IPatientResponse[]>(
          API_URL.patient.search,
          {
            type: "NIC",
            searchValue: nic,
          }
        );
        if (res?.data?.length) {
          if (res.data.length === 1 && res.data[0]) {
            // If only one result, auto-select
            handleSelectPatient(res.data[0]);
          } else {
            // Multiple results, show modal
            setSearchResults(res.data);
            setShowPatientModal(true);
          }
        }
        console.log(res.data);
      } catch (e) {
        console.log(e);
      }
    }
  };

  const handleEditAppointment = (appointment: IAppointmentData) => {
    setEditingAppointment(appointment);
    setShowEditAppointmentModal(true);
  };

  const handleUpdateAppointment = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    if (!editingAppointment) return;

    setIsSubmitting(true);
    const sendData = {
      appointmentId: editingAppointment.id,
      patientId: editingAppointment.patientId,
      consultantId: editingAppointment.consultantId,
      appointmentNo: editingAppointment.appointmentNo,
      isEmergency: editingAppointment.isEmergency,
      appointmentStatus: editingAppointment.appointmentStatus,
      chargeOnSchedule: editingAppointment.chargeOnSchedule,
      chargeByDoctor: editingAppointment.chargeByDoctor,
      totalCharge: editingAppointment.totalCharge,
      userName: "amila",
    };

    try {
      const res = await serverAPI.put(API_URL.appointment.update, sendData);
      console.log("Appointment updated:", res.data);
      showToast(
        "success",
        "Appointment Updated",
        `Appointment #${editingAppointment.appointmentNo} has been updated successfully!`
      );
      setShowEditAppointmentModal(false);
      setEditingAppointment(null);
      loadAppointmentData(setAppointmentList);
    } catch (e) {
      console.log(e);
      showToast(
        "error",
        "Update Failed",
        "Error updating appointment. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 relative">
      {/* Toast Notifications Container */}
      <div className="fixed top-20 right-4 z-[60] space-y-3 max-w-md w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto animate-slideInRight bg-white rounded-xl shadow-2xl border-l-4 overflow-hidden"
            style={{
              borderLeftColor:
                toast.type === "success"
                  ? "#10b981"
                  : toast.type === "error"
                  ? "#ef4444"
                  : toast.type === "warning"
                  ? "#f59e0b"
                  : "#3b82f6",
            }}
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                    toast.type === "success"
                      ? "bg-green-100"
                      : toast.type === "error"
                      ? "bg-red-100"
                      : toast.type === "warning"
                      ? "bg-amber-100"
                      : "bg-blue-100"
                  }`}
                >
                  {toast.type === "success" && (
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                  {toast.type === "error" && (
                    <svg
                      className="w-6 h-6 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                  {toast.type === "warning" && (
                    <svg
                      className="w-6 h-6 text-amber-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  )}
                  {toast.type === "info" && (
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 mb-0.5">
                    {toast.title}
                  </h4>
                  <p className="text-xs text-gray-600">{toast.message}</p>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => removeToast(toast.id)}
                  className="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    toast.type === "success"
                      ? "bg-green-500"
                      : toast.type === "error"
                      ? "bg-red-500"
                      : toast.type === "warning"
                      ? "bg-amber-500"
                      : "bg-blue-500"
                  } animate-shrinkWidth`}
                  style={{ animationDuration: "5s" }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Blur Overlay - Only for content, not sidebar */}
      {(showPatientModal || showEditAppointmentModal) && (
        <div className="fixed top-16 left-0 right-0 bottom-0 lg:left-[258px] bg-black/30 backdrop-blur-sm z-40 transition-all duration-300"></div>
      )}

      {/* Patient Selection Modal - Compact Modern Design */}
      {showPatientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:ml-[258px]">
          <div
            className="absolute inset-0"
            onClick={() => setShowPatientModal(false)}
          ></div>

          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[75vh] overflow-hidden transform transition-all animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-sky-900 via-indigo-700 to-sky-800 px-5 py-3.5">
              <div className="absolute inset-0 opacity-40">
                <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-white/20 blur-3xl"></div>
                <div className="absolute left-16 -bottom-10 h-24 w-24 rounded-full bg-cyan-300/30 blur-2xl"></div>
              </div>
              <div className="absolute right-10 top-6 hidden rotate-12 text-white/15 sm:block">
                <svg
                  className="h-20 w-20"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M13 7h8m0 0v8m0-8l-9.5 9.5a5 5 0 01-7.07-7.07L9 4"
                  />
                </svg>
              </div>

              <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-white shadow-lg shadow-sky-900/30">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.1}
                        d="M9 17v-2a4 4 0 014-4h6m0 0l-2-2m2 2l-2 2M13 7h.01"
                      />
                    </svg>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-semibold text-white">
                        Patient Search Results
                      </h3>
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4"
                          />
                        </svg>
                        Instant Lookup
                      </span>
                    </div>
                    <p className="text-xs text-white/85">
                      Choose the correct patient profile before continuing with
                      registration.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium text-white">
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M3 5h12M9 3v2m-4 4h14M5 9v12m4-12v12m4-12v12m4 0h2a2 2 0 002-2V7a2 2 0 00-2-2h-2"
                          />
                        </svg>
                        {searchResults.length} match
                        {searchResults.length !== 1 ? "es" : ""} found
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium text-white/90">
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M12 4v5m0 7h.01M6.938 18.938a9 9 0 1110.124 0L12 22z"
                          />
                        </svg>
                        Tap a card to auto-fill details
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:items-center">
                  <div className="hidden sm:flex items-center rounded-xl border border-white/20 bg-white/10 p-2 pr-3 shadow-lg shadow-sky-900/30 backdrop-blur">
                    <div className="mr-2 flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-white/90">
                      <img
                        src="/assets/images/faces-clipart/pic-3.png"
                        alt="Patient illustration"
                        className="h-12 w-12 object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <div className="text-xs font-medium text-white/90">
                      <p className="uppercase tracking-wide text-white/80">
                        Smart Match
                      </p>
                      <p>Results blend phone & NIC history</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPatientModal(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
                    aria-label="Close patient search"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.1}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Compact Modal Body */}
            <div
              className="p-4 overflow-y-auto max-h-[calc(75vh-70px)] bg-gray-50"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#cbd5e1 #f1f5f9",
              }}
            >
              {searchResults.length > 0 ? (
                <div className="space-y-3">
                  {searchResults.map((patient, index) => (
                    <div
                      key={patient.id || index}
                      className="group relative bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-500 hover:shadow-lg cursor-pointer transition-all duration-200"
                      onClick={() => handleSelectPatient(patient)}
                    >
                      <div className="flex items-start gap-4">
                        {/* Gender Icon Avatar */}
                        <div className="flex-shrink-0">
                          <div className="relative">
                            {patient.gender?.toLowerCase() === "male" ? (
                              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                                <svg
                                  className="w-9 h-9 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                                </svg>
                              </div>
                            ) : (
                              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                                <svg
                                  className="w-9 h-9 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                                </svg>
                              </div>
                            )}
                            {patient.isNew && (
                              <div className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
                                NEW
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Compact Patient Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-base font-bold text-gray-900 truncate">
                                {patient.firstName} {patient.middleName}{" "}
                                {patient.lastName}
                              </h4>
                              <p className="text-sm font-semibold text-blue-600">
                                {patient.patientCode}
                              </p>
                            </div>
                            <button className="ml-3 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                              Select
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-xs text-gray-500 font-medium">
                                Phone
                              </p>
                              <p className="text-gray-900 font-medium">
                                {patient.phoneNumber}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">
                                NIC
                              </p>
                              <p className="text-gray-900 font-medium">
                                {patient.nic}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">
                                Date of Birth
                              </p>
                              <p className="text-gray-900 font-medium">
                                {new Date(
                                  patient.dateOfBirth ?? ""
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">
                                Gender
                              </p>
                              <div className="flex items-center gap-1">
                                {patient.gender?.toLowerCase() === "male" ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-100 text-blue-700">
                                    <svg
                                      className="w-3 h-3"
                                      fill="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
                                    </svg>
                                    Male
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-pink-100 text-pink-700">
                                    <svg
                                      className="w-3 h-3"
                                      fill="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
                                    </svg>
                                    Female
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Created Info */}
                          <div className="pt-3 mt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500">
                              Created by{" "}
                              <span className="font-medium">
                                {patient.createdBy}
                              </span>{" "}
                              on{" "}
                              {new Date(
                                patient.createdOn ?? ""
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-3">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-1">
                    No Patients Found
                  </h4>
                  <p className="text-sm text-gray-600">
                    Try searching with different criteria
                  </p>
                </div>
              )}
            </div>

            {/* Compact Footer */}
            <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <p className="text-xs text-gray-600">
                Click on a patient to select
              </p>
              <button
                onClick={() => setShowPatientModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Appointment Modal */}
      {showEditAppointmentModal && editingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:ml-[258px]">
          <div
            className="absolute inset-0"
            onClick={() => setShowEditAppointmentModal(false)}
          ></div>

          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[80vh] overflow-hidden transform transition-all animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 px-5 py-3.5">
              <div className="absolute inset-0 opacity-30">
                <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-white/20 blur-3xl"></div>
                <div className="absolute left-16 -bottom-10 h-24 w-24 rounded-full bg-yellow-300/30 blur-2xl"></div>
              </div>

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-white shadow-lg">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      Edit Appointment
                    </h3>
                    <p className="mt-0.5 text-xs text-orange-100">
                      Update appointment details for patient ID:{" "}
                      {editingAppointment.patientId}
                    </p>
                    <div className="mt-1.5">
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-2.5 py-0.5 text-[10px] font-medium text-white">
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        Appointment #{editingAppointment.appointmentNo}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditAppointmentModal(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
                  aria-label="Close edit modal"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.1}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-140px)]">
              <form onSubmit={handleUpdateAppointment} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Appointment Number
                    </label>
                    <input
                      type="text"
                      className="input-field bg-gray-50"
                      value={editingAppointment.appointmentNo}
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Patient ID
                    </label>
                    <input
                      type="text"
                      className="input-field bg-gray-50"
                      value={editingAppointment.patientId}
                      readOnly
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Consultant/Doctor
                  </label>
                  <select
                    className="input-field"
                    value={editingAppointment.consultantId}
                    onChange={(e) =>
                      setEditingAppointment({
                        ...editingAppointment,
                        consultantId: parseInt(e.target.value),
                      })
                    }
                  >
                    <option value="">Select Doctor</option>
                    {doctorList?.map((doctor) => (
                      <option key={doctor.value} value={doctor.value}>
                        {doctor.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Appointment Status
                  </label>
                  <select
                    className="input-field"
                    value={editingAppointment.appointmentStatus}
                    onChange={(e) =>
                      setEditingAppointment({
                        ...editingAppointment,
                        appointmentStatus: e.target.value,
                      })
                    }
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Schedule Charge
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      value={editingAppointment.chargeOnSchedule}
                      onChange={(e) =>
                        setEditingAppointment({
                          ...editingAppointment,
                          chargeOnSchedule: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Doctor Charge
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      value={editingAppointment.chargeByDoctor}
                      onChange={(e) =>
                        setEditingAppointment({
                          ...editingAppointment,
                          chargeByDoctor: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Total Charge
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      value={editingAppointment.totalCharge}
                      onChange={(e) =>
                        setEditingAppointment({
                          ...editingAppointment,
                          totalCharge: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2 w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                      checked={editingAppointment.isEmergency}
                      onChange={(e) =>
                        setEditingAppointment({
                          ...editingAppointment,
                          isEmergency: e.target.checked,
                        })
                      }
                    />
                    <span className="text-sm font-semibold text-gray-700">
                      Emergency Appointment
                    </span>
                  </label>
                </div>

                {/* Modal Footer */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-enhanced warning w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="w-5 h-5 animate-spin"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        Updating...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Update Appointment
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setShowEditAppointmentModal(false)}
                    className="btn-enhanced outline-secondary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Registration Forms */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        {/* Patient Details Form */}
        <div className="relative group animate-fadeInUp h-full flex flex-col">
          {/* Card Glow Effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>

          <div className="relative card-enhanced bg-white border border-gray-100 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h4 className="text-xl font-bold text-gray-900">
                  Patient Details
                </h4>
                {selectedPatient && selectedPatient.id && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 animate-slideUp">
                    <svg
                      className="w-4 h-4 mr-1.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit Mode
                  </span>
                )}
              </div>
              {selectedPatient && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 animate-slideUp">
                  <svg
                    className="w-4 h-4 mr-1 animate-pulse"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Patient Selected
                </span>
              )}
            </div>

            {/* Profile Image and Patient Code Section */}
            {/* <div className="mb-4 flex items-center space-x-2">
                        <input
                            type="text"
                            className="input-enhanced flex-1"
                            value={patientCode}
                            placeholder="Patient Code"
                            readOnly
                        />
                        <button
                            onClick={generatePatientCode}
                            className="btn-enhanced max-w-fit primary h-[53px]"
                        >
                            Generate Code
                        </button>
                    </div> */}
            <p className="text-sm text-gray-600 mb-4">Auto Gen</p>

            {selectedPatient && (
              <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg animate-slideUp shadow-md hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                      <svg
                        className="w-7 h-7 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-blue-700 mb-0.5">
                      ✓ Patient Selected
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {selectedPatient.phoneNumber} • {selectedPatient.nic}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form
              onSubmit={handlePatientSubmit}
              className="space-y-4 flex-1 flex flex-col"
            >
              <div className="flex-1 space-y-4">
                <div className="input-group-enhanced">
                  <label className="flex items-center gap-1.5">
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      className="input-enhanced pl-10"
                      value={patientData.phone}
                      onChange={(e) =>
                        setPatientData({
                          ...patientData,
                          phone: e.target.value,
                        })
                      }
                      onBlur={(e) => handlePhoneSearch(e.target.value)}
                      placeholder="Enter phone number"
                    />
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                </div>

                <div className="input-group-enhanced">
                  <label className="flex items-center gap-1.5">
                    <svg
                      className="w-4 h-4 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Patient Name
                  </label>
                  <input
                    type="text"
                    className="input-enhanced"
                    value={patientData.firstName}
                    onChange={(e) =>
                      setPatientData({
                        ...patientData,
                        firstName: e.target.value,
                      })
                    }
                    placeholder="Patient name"
                  />
                </div>
                {/*<div className="input-group-enhanced">*/}
                {/*    <label className="flex items-center gap-1.5">*/}
                {/*        <svg*/}
                {/*            className="w-4 h-4 text-indigo-600"*/}
                {/*            fill="none"*/}
                {/*            stroke="currentColor"*/}
                {/*            viewBox="0 0 24 24"*/}
                {/*        >*/}
                {/*            <path*/}
                {/*                strokeLinecap="round"*/}
                {/*                strokeLinejoin="round"*/}
                {/*                strokeWidth={2}*/}
                {/*                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"*/}
                {/*            />*/}
                {/*        </svg>*/}
                {/*        Patient Middle Name*/}
                {/*    </label>*/}
                {/*    <input*/}
                {/*        type="text"*/}
                {/*        className="input-enhanced"*/}
                {/*        value={patientData.middleName}*/}
                {/*        onChange={(e) =>*/}
                {/*            setPatientData({*/}
                {/*                ...patientData,*/}
                {/*                middleName: e.target.value,*/}
                {/*            })*/}
                {/*        }*/}
                {/*        placeholder="Middle name"*/}
                {/*    />*/}
                {/*</div>*/}
                {/*<div className="input-group-enhanced">*/}
                {/*    <label className="flex items-center gap-1.5">*/}
                {/*        <svg*/}
                {/*            className="w-4 h-4 text-indigo-600"*/}
                {/*            fill="none"*/}
                {/*            stroke="currentColor"*/}
                {/*            viewBox="0 0 24 24"*/}
                {/*        >*/}
                {/*            <path*/}
                {/*                strokeLinecap="round"*/}
                {/*                strokeLinejoin="round"*/}
                {/*                strokeWidth={2}*/}
                {/*                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"*/}
                {/*            />*/}
                {/*        </svg>*/}
                {/*        Patient Last Name*/}
                {/*    </label>*/}
                {/*    <input*/}
                {/*        type="text"*/}
                {/*        className="input-enhanced"*/}
                {/*        value={patientData.lastName}*/}
                {/*        onChange={(e) =>*/}
                {/*            setPatientData({*/}
                {/*                ...patientData,*/}
                {/*                lastName: e.target.value,*/}
                {/*            })*/}
                {/*        }*/}
                {/*        placeholder="Last name"*/}
                {/*    />*/}
                {/*</div>*/}

                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
                    <svg
                      className="w-4 h-4 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                      />
                    </svg>
                    NIC Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="input-field pl-10"
                      value={patientData.nic}
                      onChange={(e) =>
                        setPatientData({ ...patientData, nic: e.target.value })
                      }
                      onBlur={(e) => handleNICSearch(e.target.value)}
                      placeholder="Enter NIC number"
                    />
                    {/* <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                      />
                    </svg> */}
                  </div>
                </div>

                {/*<div>*/}
                {/*    <label className="block text-sm font-semibold text-gray-700 mb-1">*/}
                {/*        Age*/}
                {/*    </label>*/}
                {/*    <input*/}
                {/*        type="number"*/}
                {/*        className="input-field"*/}
                {/*        value={patientData.age}*/}
                {/*        onChange={(e) =>*/}
                {/*            setPatientData({...patientData, age: e.target.value})*/}
                {/*        }*/}
                {/*        placeholder="Age"*/}
                {/*    />*/}
                {/*</div>*/}

                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
                    <svg
                      className="w-4 h-4 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Date of Birth Information
                  </label>

                  {/* Age Grid (Years, Months, Days in same row) */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* Age Input */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Age (Years)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          className="input-field pl-8 text-sm"
                          value={years ?? ""}
                          onChange={(e) =>
                            setYears(
                              e.target.value
                                ? Number(e.target.value)
                                : undefined
                            )
                          }
                          placeholder="Age"
                          min="0"
                          max="150"
                        />
                        {/* <svg
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg> */}
                      </div>
                    </div>

                    {/* Age in Months */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Age (Months)
                      </label>
                      <input
                        type="number"
                        min={0}
                        className="input-field text-sm"
                        value={months ?? ""}
                        onChange={(e) =>
                          setMonths(
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                        placeholder="Months"
                      />
                    </div>

                    {/* Age in Days */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Age (Days)
                      </label>
                      <input
                        type="number"
                        min={0}
                        className="input-field text-sm"
                        value={days ?? ""}
                        onChange={(e) =>
                          setDays(
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                        placeholder="Days"
                      />
                    </div>
                  </div>

                  {/* Birth Date Display */}
                  {patientDob && (
                    <div className="mt-2 p-2.5 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg">
                      <p className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {
                          <>
                            Date of Birth:{" "}
                            {new Date(patientDob).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </>
                        }
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    className="input-field"
                    value={patientData.gender}
                    onChange={(e) =>
                      setPatientData({ ...patientData, gender: e.target.value })
                    }
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>

                {/*<div>*/}
                {/*    <label className="block text-sm font-semibold text-gray-700 mb-1">*/}
                {/*        Civil Status*/}
                {/*    </label>*/}
                {/*    <select*/}
                {/*        className="input-field"*/}
                {/*        value={patientData.civilStatus}*/}
                {/*        onChange={(e) =>*/}
                {/*            setPatientData({*/}
                {/*                ...patientData,*/}
                {/*                civilStatus: e.target.value,*/}
                {/*            })*/}
                {/*        }*/}
                {/*    >*/}
                {/*        <option>Married</option>*/}
                {/*        <option>Unmarried</option>*/}
                {/*        <option>N/A</option>*/}
                {/*    </select>*/}
                {/*</div>*/}

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-enhanced primary w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="w-5 h-5 animate-spin"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        Processing...
                      </>
                    ) : selectedPatient && selectedPatient.id ? (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        Update Patient
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Create Patient
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    className="btn-enhanced outline-secondary w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleResetForm}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Reset
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* OPD Booking Form */}
        <div
          className="relative group animate-fadeInUp h-full flex flex-col"
          style={{ animationDelay: "0.1s" }}
        >
          {/* Card Glow Effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>

          <div className="relative card bg-white border border-gray-100 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex-1 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-gray-900">OPD Booking</h4>
            </div>

            {/* Appointment Number Display - Compact */}
            <div className="relative mb-4 overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 p-4 shadow-lg">
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full blur-2xl animate-pulse"></div>
                <div
                  className="absolute bottom-0 left-0 w-16 h-16 bg-white rounded-full blur-xl animate-pulse"
                  style={{ animationDelay: "1s" }}
                ></div>
              </div>

              <div className="relative text-center">
                <p className="text-xs font-semibold text-white/90 mb-1 uppercase tracking-wide">
                  Appointment No
                </p>
                <div className="relative inline-block">
                  <input
                    type="text"
                    className="bg-transparent border-none text-4xl font-black text-white text-center w-full focus:outline-none tracking-wider drop-shadow-lg"
                    value={appointmentData.appoNo}
                    readOnly
                    style={{ textShadow: "0 2px 10px rgba(0,0,0,0.3)" }}
                  />
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-semibold text-white border border-white/30 mt-1">
                  <svg
                    className="w-2.5 h-2.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Auto Gen
                </span>
              </div>
            </div>

            <div className="mb-4">
              <input
                type="text"
                className="input-field"
                placeholder="Patient Code"
                value={appointmentData.patientCode}
                onChange={(e) =>
                  setAppointmentData({
                    ...appointmentData,
                    patientCode: e.target.value,
                  })
                }
              />
              <p className="text-sm text-gray-600 mt-1">Auto Fill</p>
            </div>

            <form
              onSubmit={handleAppointmentSubmit}
              className="space-y-4 flex-1 flex flex-col"
            >
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Patient Name
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={appointmentData.patientName}
                    onChange={(e) =>
                      setAppointmentData({
                        ...appointmentData,
                        patientName: e.target.value,
                      })
                    }
                    placeholder="Auto Fill"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Doctor
                  </label>
                  <select
                    className="input-field"
                    value={appointmentData.doctor}
                    onChange={(e) =>
                      setAppointmentData({
                        ...appointmentData,
                        doctor: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Doctor</option>
                    {doctorList?.map((doctor) => (
                      <option key={doctor.value} value={doctor.value}>
                        {doctor.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Note
                  </label>
                  <textarea
                    className="input-field"
                    rows={10}
                    value={appointmentData.note}
                    onChange={(e) =>
                      setAppointmentData({
                        ...appointmentData,
                        note: e.target.value,
                      })
                    }
                  ></textarea>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={appointmentData.emergency}
                      onChange={(e) =>
                        setAppointmentData({
                          ...appointmentData,
                          emergency: e.target.checked,
                        })
                      }
                    />
                    <span className="text-sm font-semibold">Emergency</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  className="btn-enhanced success w-full sm:w-auto"
                >
                  Add
                </button>
                <button
                  type="button"
                  className="btn-enhanced outline-secondary w-full sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Queue Details Table */}
      <div
        className="relative group animate-fadeInUp"
        style={{ animationDelay: "0.2s" }}
      >
        {/* Card Glow Effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>

        <div className="relative card-enhanced bg-white border border-gray-100 transition-all duration-300 hover:shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h4 className="text-xl font-bold text-gray-900">Queue Details</h4>
          </div>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-full">
              <thead className="bg-gradient-to-r from-indigo-600 to-purple-600">
                <tr>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
                    P_Code
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
                    Appo No.
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
                    Doctor
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
                    Created By
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
                    Created No
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
                    Service State
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {appointmentList?.map((item, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200"
                  >
                    <td className="px-4 sm:px-6 py-4 font-semibold text-indigo-900 whitespace-nowrap">
                      {item.patientId}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-800 font-medium text-sm">
                        {item.appointmentNo}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-gray-700 font-medium whitespace-nowrap">
                      {item.chargeByDoctor}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-gray-600 whitespace-nowrap">
                      {item.createdBy}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-gray-600 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {`${item.createdOn}`.split("T")[0]}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-sm bg-${stateColorSelector(
                          item.appointmentStatus ?? ""
                        )} text-white`}
                      >
                        {item.appointmentStatus}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <button
                        className="btn-enhanced warning text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                        onClick={() => handleEditAppointment(item)}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Channel;
