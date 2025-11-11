import { useEffect, useRef, useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { serverAPI } from "../api";
import { API_URL } from "../api/url";
import { useSelector } from "react-redux";
import { authUserSelector } from "../redux/slice/user-slice";
import { getDOBAndAge } from "./Channel";
import type {
  IConsultantListRes,
  IPatientResponse,
  IAppointmentData,
  IAppointmentListRes,
  IAppointmentCreateRes,
  PatientSearchType,
} from "../types";
import { calculateAgeFromDOB } from "../libs/agecal.ts";

type ReceiptSummary = {
  appointmentNo?: string;
  patientName?: string;
  patientCode?: string;
  doctorName?: string;
  status?: string;
  totalCharge?: number;
};

type ReceiptPdfPayload = {
  appointment: IAppointmentData;
  patient: IPatientResponse | null;
  doctorName: string;
  userLabel: string;
};

const CODE39_PATTERNS: Record<string, Array<1 | 2>> = {
  "0": [1, 1, 1, 2, 2, 1, 2, 1, 1],
  "1": [2, 1, 1, 2, 1, 1, 1, 1, 2],
  "2": [1, 1, 2, 2, 1, 1, 1, 1, 2],
  "3": [2, 1, 2, 2, 1, 1, 1, 1, 1],
  "4": [1, 1, 1, 2, 2, 1, 1, 1, 2],
  "5": [2, 1, 1, 2, 2, 1, 1, 1, 1],
  "6": [1, 1, 2, 2, 2, 1, 1, 1, 1],
  "7": [1, 1, 1, 2, 1, 1, 2, 1, 2],
  "8": [2, 1, 1, 2, 1, 1, 2, 1, 1],
  "9": [1, 1, 2, 2, 1, 1, 2, 1, 1],
  A: [2, 1, 1, 1, 1, 2, 1, 1, 2],
  B: [1, 1, 2, 1, 1, 2, 1, 1, 2],
  C: [2, 1, 2, 1, 1, 2, 1, 1, 1],
  D: [1, 1, 1, 1, 2, 2, 1, 1, 2],
  E: [2, 1, 1, 1, 2, 2, 1, 1, 1],
  F: [1, 1, 2, 1, 2, 2, 1, 1, 1],
  G: [1, 1, 1, 1, 1, 2, 2, 1, 2],
  H: [2, 1, 1, 1, 1, 2, 2, 1, 1],
  I: [1, 1, 2, 1, 1, 2, 2, 1, 1],
  J: [1, 1, 1, 1, 2, 2, 2, 1, 1],
  K: [2, 1, 1, 1, 1, 1, 1, 2, 2],
  L: [1, 1, 2, 1, 1, 1, 1, 2, 2],
  M: [2, 1, 2, 1, 1, 1, 1, 2, 1],
  N: [1, 1, 1, 1, 2, 1, 1, 2, 2],
  O: [2, 1, 1, 1, 2, 1, 1, 2, 1],
  P: [1, 1, 2, 1, 2, 1, 1, 2, 1],
  Q: [1, 1, 1, 1, 1, 1, 2, 2, 2],
  R: [2, 1, 1, 1, 1, 1, 2, 2, 1],
  S: [1, 1, 2, 1, 1, 1, 2, 2, 1],
  T: [1, 1, 1, 1, 2, 1, 2, 2, 1],
  U: [2, 2, 1, 1, 1, 1, 1, 1, 2],
  V: [1, 2, 2, 1, 1, 1, 1, 1, 2],
  W: [2, 2, 2, 1, 1, 1, 1, 1, 1],
  X: [1, 2, 1, 1, 2, 1, 1, 1, 2],
  Y: [2, 2, 1, 1, 2, 1, 1, 1, 1],
  Z: [1, 2, 2, 1, 2, 1, 1, 1, 1],
  "-": [1, 2, 1, 1, 1, 1, 2, 1, 2],
  ".": [2, 2, 1, 1, 1, 1, 2, 1, 1],
  " ": [1, 2, 2, 1, 1, 1, 2, 1, 1],
  $: [1, 2, 1, 2, 1, 2, 1, 1, 1],
  "/": [1, 2, 1, 2, 1, 1, 1, 2, 1],
  "+": [1, 2, 1, 1, 1, 2, 1, 2, 1],
  "%": [1, 1, 1, 2, 1, 2, 1, 2, 1],
  "*": [1, 2, 1, 1, 2, 1, 2, 1, 1],
};

const QuickAppointment = () => {
  const user = useSelector(authUserSelector);

  const [doctors, setDoctors] = useState<
    Array<{ value: string; title: string }>
  >([]);
  const [appointments, setAppointments] = useState<IAppointmentData[]>([]);
  const [patientNameMap, setPatientNameMap] = useState<Record<number, string>>(
    {}
  );
  const [nextAppoNo, setNextAppoNo] = useState<string>("—");

  // Top bar UX (as per mock): patient code entry that triggers search, and patient name auto-fill
  const [patientCodeEntry, setPatientCodeEntry] = useState("");
  const [searchType] = useState<PatientSearchType>("PatientCode");
  const [searchValue, setSearchValue] = useState("");
  const [selectedPatient, setSelectedPatient] =
    useState<IPatientResponse | null>(null);
  const lastQueryRef = useRef<{
    type: PatientSearchType;
    value: string;
  } | null>(null);
  const receiptFrameRef = useRef<HTMLIFrameElement | null>(null);

  const [doctorId, setDoctorId] = useState<string>("");
  const [isEmergency, setIsEmergency] = useState(false);
  const [isOpenPatientModal, setIsOpenPatientModal] = useState(false);
  const [results, setResults] = useState<IPatientResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Age inputs for DOB (like Channel)
  const [years, setYears] = useState<number | undefined>();
  const [months, setMonths] = useState<number | undefined>();
  const [days, setDays] = useState<number | undefined>();
  const [patientModalMode, setPatientModalMode] = useState<
    "new" | "select" | "edit"
  >("new");

  // Edit Appointment modal state (reusing Channel page UX)
  const [showEditAppointmentModal, setShowEditAppointmentModal] =
    useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<IAppointmentData | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptPdfUrl, setReceiptPdfUrl] = useState<string | null>(null);
  const [receiptGenerating, setReceiptGenerating] = useState(false);
  const [receiptSummary, setReceiptSummary] = useState<ReceiptSummary | null>(
    null
  );

  // Simple patient form state (create/update)
  const [patientForm, setPatientForm] = useState({
    phoneNumber: "",
    nic: "",
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "Male",
    dateOfBirth: "", // yyyy-MM-dd
  });

  const formatPatientName = (patient?: IPatientResponse | null) => {
    if (!patient) return "";
    const parts = [patient.firstName, patient.middleName, patient.lastName]
      .filter(Boolean)
      .map((p) => String(p).trim());
    const full = parts.join(" ").trim();
    if (full) return full;
    return patient.patientCode
      ? `Patient ${patient.patientCode}`
      : patient.id
      ? `Patient #${patient.id}`
      : "";
  };

  const formatCurrency = (amount?: number | null) => {
    const parsed =
      typeof amount === "number" && Number.isFinite(amount)
        ? amount
        : Number(amount ?? 0);
    const value = Number.isFinite(parsed) ? parsed : 0;
    return value.toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const extractTokenNumber = (raw?: string | null) => {
    if (!raw) return "";
    const parts = String(raw).split("-").filter(Boolean);
    if (!parts.length) return raw;
    return parts[parts.length - 1];
  };

  const updateReceiptPdfUrl = (nextUrl: string | null) => {
    setReceiptPdfUrl((prev) => {
      if (prev && prev !== nextUrl) {
        URL.revokeObjectURL(prev);
      }
      return nextUrl;
    });
  };

  const handleCloseReceiptModal = () => {
    setShowReceiptModal(false);
    setReceiptSummary(null);
    setReceiptGenerating(false);
    updateReceiptPdfUrl(null);
  };

  const createReceiptPdfUrl = async ({
    appointment,
    patient,
    doctorName,
    userLabel,
  }: ReceiptPdfPayload) => {
    const pdfDoc = await PDFDocument.create();
    // 80mm POS roll width (common thermal printer) in points with extra height.
    const POS_WIDTH = 226.77; // 80mm
    const POS_HEIGHT = 640; // ~10 inches to accommodate details
    const page = pdfDoc.addPage([POS_WIDTH, POS_HEIGHT]);
    const { width, height } = page.getSize();

    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const accent = rgb(0.062, 0.549, 0.463);
    const dark = rgb(0.16, 0.16, 0.16);
    const light = rgb(0.65, 0.65, 0.65);
    const margin = 18;
    let cursorY = height - margin;
    const centerX = width / 2;

    const patientName = formatPatientName(patient) || "N/A";
    const issuedByUser =
      (user?.user as any)?.username || (user?.user as any)?.email || userLabel;
    const appointmentDate = appointment.appointmentDate
      ? new Date(appointment.appointmentDate)
      : new Date();
    const appointmentTime = appointmentDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const appointmentDay = appointmentDate.toLocaleDateString();
    const tokenRaw =
      appointment.appointmentNo ||
      appointment.appointmentCode ||
      `${appointment.id ?? "N/A"}`;
    const tokenNo = extractTokenNumber(tokenRaw) || tokenRaw;
    const queueText = appointment.isEmergency ? "EMERGENCY" : "REGULAR";
    const generatedOn = new Date().toLocaleString();

    const drawCentered = (
      text: string,
      size: number,
      font = regularFont,
      color = dark,
      offsetY = 0
    ) => {
      const textWidth = font.widthOfTextAtSize(text, size);
      page.drawText(text, {
        x: centerX - textWidth / 2,
        y: cursorY + offsetY,
        size,
        font,
        color,
      });
      cursorY -= size + 4;
    };

    const drawDivider = (offset = 10) => {
      page.drawLine({
        start: { x: margin, y: cursorY },
        end: { x: width - margin, y: cursorY },
        thickness: 0.8,
        color: light,
      });
      cursorY -= offset;
    };

    const drawDetailRow = (label: string, value: string) => {
      page.drawText(label.toUpperCase(), {
        x: margin,
        y: cursorY,
        size: 8.5,
        font: regularFont,
        color: light,
      });
      const valWidth = boldFont.widthOfTextAtSize(value, 11);
      page.drawText(value, {
        x: width - margin - valWidth,
        y: cursorY,
        size: 11,
        font: boldFont,
        color: dark,
      });
      cursorY -= 16;
    };

    const drawCode39 = (
      value: string,
      startY: number,
      topLabel?: string,
      bottomLabel?: string
    ) => {
      if (!value) return;
      const sanitized = value
        .toUpperCase()
        .replace(/[^0-9A-Z\-.\s\$\/\+%]/g, "-");
      const content = `*${sanitized}*`;
      const narrow = 1.3;
      const wide = narrow * 2.4;
      const barHeight = 42;
      const totalWidth = content.split("").reduce((total, ch, idx) => {
        const pattern = CODE39_PATTERNS[ch] || CODE39_PATTERNS["-"];
        const patternWidth =
          pattern?.reduce(
            (sum, unit) => sum + (unit === 1 ? narrow : wide),
            0
          ) || 0;
        const gap = idx < content.length - 1 ? narrow : 0;
        return total + patternWidth + gap;
      }, 0);
      let cursorX = centerX - totalWidth / 2;

      if (topLabel) {
        const topWidth = boldFont.widthOfTextAtSize(topLabel, 12);
        page.drawText(topLabel, {
          x: centerX - topWidth / 2,
          y: startY + barHeight + 8,
          size: 12,
          font: boldFont,
          color: dark,
        });
      }

      for (const ch of content) {
        const pattern = CODE39_PATTERNS[ch] || CODE39_PATTERNS["-"];
        pattern?.forEach((unit, idx) => {
          const isBar = idx % 2 === 0;
          const widthUnit = unit === 1 ? narrow : wide;
          if (isBar) {
            page.drawRectangle({
              x: cursorX,
              y: startY,
              width: widthUnit,
              height: barHeight,
              color: dark,
            });
          }
          cursorX += widthUnit;
        });
        cursorX += narrow;
      }

      if (bottomLabel) {
        const labelWidth = regularFont.widthOfTextAtSize(bottomLabel, 10);
        page.drawText(bottomLabel, {
          x: centerX - labelWidth / 2,
          y: startY - 12,
          size: 10,
          font: regularFont,
          color: dark,
        });
      }
    };

    drawCentered("HM HOSPITAL", 14, boldFont, accent);
    cursorY -= 4;
    drawCentered("OPD TOKEN", 11, boldFont, dark);
    drawCentered(
      queueText,
      10,
      boldFont,
      appointment.isEmergency ? rgb(0.78, 0.1, 0.1) : accent
    );
    cursorY -= 2;
    drawDivider(4);
    cursorY -= 12;

    drawDetailRow("Patient Name", patientName);
    drawDetailRow(
      "Doctor",
      doctorName || `Consultant #${appointment.consultantId}`
    );
    drawDetailRow("Date", appointmentDay);
    drawDetailRow("Time", appointmentTime);
    drawDetailRow("Issued By", issuedByUser);

    cursorY -= 12;
    drawDivider();

    if (patient?.patientCode) {
      cursorY -= 18;
      drawCentered(`#${tokenNo}`, 18, boldFont, dark);
      cursorY -= 8;
      drawDivider(8);
      cursorY -= 12;
      const barcodeY = cursorY - 45;
      drawCode39(patient.patientCode, barcodeY, undefined, patient.patientCode);
      cursorY = barcodeY - 26;
    }

    cursorY -= 8;
    page.drawText(`Printed at ${generatedOn}`, {
      x: margin,
      y: cursorY,
      size: 8,
      font: regularFont,
      color: light,
    });

    const pdfBytes = await pdfDoc.save();
    const pdfCopy = pdfBytes.slice();
    const blob = new Blob([pdfCopy.buffer as ArrayBuffer], {
      type: "application/pdf",
    });
    return URL.createObjectURL(blob);
  };

  const showReceiptForAppointment = async (
    appointment: IAppointmentData,
    doctorValue: string,
    patientSnapshot: IPatientResponse | null
  ) => {
    const doctorName =
      doctors.find((d) => d.value === doctorValue)?.title ||
      `Consultant #${appointment.consultantId}`;
    const summary: ReceiptSummary = {
      appointmentNo:
        appointment.appointmentNo || appointment.appointmentCode || undefined,
      patientName: formatPatientName(patientSnapshot) || undefined,
      patientCode: patientSnapshot?.patientCode,
      doctorName,
      status: appointment.appointmentStatus ?? "Pending",
      totalCharge: appointment.totalCharge ?? 0,
    };
    setReceiptSummary(summary);
    setShowReceiptModal(true);
    setReceiptGenerating(true);
    updateReceiptPdfUrl(null);

    const userLabel =
      user?.user?.consultantId != null
        ? `Consultant #${user.user.consultantId}`
        : "Quick Appointment Desk";
    try {
      const url = await createReceiptPdfUrl({
        appointment,
        doctorName,
        patient: patientSnapshot,
        userLabel,
      });
      updateReceiptPdfUrl(url);
    } catch (error) {
      console.log(error);
    } finally {
      setReceiptGenerating(false);
    }
  };

  const handlePrintReceipt = () => {
    const iframe = receiptFrameRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      return;
    }
    if (receiptPdfUrl) {
      window.open(receiptPdfUrl, "_blank", "noopener");
    }
  };

  const handleOpenReceiptInNewTab = () => {
    if (receiptPdfUrl) {
      window.open(receiptPdfUrl, "_blank", "noopener");
    }
  };

  // Sync patientForm.dateOfBirth when AGE fields change (like Channel)
  useEffect(() => {
    const { dob } = getDOBAndAge({ mode: "AGE", years, months, days });
    if (dob) {
      setPatientForm((prev) => ({ ...prev, dateOfBirth: dob }));
    }
  }, [years, months, days]);

  useEffect(() => {
    return () => {
      if (receiptPdfUrl) {
        URL.revokeObjectURL(receiptPdfUrl);
      }
    };
  }, [receiptPdfUrl]);

  const loadDoctors = async () => {
    try {
      const res = await serverAPI.post<IConsultantListRes>(
        API_URL.consultant.list,
        {
          pageNumber: 1,
          pageSize: 50,
        }
      );
      if (res?.data?.items) {
        setDoctors(
          res.data.items.map((d) => ({
            value: String(d.id),
            title: `${d.firstName} ${d.lastName}`,
          }))
        );
      }
    } catch (e) {
      console.log(e);
    }
  };

  // Commented out for future use
  /*
  const _computeNext = (items: IAppointmentData[]) => {
    if (!items || items.length === 0) return "001";
    // Extract numeric part and compute max
    const parsed = items
      .map((a) => a.appointmentNo)
      .filter(Boolean)
      .map((s) => {
        const onlyDigits = String(s).replace(/\D/g, "");
        return {
          raw: String(s),
          num: parseInt(onlyDigits || "0", 10),
          len: String(s).length,
        };
      });
    if (parsed.length === 0) return "001";
    const max = parsed.reduce((m, c) => (c.num > m.num ? c : m));
    const next = (max.num + 1).toString().padStart(max.len, "0");
    return next;
  };
  */

  const loadAppointments = async () => {
    try {
      const res = await serverAPI.post<IAppointmentListRes>(
        API_URL.appointment.list,
        {
          pageNumber: 1,
          pageSize: 20,
        }
      );
      if (res?.data?.items) {
        setAppointments(res.data.items);
        serverAPI
          .get(API_URL.appointment.nextAppoinmentNo)
          .then((d) => {
            console.log(d);
            setNextAppoNo(d.data as string);
          })
          .catch((e) => {
            console.log(e);
          });
      } else {
        setNextAppoNo("001");
      }
    } catch (e) {
      console.log(e);
    }
  };

  // Extract clean appointment number and any appended patient name suffix
  const splitApptNoAndName = (raw: string | undefined | null) => {
    const val = String(raw ?? "").trim();
    if (!val) return { apptNo: "", nameSuffix: "" };
    const m = val.match(/^([A-Za-z]+-\d{6,}-\d+)(.*)$/);
    if (m && m[1]) {
      return { apptNo: m[1].trim(), nameSuffix: (m[2] ?? "").trim() };
    }
    return { apptNo: val, nameSuffix: "" };
  };

  // Fetch and cache patient names for given appointments
  const ensurePatientNames = async (items: IAppointmentData[]) => {
    const uniqueIds = Array.from(
      new Set(items.map((a) => a.patientId).filter(Boolean))
    );
    const missing = uniqueIds.filter((id) => !(id in patientNameMap));
    if (missing.length === 0) return;
    try {
      const results = await Promise.all(
        missing.map(async (id) => {
          try {
            const res = await serverAPI.get<any>(
              `${API_URL.patient.get}?patientId=${id}`
            );
            const payload = (res as any).data;
            const p: IPatientResponse | undefined = payload?.data ?? payload;
            const name = p
              ? `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim()
              : `Patient #${id}`;
            return { id, name };
          } catch (e) {
            console.log(e);
            return { id, name: `Patient #${id}` };
          }
        })
      );
      if (results && results.length) {
        setPatientNameMap((prev) => {
          const next = { ...prev };
          for (const r of results) next[r.id] = r.name;
          return next;
        });
      }
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    if (!serverAPI.getToken()) return;
    loadDoctors();
    loadAppointments();
  }, [user?.user?.accessToken]);

  useEffect(() => {
    if (appointments?.length) {
      void ensurePatientNames(appointments);
    }
  }, [appointments]);

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
      await serverAPI.put(API_URL.appointment.update, sendData);
      setShowEditAppointmentModal(false);
      setEditingAppointment(null);
      await loadAppointments();
    } catch (e) {
      console.log(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const searchPatients = async (type: PatientSearchType, value: string) => {
    if (!value || value.trim().length < 3) return;
    setLoading(true);
    try {
      const res = await serverAPI.post<IPatientResponse[]>(
        API_URL.patient.search,
        {
          type,
          searchValue: value.trim(),
        }
      );
      setResults(res?.data || []);
      setPatientModalMode("select");
      setIsOpenPatientModal(true);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  // Auto open modal + search as user types in generic search (kept for internal use)
  useEffect(() => {
    const t = setTimeout(() => {
      const trimmed = searchValue.trim();
      const meets = (() => {
        if (!trimmed) return false;
        switch (searchType) {
          case "PhoneNumber":
            return trimmed.replace(/\D/g, "").length >= 9;
          case "NIC":
            return trimmed.length >= 10;
          default:
            return trimmed.length >= 3;
        }
      })();

      if (!meets) return;

      const prev = lastQueryRef.current;
      if (prev && prev.type === searchType && prev.value === trimmed) return;
      lastQueryRef.current = { type: searchType, value: trimmed };
      searchPatients(searchType, trimmed);
    }, 550);
    return () => clearTimeout(t);
  }, [searchType, searchValue]);

  // Debounced search for Patient Code field specifically (mimic barcode/enter)
  useEffect(() => {
    if (!patientCodeEntry) return;
    const t = setTimeout(() => {
      const code = patientCodeEntry.trim();
      if (code.length >= 3) {
        lastQueryRef.current = { type: "PatientCode", value: code };
        searchPatients("PatientCode", code);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [patientCodeEntry]);

  const handleBook = async () => {
    if (!selectedPatient?.id || !doctorId) return;
    const patientSnapshot = selectedPatient;
    setSubmitting(true);
    try {
      const res = await serverAPI.post<IAppointmentCreateRes>(
        API_URL.appointment.create,
        {
          patientId: selectedPatient.id,
          consultantId: Number(doctorId),
          isEmergency,
          appointmentStatus: "Pending",
          chargeOnSchedule: 1,
          chargeByDoctor: 2,
          totalCharge: 1000,
          userName: "amila",
        }
      );
      if (res?.data?.data) {
        // Refresh list and clear selections
        void loadAppointments();
        await showReceiptForAppointment(
          res.data.data,
          doctorId,
          patientSnapshot
        );
      }
    } catch (e) {
      console.log(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectPatient = (p: IPatientResponse) => {
    setSelectedPatient(p);
    setPatientForm({
      phoneNumber: p.phoneNumber || "",
      nic: p.nic || "",
      firstName: p.firstName || "",
      middleName: p.middleName || "",
      lastName: p.lastName || "",
      gender: p.gender || "Male",
      dateOfBirth: (p.dateOfBirth || "").slice(0, 10),
    });
    // Initialize age fields from patient's DOB (for display)
    const dob = (p.dateOfBirth || "").slice(0, 10);
    if (dob) {
      const br = calculateAgeFromDOB(dob);
      setYears(br.years || undefined);
      setMonths(br.months || undefined);
      setDays(br.days || undefined);
    } else {
      setYears(undefined);
      setMonths(undefined);
      setDays(undefined);
    }
    // Set modal mode to edit when patient is selected
    setPatientModalMode("edit");
  };

  const handleSavePatient = async () => {
    setSubmitting(true);
    const payload = {
      ...patientForm,
      userName: "sm@gmail.com",
      dateOfBirth: patientForm.dateOfBirth,
    } as any;

    try {
      if (selectedPatient?.id) {
        const res = await serverAPI.put<{ data: IPatientResponse }>(
          API_URL.patient.update,
          {
            ...payload,
            patientId: selectedPatient.id,
            patientCode: selectedPatient.patientCode,
          }
        );
        if (res?.data?.data) {
          setSelectedPatient(res.data.data);
        }
      } else {
        const res = await serverAPI.post<{ data: IPatientResponse }>(
          API_URL.patient.create,
          payload
        );
        if (res?.data?.data) {
          setSelectedPatient(res.data.data);
        }
      }
    } catch (e) {
      console.log(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-200/15 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          {/* Modern Icon Badge */}
          <div className="relative">
            <div className="w-12 h-12 bg-emerald-600 rounded-xl shadow-md flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
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
          </div>
          <div>
            <h1 className="text-2xl font-bold text-emerald-600">
              Quick Appointment
            </h1>
            <p className="text-xs text-gray-600 mt-0.5">
              Fast track patient appointments
            </p>
          </div>
        </div>

        {/* Next Appointment Counter - Enhanced */}
        <div className="bg-white px-4 py-2.5 rounded-lg shadow-sm border border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-0.5">
                Next Appointment
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xs text-gray-500">#</span>
                <span className="text-2xl font-bold text-emerald-600">
                  {String(nextAppoNo).padStart(3, "0")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-emerald-100 px-2.5 py-1 rounded-full">
              <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></div>
              <span className="text-[9px] font-bold text-emerald-600 uppercase">
                Live
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Appointment Booking Card - Enhanced */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Step Indicator */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-2.5">
          <div className="flex items-center justify-between text-white text-sm">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    selectedPatient
                      ? "bg-white text-emerald-600"
                      : "bg-white/30"
                  }`}
                >
                  {selectedPatient ? "✓" : "1"}
                </div>
                <span className="font-medium">Patient</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    doctorId ? "bg-white text-emerald-600" : "bg-white/30"
                  }`}
                >
                  {doctorId ? "✓" : "2"}
                </div>
                <span className="font-medium">Doctor</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <span className="font-medium">Book</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Section - Enhanced */}
        <div className="p-4 bg-gray-50/50">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
            {/* Patient Code Search - Enhanced */}
            <div className="relative">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Patient Code
              </label>
              <input
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                placeholder="Scan or enter code"
                value={patientCodeEntry}
                onChange={(e) => setPatientCodeEntry(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    searchPatients("PatientCode", patientCodeEntry);
                }}
              />
              {loading && (
                <div className="absolute right-3 top-9 animate-spin">
                  <svg
                    className="w-4 h-4 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
              )}
            </div>

            {/* Phone Number Search - Enhanced */}
            <div className="relative">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Phone Number
              </label>
              <input
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                placeholder="07XXXXXXXX"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.currentTarget.value.length >= 9) {
                    searchPatients("PhoneNumber", e.currentTarget.value);
                  }
                }}
              />
            </div>

            {/* NIC Search - Enhanced */}
            <div className="relative">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                NIC Number
              </label>
              <input
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                placeholder="XXXXXXXXXV or XXXXXXXXXXXX"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.currentTarget.value.length >= 10) {
                    searchPatients("NIC", e.currentTarget.value);
                  }
                }}
              />
            </div>
          </div>

          {/* New Patient Button - Enhanced */}
          <div className="flex justify-center">
            <button
              onClick={() => {
                setSelectedPatient(null);
                setPatientForm({
                  phoneNumber: "",
                  nic: "",
                  firstName: "",
                  middleName: "",
                  lastName: "",
                  gender: "Male",
                  dateOfBirth: "",
                });
                setYears(undefined);
                setMonths(undefined);
                setDays(undefined);
                setResults([]);
                setLoading(false);
                setPatientModalMode("new");
                setIsOpenPatientModal(true);
              }}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2"
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
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
              Register New Patient
            </button>
          </div>
        </div>

        {/* Selected Patient Display - Enhanced */}
        {selectedPatient && (
          <div className="mx-4 mb-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl shadow-lg relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-200/30 to-transparent rounded-bl-full"></div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-emerald-300/20 rounded-full blur-2xl"></div>

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-sm font-bold shadow">
                    {selectedPatient.firstName?.charAt(0)}
                    {selectedPatient.lastName?.charAt(0)}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-800 mb-1">
                    {selectedPatient.firstName} {selectedPatient.middleName}{" "}
                    {selectedPatient.lastName}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span>{selectedPatient.patientCode}</span>
                    <span>•</span>
                    <span>{selectedPatient.phoneNumber}</span>
                    <span>•</span>
                    <span>{selectedPatient.nic}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setPatientModalMode("edit");
                  setIsOpenPatientModal(true);
                }}
                className="px-3 py-2 border border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white text-xs font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 shadow-sm"
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
            </div>
          </div>
        )}

        {/* Appointment Details */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
            {/* Doctor Selection */}
            <div className="lg:col-span-5">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Doctor / Consultant
              </label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
              >
                <option value="">-- Select Doctor --</option>
                {doctors.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Emergency Toggle */}
            <div className="lg:col-span-3">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Priority
              </label>
              <label className="relative inline-flex items-center cursor-pointer bg-gray-50 rounded-lg px-3 py-2 hover:bg-gray-100 transition w-full">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isEmergency}
                  onChange={(e) => setIsEmergency(e.target.checked)}
                />
                <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[0.625rem] after:left-[0.875rem] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                <span className="ml-2 text-xs font-bold text-gray-700 peer-checked:text-red-600">
                  {isEmergency ? "🚨 Emergency" : "Normal"}
                </span>
              </label>
            </div>

            {/* Clear & Book Buttons */}
            <div className="lg:col-span-4 flex justify-end gap-2">
              {/* Clear Patient Button */}
              {selectedPatient && (
                <button
                  onClick={() => {
                    setSelectedPatient(null);
                    setPatientForm({
                      phoneNumber: "",
                      nic: "",
                      firstName: "",
                      middleName: "",
                      lastName: "",
                      gender: "Male",
                      dateOfBirth: "",
                    });
                    setPatientCodeEntry("");
                    setSearchValue("");
                    setResults([]);
                  }}
                  className="px-3 py-2 rounded-lg text-xs font-semibold border border-red-300 bg-white text-red-600 hover:bg-red-50 hover:border-red-400 transition flex items-center gap-1.5"
                >
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Clear
                </button>
              )}

              {/* Book Appointment Button */}
              <button
                className={`px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5 ${
                  !selectedPatient || !doctorId || submitting
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
                disabled={!selectedPatient || !doctorId || submitting}
                onClick={handleBook}
              >
                {submitting ? (
                  <>
                    <svg
                      className="animate-spin w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Booking...
                  </>
                ) : (
                  <>
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
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Book Appointment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Appointments - Enhanced Table */}
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-100 overflow-hidden relative">
        {/* Decorative corner accent */}
        <div className="absolute top-0 left-0 w-64 h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600"></div>

        <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-600 px-5 py-4 flex items-center justify-between relative overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/30 rounded-full blur-3xl animate-pulse"></div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
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
            <div>
              <h2 className="text-base font-bold text-white">
                Today's Appointments
              </h2>
            </div>
          </div>
          <div className="bg-white/20 px-3 py-1.5 rounded-lg">
            <span className="text-white text-sm font-semibold">
              {appointments.length} Total
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
                  #
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
                  Appt No
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
                  Doctor
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
                  Patient
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
                  Payment
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
                  Status
                </th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {appointments.map((a, index) => {
                const doc =
                  doctors.find((d) => Number(d.value) === a.consultantId)
                    ?.title ?? "—";
                const payment = "Not Paid";
                const { apptNo, nameSuffix } = splitApptNoAndName(
                  a.appointmentNo
                );
                return (
                  <tr
                    key={a.id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-semibold text-xs">
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="font-mono text-xs font-semibold text-gray-900">
                        {apptNo || a.appointmentNo}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="text-xs text-gray-900">{doc}</span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="text-xs text-gray-900">
                        {a.patientId
                          ? patientNameMap[a.patientId] ??
                            (nameSuffix || `Patient #${a.patientId}`)
                          : nameSuffix || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          payment === "Not Paid"
                            ? "bg-red-100 text-red-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {payment === "Not Paid" ? "✕" : "✓"} {payment}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          a.appointmentStatus === "Pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : a.appointmentStatus === "Completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {a.appointmentStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleEditAppointment(a)}
                        className="px-2.5 py-1 rounded-md bg-success hover:bg-green-600 text-white text-xs font-semibold shadow-sm transition"
                      >
                        Change
                      </button>
                    </td>
                  </tr>
                );
              })}
              {appointments.length === 0 && (
                <tr>
                  <td className="px-3 py-12 text-center" colSpan={7}>
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                          <svg
                            className="w-12 h-12 text-emerald-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                            />
                          </svg>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow">
                          <svg
                            className="w-4 h-4 text-white"
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
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-700 mb-1">
                          No appointments yet
                        </div>
                        <div className="text-xs text-gray-500">
                          Start by creating your first appointment above
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compact Patient Modal - Similar to Channel */}
      {isOpenPatientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpenPatientModal(false)}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-emerald-600 px-4 py-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white">
                    <svg
                      className="h-5 w-5"
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
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-white">
                        {patientModalMode === "select"
                          ? "Select Patient"
                          : patientModalMode === "edit"
                          ? "Edit Patient"
                          : "New Patient"}
                      </h3>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpenPatientModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition"
                >
                  <svg
                    className="h-4 w-4"
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
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto max-h-[calc(80vh-140px)] p-4">
              {/* Search Results Section */}
              {patientModalMode === "select" &&
                (results.length > 0 || loading) && (
                  <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-2 bg-blue-100 border-b border-blue-200">
                      <div className="flex items-center gap-2">
                        {loading ? (
                          <>
                            <svg
                              className="animate-spin w-4 h-4 text-blue-600"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            <span className="text-xs font-bold text-blue-700">
                              Searching...
                            </span>
                          </>
                        ) : (
                          <>
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
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span className="text-xs font-bold text-blue-700">
                              {results.length}{" "}
                              {results.length === 1 ? "match" : "matches"} found
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="divide-y divide-blue-100 max-h-48 overflow-auto">
                      {results.map((r) => (
                        <button
                          key={r.id}
                          className="w-full text-left px-4 py-3 hover:bg-white/70 transition"
                          onClick={() => handleSelectPatient(r)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                              {r.firstName?.charAt(0)}
                              {r.lastName?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm text-gray-900 truncate">
                                {r.firstName} {r.middleName} {r.lastName}
                                <span className="ml-2 text-xs font-mono text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                                  {r.patientCode}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-600">
                                <span>{r.phoneNumber}</span>
                                <span>{r.nic}</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                      {!loading && results.length === 0 && (
                        <div className="px-4 py-6 text-center">
                          <p className="text-sm text-gray-600 font-semibold">
                            No patients found
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Fill the form below to create new patient
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {/* Patient Form */}
              {patientModalMode !== "select" && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Patient Information
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Phone Number */}
                    <div>
                      <label className="flex text-xs font-bold text-gray-700 mb-1 items-center gap-1">
                        <svg
                          className="w-3 h-3 text-green-500"
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
                        Phone Number *
                      </label>
                      <input
                        className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                        value={patientForm.phoneNumber}
                        onChange={(e) =>
                          setPatientForm({
                            ...patientForm,
                            phoneNumber: e.target.value,
                          })
                        }
                        placeholder="07XXXXXXXX"
                      />
                    </div>

                    {/* NIC */}
                    <div>
                      <label className="flex text-xs font-bold text-gray-700 mb-1 items-center gap-1">
                        <svg
                          className="w-3 h-3 text-purple-500"
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
                        NIC Number *
                      </label>
                      <input
                        className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                        value={patientForm.nic}
                        onChange={(e) =>
                          setPatientForm({
                            ...patientForm,
                            nic: e.target.value,
                          })
                        }
                        placeholder="XXXXXXXXXV or XXXXXXXXXXXX"
                      />
                    </div>

                    {/* Full Name Section */}
                    <div className="md:col-span-2">
                      <label className="flex text-xs font-bold text-gray-700 mb-1 items-center gap-1">
                        <svg
                          className="w-3 h-3 text-blue-500"
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
                        Full Name *
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <input
                          className="px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          placeholder="First"
                          value={patientForm.firstName}
                          onChange={(e) =>
                            setPatientForm({
                              ...patientForm,
                              firstName: e.target.value,
                            })
                          }
                        />
                        <input
                          className="px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          placeholder="Middle"
                          value={patientForm.middleName}
                          onChange={(e) =>
                            setPatientForm({
                              ...patientForm,
                              middleName: e.target.value,
                            })
                          }
                        />
                        <input
                          className="px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          placeholder="Last"
                          value={patientForm.lastName}
                          onChange={(e) =>
                            setPatientForm({
                              ...patientForm,
                              lastName: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* Date of Birth Information (like Channel page) */}
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-1.5">
                        <svg
                          className="w-3.5 h-3.5 text-emerald-600"
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
                        Date of Birth
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <div>
                          <label className="block text-[11px] font-medium text-gray-600 mb-1">
                            Age (Years)
                          </label>
                          <input
                            type="number"
                            className="input-enhanced"
                            value={years ?? ""}
                            onChange={(e) =>
                              setYears(
                                e.target.value
                                  ? Number(e.target.value)
                                  : undefined
                              )
                            }
                            min={0}
                            max={150}
                            placeholder="Years"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-gray-600 mb-1">
                            Age (Months)
                          </label>
                          <input
                            type="number"
                            className="input-enhanced"
                            value={months ?? ""}
                            onChange={(e) =>
                              setMonths(
                                e.target.value
                                  ? Number(e.target.value)
                                  : undefined
                              )
                            }
                            min={0}
                            placeholder="Months"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-gray-600 mb-1">
                            Age (Days)
                          </label>
                          <input
                            type="number"
                            className="input-enhanced"
                            value={days ?? ""}
                            onChange={(e) =>
                              setDays(
                                e.target.value
                                  ? Number(e.target.value)
                                  : undefined
                              )
                            }
                            min={0}
                            placeholder="Days"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-gray-600 mb-1">
                            DOB (yyyy-MM-dd)
                          </label>
                          <input
                            type="date"
                            className="input-enhanced"
                            value={patientForm.dateOfBirth}
                            onChange={(e) =>
                              setPatientForm({
                                ...patientForm,
                                dateOfBirth: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      {patientForm.dateOfBirth && (
                        <div className="mt-2 text-[12px] text-emerald-700">
                          Date of Birth:{" "}
                          {new Date(patientForm.dateOfBirth).toLocaleDateString(
                            "en-US",
                            { year: "numeric", month: "long", day: "numeric" }
                          )}
                        </div>
                      )}
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="flex text-xs font-bold text-gray-700 mb-1 items-center gap-1">
                        <svg
                          className="w-3 h-3 text-indigo-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                        Gender *
                      </label>
                      <select
                        className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        value={patientForm.gender}
                        onChange={(e) =>
                          setPatientForm({
                            ...patientForm,
                            gender: e.target.value,
                          })
                        }
                      >
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-100 border-t border-gray-200 px-4 py-3 flex items-center justify-between">
              <p className="text-xs text-gray-500">* Required fields</p>
              <div className="flex items-center gap-2">
                <button
                  className="px-4 py-2 text-sm border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                  onClick={() => setIsOpenPatientModal(false)}
                >
                  Cancel
                </button>
                {patientModalMode !== "select" && (
                  <button
                    className={`px-6 py-2 text-sm rounded-lg font-bold transition-all duration-200 flex items-center gap-2 ${
                      submitting
                        ? "bg-gray-400 text-gray-100 cursor-not-allowed"
                        : patientModalMode === "edit"
                        ? "bg-amber-500 hover:bg-amber-600 text-white shadow-md hover:shadow-lg hover:scale-105 border-2 border-amber-600"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg hover:scale-105 border-2 border-emerald-700"
                    }`}
                    onClick={handleSavePatient}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <svg
                          className="w-4 h-4 animate-spin"
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
                        Saving...
                      </>
                    ) : patientModalMode === "edit" ? (
                      <>
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
                        Update Patient
                      </>
                    ) : (
                      <>
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
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Create Patient
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Edit Appointment Modal (reused from Channel page) */}
      {showEditAppointmentModal && editingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowEditAppointmentModal(false)}
          />

          <div
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header - match QuickAppointment style */}
            <div className="relative overflow-hidden bg-gradient-to-r from-sky-900 via-indigo-700 to-sky-800 px-4 py-3">
              <div className="absolute inset-0 opacity-40">
                <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-white/20 blur-3xl"></div>
                <div className="absolute left-16 -bottom-10 h-24 w-24 rounded-full bg-cyan-300/30 blur-2xl"></div>
              </div>

              <div className="relative flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border border-white/25 bg-white/10 text-white">
                    <svg
                      className="h-5 w-5"
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
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">
                        Edit Appointment
                      </h3>
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/15 px-2 py-0.5 text-[9px] font-semibold uppercase text-white">
                        Update
                      </span>
                    </div>
                    <p className="text-xs text-white/85">
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
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
                  aria-label="Close edit modal"
                >
                  <svg
                    className="h-4 w-4"
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
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-140px)]">
              <form onSubmit={handleUpdateAppointment} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">
                      Appointment Number
                    </label>
                    <input
                      type="text"
                      className="input-enhanced bg-gray-50"
                      value={editingAppointment.appointmentNo}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">
                      Patient
                    </label>
                    <input
                      type="text"
                      className="input-enhanced bg-gray-50"
                      value={
                        patientNameMap[editingAppointment.patientId] ??
                        `Patient #${editingAppointment.patientId}`
                      }
                      readOnly
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">
                    Consultant/Doctor
                  </label>
                  <select
                    className="input-enhanced"
                    value={String(editingAppointment.consultantId)}
                    onChange={(e) =>
                      setEditingAppointment({
                        ...editingAppointment,
                        consultantId: parseInt(e.target.value),
                      } as IAppointmentData)
                    }
                  >
                    <option value="">Select Doctor</option>
                    {doctors?.map((doctor) => (
                      <option key={doctor.value} value={doctor.value}>
                        {doctor.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">
                    Appointment Status
                  </label>
                  <select
                    className="input-enhanced"
                    value={editingAppointment.appointmentStatus}
                    onChange={(e) =>
                      setEditingAppointment({
                        ...editingAppointment,
                        appointmentStatus: e.target.value,
                      } as IAppointmentData)
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
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">
                      Schedule Charge
                    </label>
                    <input
                      type="number"
                      className="input-enhanced"
                      value={editingAppointment.chargeOnSchedule ?? 0}
                      onChange={(e) =>
                        setEditingAppointment({
                          ...editingAppointment,
                          chargeOnSchedule: parseFloat(e.target.value),
                        } as IAppointmentData)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">
                      Doctor Charge
                    </label>
                    <input
                      type="number"
                      className="input-enhanced"
                      value={editingAppointment.chargeByDoctor ?? 0}
                      onChange={(e) =>
                        setEditingAppointment({
                          ...editingAppointment,
                          chargeByDoctor: parseFloat(e.target.value),
                        } as IAppointmentData)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">
                      Total Charge
                    </label>
                    <input
                      type="number"
                      className="input-enhanced"
                      value={editingAppointment.totalCharge ?? 0}
                      onChange={(e) =>
                        setEditingAppointment({
                          ...editingAppointment,
                          totalCharge: parseFloat(e.target.value),
                        } as IAppointmentData)
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
                        } as IAppointmentData)
                      }
                    />
                    <span className="text-xs font-bold text-gray-700">
                      Emergency Appointment
                    </span>
                  </label>
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-100 border-t border-gray-200 px-4 py-3 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setShowEditAppointmentModal(false)}
                    className="px-4 py-2 text-sm border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-6 py-2 text-sm rounded-lg font-bold transition-all duration-200 flex items-center gap-2 ${
                      isSubmitting
                        ? "bg-gray-400 text-gray-100 cursor-not-allowed"
                        : "bg-amber-500 hover:bg-amber-600 text-white shadow-md hover:shadow-lg hover:scale-105 border-2 border-amber-600"
                    }`}
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Update Appointment
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {showReceiptModal && (
        <div className="fixed inset-0 z-[70] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
                  Receipt Preview
                </p>
                <h3 className="text-2xl font-semibold text-gray-900">
                  Channeling Receipt
                </h3>
                {receiptSummary?.appointmentNo && (
                  <p className="text-sm text-gray-500">
                    Appointment #{receiptSummary.appointmentNo}
                  </p>
                )}
              </div>
              <button
                onClick={handleCloseReceiptModal}
                className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition"
                aria-label="Close receipt preview"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-6 p-6 overflow-y-auto">
              <div className="md:w-64 w-full space-y-4">
                <div className="bg-gray-50 rounded-2xl p-4 shadow-inner border border-gray-100">
                  <p className="text-[11px] font-semibold uppercase text-gray-500 tracking-wide">
                    Patient
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {receiptSummary?.patientName ?? "Not selected"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {receiptSummary?.patientCode
                      ? `Code: ${receiptSummary.patientCode}`
                      : "Code not available"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <p className="text-[11px] font-semibold uppercase text-gray-500 tracking-wide">
                    Doctor
                  </p>
                  <p className="text-base font-semibold text-gray-900">
                    {receiptSummary?.doctorName ?? "Not selected"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Status: {receiptSummary?.status ?? "Pending"}
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                  <p className="text-[11px] font-semibold uppercase text-emerald-600 tracking-wide">
                    Total
                  </p>
                  <p className="text-2xl font-bold text-emerald-700">
                    LKR {formatCurrency(receiptSummary?.totalCharge ?? 0)}
                  </p>
                </div>
              </div>

              <div className="flex-1 bg-gray-100 rounded-2xl min-h-[420px] flex items-center justify-center shadow-inner">
                {receiptGenerating ? (
                  <div className="flex flex-col items-center gap-3 text-gray-500">
                    <span className="h-12 w-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
                    <p className="text-sm font-medium">
                      Preparing receipt PDF...
                    </p>
                  </div>
                ) : receiptPdfUrl ? (
                  <iframe
                    ref={receiptFrameRef}
                    src={receiptPdfUrl}
                    title="Channeling Receipt PDF"
                    className="w-full h-[500px] rounded-2xl bg-white shadow border border-gray-200"
                  />
                ) : (
                  <p className="text-sm text-gray-500">
                    Unable to load receipt preview. Try generating again.
                  </p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
              <button
                onClick={handleOpenReceiptInNewTab}
                disabled={!receiptPdfUrl}
                className={`w-full md:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold border transition ${
                  !receiptPdfUrl
                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Open in new tab
              </button>
              <button
                onClick={handlePrintReceipt}
                disabled={!receiptPdfUrl}
                className={`w-full md:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition ${
                  receiptPdfUrl
                    ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow"
                    : "bg-emerald-100 text-emerald-300 cursor-not-allowed"
                }`}
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
                    d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2m-10 0h10v4H6v-4z"
                  />
                </svg>
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickAppointment;
