import { useEffect, useState, useRef, useMemo } from "react";
import {
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  ClipboardDocumentListIcon,
  BeakerIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
  PauseCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { useSelector } from "react-redux";
import { authUserSelector } from "../redux/slice/user-slice.ts";
import { serverAPI } from "../api";
import { API_URL } from "../api/url.ts";
import {
  presentingComplainSymptoms,
  medicalHistoryConditions,
  surgicalHistorySurgeries,
  allergyInformationAllergies,
  examinationQuickAdd,
  diagnosisQuickAdd,
  investigationTemplates,
} from "../data/quickAddData";
import { drugsData } from "../data/drugsData";
import type { Drug } from "../data/drugsData";
import { frequencyOptions, commonInstructions } from "../data/medicationData";
import type { PrescribedMedication } from "../data/medicationData";
import { prescribedTestsData } from "../data/prescribedTestsData";
import type { PrescribedTest } from "../data/prescribedTestsData";
import type {
  Tab,
  TPatient,
  TClinicalNote,
  TExamination,
  TDiagnosis,
  HistoryModalProps,
} from "../types";
import type {
  IConsultationAppointment,
  IConsultationAppointmentList,
  IInvestigationHistoryRes,
  ILabTesingList,
  ILabTesting,
  ISelectedTest,
} from "../api/dto/res/res.types";
import type { IReqPageSize } from "../api/dto/req/req.types";
import { calculateAgeFromDOB } from "../libs/agecal.ts";
import { TestDataEntrySection } from "../components/page/doctorpp-components.tsx";
import { groupTestsByDate } from "../libs/historyhandles.ts";
import type { IGroupTestsByDateOut } from "../libs/types";
import { InvestigationHistorySection } from "../components/page/doctorpp/investigation-history.tsx";

// Commented out for future use
/*
type PatientHighlight = {
  label: string;
  value: string;
  Icon: ElementType;
  valueClass?: string;
};
*/
// Investigation history mock data (grouped by date)
export type InvestigationHistoryEntry = {
  date: string; // YYYY-MM-DD
  tests: Array<{
    name: string;
    value?: string;
    result?: string; // Fallback support for legacy data
    referenceRange?: string;
    comment?: string;
  }>;
};

type FocusableElement =
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement;

const investigationHistory: InvestigationHistoryEntry[] = [
  {
    date: "2025-11-05",
    tests: [
      {
        name: "FBC (Full Blood Count)",
        value: "Normal",
        referenceRange: "WBC 4.0-11.0 x10^3/uL, Hb 12.0-16.0 g/dL",
        comment: "No abnormality detected.",
      },
      {
        name: "ESR (Erythrocyte Sedimentation Rate)",
        value: "18 mm/hr",
        referenceRange: "0-20 mm/hr",
        comment: "Slightly elevated but clinically acceptable.",
      },
    ],
  },
  {
    date: "2025-11-03",
    tests: [
      {
        name: "Blood Sugar (Fasting)",
        value: "92 mg/dL",
        referenceRange: "70-100 mg/dL",
        comment: "Within normal range.",
      },
      {
        name: "Blood Sugar (Post Prandial)",
        value: "118 mg/dL",
        referenceRange: "<140 mg/dL",
        comment: "No evidence of post meal hyperglycemia.",
      },
    ],
  },
];

const examinationTabKey = {
  General: "general",
  "Cardio Vascular": "cardioVascular",
  Respiratory: "respiratory",
  "Central Nerve": "centralNurve",
  "Gastro Intestinal": "gartroIntestinal",
};

const examinationTabKeyValueSelect = (
  key: keyof typeof examinationTabKey,
  data: TExamination
) => {
  return data[examinationTabKey[key] as keyof TExamination];
};

const diagnosisTabKey = {
  "Infectious Diseases": "infectiousDiseases",
  "Chronic Diseases": "chronicDiseases",
  Gastrointestinal: "gastrointestinal",
  Neurological: "neurological",
  Musculoskeletal: "musculoskeletal",
  Other: "other",
};

const diagnosisTabKeyValueSelect = (
  key: keyof typeof diagnosisTabKey,
  data: TDiagnosis
) => {
  return data[diagnosisTabKey[key] as keyof TDiagnosis];
};

const historyHighlightGradient = "from-gray-200 to-gray-200";

const presentingHistoryData: Record<string, string[]> = {
  "Presenting Complain": [
    "Last visit: Fever and headache for 3 days",
    "Previous: Cough and cold symptoms",
  ],
  "Medical History": [
    "Diabetes Type 2 - diagnosed 2020",
    "Hypertension - started medication 2022",
  ],
  "Surgical History": ["Appendectomy - 2018"],
  "Allergy Information": [
    "Penicillin - causes rash",
    "Sulfa drugs - causes nausea",
  ],
};

const examinationHistoryData: Record<string, string[]> = {
  General: ["Vitals stable on last visit", "No acute distress observed"],
  "Cardio Vascular": ["No murmurs detected on 2024-10-12"],
  Respiratory: ["Mild wheeze noted last review"],
  "Central Nerve": ["Reflexes intact - no deficits"],
  "Gastro Intestinal": ["Abdomen soft, non tender"],
};

const diagnosisHistoryData: Record<string, string[]> = {
  "Infectious Diseases": ["Bronchitis - 2024-10-11"],
  "Chronic Diseases": ["DM Type 2 - ongoing management"],
  Gastrointestinal: ["IBS flare-up - 2024-09-02"],
  Neurological: ["Migraine episodes tracked since 2023"],
  Musculoskeletal: ["Knee osteoarthritis - physiotherapy advised"],
  Other: ["Seasonal dermatitis - managed with topical steroids"],
};

const tabs: Tab[] = [
  {
    id: "patients",
    label: "Patients",
    icon: <UserGroupIcon className="w-4 h-4" />,
    shortcut: "F1",
  },
  {
    id: "presenting",
    label: "Presenting",
    icon: <ChatBubbleLeftRightIcon className="w-4 h-4" />,
    shortcut: "F2",
  },
  {
    id: "examination",
    label: "Examination",
    icon: <HeartIcon className="w-4 h-4" />,
    shortcut: "F3",
  },
  {
    id: "diagnosis",
    label: "Diagnosis",
    icon: <ClipboardDocumentListIcon className="w-4 h-4" />,
    shortcut: "F4",
  },
  {
    id: "investigation",
    label: "Investigation",
    icon: <BeakerIcon className="w-4 h-4" />,
    shortcut: "F5",
  },
  {
    id: "management",
    label: "Management",
    icon: <WrenchScrewdriverIcon className="w-4 h-4" />,
    shortcut: "F6",
  },
];

// History Modal Component
const HistoryModal = ({
  isOpen,
  onClose,
  title,
  historyData = [],
}: HistoryModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal panel - Smaller and Centered */}
      <div className="relative bg-white rounded-xl shadow-2xl transform transition-all w-full max-w-md">
        {/* Header - Compact */}
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-3 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {title} - History
            </h3>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-1 hover:bg-white/20 rounded"
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
        </div>

        {/* Content - Compact */}
        <div className="px-4 py-3 max-h-[60vh] overflow-y-auto">
          {historyData.length > 0 ? (
            <div className="space-y-2">
              {historyData.map((item, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200 hover:border-green-300 transition-all"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-white font-bold text-xs">
                        {index + 1}
                      </span>
                    </div>
                    <span className="font-semibold text-gray-700 text-sm">
                      Visit {index + 1}
                    </span>
                    <span className="ml-auto text-xs text-gray-500">
                      {new Date(
                        Date.now() - index * 7 * 24 * 60 * 60 * 1000
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-600 text-xs ml-8">
                    {item || "No data available"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-gray-500 text-sm">No history available</p>
            </div>
          )}
        </div>

        {/* Footer - Compact */}
        <div className="bg-gray-50 px-4 py-3 flex justify-end rounded-b-xl border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg transition-all shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Frequency multiplier for calculating total quantity
const getFrequencyMultiplier = (frequency: string): number => {
  const frequencyMap: Record<string, number> = {
    MANE: 1, // Morning
    NOCTE: 1, // Night
    BD: 2, // Twice daily
    TDS: 3, // Three times daily
    QDS: 4, // Four times daily
    HOURLY: 24, // Every hour
    Q2H: 12, // Every 2 hours
    Q4H: 6, // Every 4 hours
    Q6H: 4, // Every 6 hours
    Q8H: 3, // Every 8 hours
  };

  return frequencyMap[frequency.toUpperCase()] || 1; // Default to 1 if not found
};

const DoctorPP = () => {
  const [activeTab, setActiveTab] = useState<
    | "patients"
    | "presenting"
    | "examination"
    | "diagnosis"
    | "investigation"
    | "management"
  >("patients");
  const [expandedExamSections, setExpandedExamSections] = useState<string[]>(
    []
  ); // All sections collapsed by default
  const [expandedPresentingSections, setExpandedPresentingSections] = useState<
    string[]
  >([]); // All sections collapsed by default
  const [expandedDiagnosisSections, setExpandedDiagnosisSections] = useState<
    string[]
  >([]); // All sections collapsed by default
  const [patientCode, _setPatientCode] = useState<string>("1001001");
  const [appointmentNo, _setAppointmentNo] = useState<string>("1001001");
  const [patientName, _setPatientName] = useState<string>("Sanka Illangakoon");
  const [patientAge, _setPatientAge] = useState<string>("35");
  const [patientGender, _setPatientGender] = useState<string>("Male");
  const [_patientContact, _setPatientContact] = useState<string>("0771234567");
  const [_isNewPatient, _setIsNewPatient] = useState<boolean>(false); // false = Old Patient, true = New Patient
  const [visitCount, _setVisitCount] = useState<number>(4);
  const [patients, setPatients] = useState<TPatient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState<boolean>(false);
  const [patientsError, setPatientsError] = useState<string>("");
  const [isFinishingAppointment, setIsFinishingAppointment] =
    useState<boolean>(false);
  const [finishError, setFinishError] = useState<string>("");
  const [lastCompletedAppointment, setLastCompletedAppointment] = useState<
    string | null
  >(null);
  const [isLoadingPatientData, setIsLoadingPatientData] =
    useState<boolean>(false);
  const user = useSelector(authUserSelector);

  // History Modal States
  const [historyModal, setHistoryModal] = useState({
    isOpen: false,
    title: "",
    data: [] as string[],
  });

  // Notification Toast States
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    patientName: string;
  }>({
    show: false,
    message: "",
    patientName: "",
  });

  // Investigation Print Modal State
  const [showInvestigationPrintModal, setShowInvestigationPrintModal] =
    useState(false);

  // Medication Print Modal State
  const [showMedicationPrintModal, setShowMedicationPrintModal] =
    useState(false);

  const presentingComplainsInputRef = useRef<HTMLInputElement>(null);
  const medicalHistoryInputRef = useRef<HTMLInputElement>(null);
  const surgicalHistoryInputRef = useRef<HTMLInputElement>(null);
  const allergyInformationInputRef = useRef<HTMLInputElement>(null);
  const examinationInputRefs = useRef<Record<string, FocusableElement | null>>(
    {}
  );
  const diagnosisInputRefs = useRef<Record<string, FocusableElement | null>>(
    {}
  );

  // Commented out for future use
  /*
  const _patientInitials = useMemo(() => {
    const safeName = (patientName || patientCode || "").trim();
    if (!safeName) return "PT";
    const initials = safeName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
    return initials || "PT";
  }, [patientName, patientCode]);

  const _patientHighlights = useMemo<PatientHighlight[]>(
    () => [
      {
        label: "Code",
        value: patientCode || "-",
        Icon: IdentificationIcon,
      },
      {
        label: "Age",
        value: patientAge ? `${patientAge} Years` : "N/A",
        Icon: CalendarDaysIcon,
      },
      {
        label: "Gender",
        value: patientGender || "N/A",
        Icon: UserIcon,
        valueClass:
          patientGender?.toLowerCase() === "female"
            ? "text-pink-300"
            : patientGender?.toLowerCase() === "male"
            ? "text-sky-200"
            : "text-emerald-200",
      },
      {
        label: "Contact",
        value: patientContact || "N/A",
        Icon: PhoneIcon,
      },
    ],
    [patientCode, patientAge, patientGender, patientContact]
  );
  */

  const focusInputAfterExpand = (
    getElement?: () => FocusableElement | null
  ) => {
    if (!getElement) return;
    const tryFocus = (attemptsLeft: number) => {
      const element = getElement();
      if (element) {
        element.focus();
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      } else if (attemptsLeft > 0) {
        setTimeout(() => tryFocus(attemptsLeft - 1), 40);
      }
    };

    setTimeout(() => tryFocus(4), 0);
  };

  const togglePresentingSection = (
    section: string,
    focusGetter?: () => FocusableElement | null
  ) => {
    const isExpanded = expandedPresentingSections.includes(section);
    setExpandedPresentingSections((prev) =>
      isExpanded ? prev.filter((t) => t !== section) : [...prev, section]
    );

    if (!isExpanded) {
      focusInputAfterExpand(focusGetter);
    }
  };

  const getHistoryHeaderAccent = (hasHistory: boolean) =>
    hasHistory
      ? "border-b border-gray-300 ring-1 ring-gray-200/70 shadow-[0_6px_14px_rgba(107,114,128,0.25)]"
      : "border-b border-gray-200";

  const historyButtonBaseClasses =
    "flex items-center gap-1 px-2 py-0.5 rounded text-sm font-semibold transition-all border";

  const getHistoryButtonClasses = (hasHistory: boolean) =>
    hasHistory
      ? `${historyButtonBaseClasses} bg-gray-200 text-gray-900 border-gray-300 hover:bg-gray-300`
      : `${historyButtonBaseClasses} bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100`;

  const toggleExaminationSection = (
    section: string,
    focusGetter?: () => FocusableElement | null
  ) => {
    const isExpanded = expandedExamSections.includes(section);
    setExpandedExamSections((prev) =>
      isExpanded ? prev.filter((t) => t !== section) : [...prev, section]
    );

    if (!isExpanded) {
      focusInputAfterExpand(focusGetter);
    }
  };

  const toggleDiagnosisSection = (
    section: string,
    focusGetter?: () => FocusableElement | null
  ) => {
    const isExpanded = expandedDiagnosisSections.includes(section);
    setExpandedDiagnosisSections((prev) =>
      isExpanded ? prev.filter((t) => t !== section) : [...prev, section]
    );

    if (!isExpanded) {
      focusInputAfterExpand(focusGetter);
    }
  };

  // Investigation Tab States
  const [investigationSearchTerm, setInvestigationSearchTerm] =
    useState<string>("");
  const [selectedTests, setSelectedTests] = useState<ISelectedTest[]>([]);

  // Prescribed tests data - loaded from data file
  const [prescribedTests, _setPrescribedTests] =
    useState<PrescribedTest[]>(prescribedTestsData);

  const [availableTests, setAvailableTests] = useState<ILabTesting[]>([]);

  console.log(selectedTests);
  // Filter tests based on search term
  const filteredTests = useMemo(
    () =>
      availableTests.filter((test) =>
        test?.labTestCode
          ?.toLowerCase()
          .includes(investigationSearchTerm.toLowerCase())
      ),
    [investigationSearchTerm, availableTests]
  );

  // Handle test selection toggle
  const handleTestToggle = (test: ILabTesting) => {
    const { id, ...restTest } = test;
    if (selectedTests.some((t) => t.testId == test.id)) {
      // IMPORTANT CHECK NULL EXPEPTION AND CRASH
      setSelectedTests(selectedTests.filter((t) => t.testId !== test.id));
    } else {
      setSelectedTests([...selectedTests, { ...restTest, testId: id }]);
    }
  };

  // Handle remove test from selected
  const handleRemoveTest = (test: ISelectedTest) => {
    // IMPORTANT CHECK NULL EXPEPTION AND CRASH
    setSelectedTests(selectedTests.filter((t) => t.testId !== test.testId));
  };

  // Handle quick template selection
  const handleQuickTemplate = (testNames: string[]) => {
    // Add tests that aren't already selected
    const newTests = availableTests.filter((test) => {
      if (testNames.includes(test.labTestName)) {
        return !selectedTests.some((t) => t.labTestName == test.labTestName);
      }
      return false;
    });
    setSelectedTests([
      ...selectedTests,
      ...newTests.map((t: ILabTesting) => {
        const { id, ...restT } = t;
        return { ...restT, testId: id };
      }),
    ]);
  };

  // Print Investigation Prescription
  const handlePrintInvestigationPrescription = () => {
    setShowInvestigationPrintModal(true);
  };

  // Actual print function
  const printInvestigationPrescription = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const currentDate = new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Investigation Prescription</title>
        <style>
          @page { size: B5; margin: 15mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; width: 176mm; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
          .hospital-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
          .hospital-info { font-size: 10px; margin-bottom: 2px; }
          .patient-info { margin: 15px 0; padding: 10px; border: 1px solid #ddd; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
          .info-label { font-weight: bold; }
          .barcode { text-align: right; font-family: "Libre Barcode 128", monospace; font-size: 24px; }
          .prescription-title { font-weight: bold; margin: 20px 0 10px; font-size: 14px; }
          .test-list { border-top: 1px solid #000; padding-top: 10px; }
          .test-item { margin: 8px 0; font-size: 12px; padding-left: 10px; }
          .footer { margin-top: 30px; padding-top: 15px; border-top: 1px dashed #000; }
          .footer-info { font-size: 10px; margin: 3px 0; }
          .doctor-signature { margin-top: 20px; font-size: 11px; }
          @media print {
            body { padding: 10px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="hospital-name">PRIME HOSPITALS PVT LTD</div>
          <div class="hospital-info">NO 217/A-2, PUGODA ROAD, DOMPE, DOMPE</div>
          <div class="hospital-info">Contact: 0112192909, 0714496828</div>
        </div>

        <div class="patient-info">
          <div class="info-row">
            <div><span class="info-label">Patient Name:</span> ${patientName} (File: ${patientCode})</div>
            <div class="barcode">${appointmentNo}</div>
          </div>
          <div class="info-row">
            <div><span class="info-label">Age:</span> ${patientAge} years</div>
            <div><span class="info-label">Date:</span> ${currentDate}</div>
          </div>
        </div>

        <div class="prescription-title">Rx</div>
        <div class="test-list">
          ${selectedTests
            .map(
              (test, index) => `
            <div class="test-item">${index + 1}) ${test.labTestName}</div>
          `
            )
            .join("")}
        </div>

        <div style="margin-top: 15px; font-size: 11px; font-style: italic;">
          No more items on this prescription
        </div>

        <div class="footer">
          <div class="footer-info" style="border-top: 1px dashed #000; padding-top: 10px; margin-bottom: 10px;">
            Next Visit Date: __________
          </div>
          <div class="doctor-signature">
            <div style="font-weight: bold;">DR DOCTOR NAME</div>
            <div style="font-style: italic; font-size: 10px; margin-top: 3px;">
              Signature not required. This is computer generated prescription.
            </div>
          </div>
        </div>

        <div style="margin-top: 30px; font-size: 8px; text-align: center; color: #666;">
          Software Solution By: HealthCare LA (Pvt) Ltd | +94710490851 | ppa@healthcorela.lk | dileep@healthcorela@gmail.com
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 100);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Print Medication Prescription
  const printMedicationPrescription = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const currentDate = new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    // Check if there are any medications or tests
    const hasMedications = prescribedMeds.length > 0;
    const hasTests = selectedTests.length > 0;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Prescription</title>
        <style>
          @page { size: B5; margin: 15mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; width: 176mm; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
          .hospital-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
          .hospital-info { font-size: 10px; margin-bottom: 2px; }
          .patient-info { margin: 15px 0; padding: 10px; border: 1px solid #ddd; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
          .info-label { font-weight: bold; }
          .barcode { text-align: right; font-family: "Libre Barcode 128", monospace; font-size: 24px; }
          .section-title { font-weight: bold; margin: 20px 0 10px; font-size: 14px; color: #059669; }
          .prescription-title { font-weight: bold; margin: 20px 0 10px; font-size: 14px; }
          .med-list { padding-top: 10px; }
          .med-item { margin: 12px 0; font-size: 12px; padding: 8px; background: #f9f9f9; border-left: 3px solid #10b981; }
          .med-name { font-weight: bold; font-size: 13px; margin-bottom: 4px; }
          .med-details { font-size: 11px; color: #333; margin-left: 10px; }
          .test-list { border-top: 1px solid #000; padding-top: 10px; margin-top: 15px; }
          .test-item { margin: 8px 0; font-size: 12px; padding-left: 10px; }
          .footer { margin-top: 30px; padding-top: 15px; border-top: 1px dashed #000; }
          .footer-info { font-size: 10px; margin: 3px 0; }
          .doctor-signature { margin-top: 20px; font-size: 11px; }
          @media print {
            body { padding: 10px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="hospital-name">PRIME HOSPITALS PVT LTD</div>
          <div class="hospital-info">NO 217/A-2, PUGODA ROAD, DOMPE, DOMPE</div>
          <div class="hospital-info">Contact: 0112192909, 0714496828</div>
        </div>

        <div class="patient-info">
          <div class="info-row">
            <div><span class="info-label">Patient Name:</span> ${patientName} (File: ${patientCode})</div>
            <div class="barcode">${appointmentNo}</div>
          </div>
          <div class="info-row">
            <div><span class="info-label">Age:</span> ${patientAge} years</div>
            <div><span class="info-label">Date:</span> ${currentDate}</div>
          </div>
        </div>

        <div class="prescription-title">Rx</div>
        
        ${
          hasMedications
            ? `
        <div class="section-title">Medications:</div>
        <div class="med-list">
          ${prescribedMeds
            .map(
              (med, index) => `
            <div class="med-item">
              <div class="med-name">${index + 1}) ${med.drugName}</div>
              <div class="med-details">
                <div>• Strength: ${med.strength} | Form: ${med.form}</div>
                <div>• Frequency: ${med.frequency} | Duration: ${
                med.duration
              } days | Quantity: ${med.quantity}</div>
                ${
                  med.specialInstructions
                    ? `<div>• Instructions: ${med.specialInstructions}</div>`
                    : ""
                }
              </div>
            </div>
          `
            )
            .join("")}
        </div>
        `
            : ""
        }

        ${
          hasTests
            ? `
        <div class="section-title" style="margin-top: 20px;">Investigations:</div>
        <div class="test-list">
          ${selectedTests
            .map(
              (test, index) => `
            <div class="test-item">${index + 1}) ${test.labTestName}</div>
          `
            )
            .join("")}
        </div>
        `
            : ""
        }

        <div style="margin-top: 15px; font-size: 11px; font-style: italic;">
          Prescription Guidelines: FBC/CRP
        </div>

        <div style="margin-top: 10px; font-size: 11px; font-style: italic;">
          No more items on this prescription
        </div>

        <div class="footer">
          <div class="footer-info" style="border-top: 1px dashed #000; padding-top: 10px; margin-bottom: 10px;">
            Next Visit Date: __________
          </div>
          <div class="doctor-signature">
            <div style="font-weight: bold;">DR DOCTOR NAME</div>
            <div style="font-style: italic; font-size: 10px; margin-top: 3px;">
              Signature not required. This is computer generated prescription.
            </div>
          </div>
        </div>

        <div style="margin-top: 30px; font-size: 8px; text-align: center; color: #666;">
          Software Solution By: HealthCare LA (Pvt) Ltd | +94710490851 | ppa@healthcorela.lk | dileep@healthcorela@gmail.com
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 100);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Management Tab States
  const [drugSearchQuery, setDrugSearchQuery] = useState("");
  const [drugSearchResults, setDrugSearchResults] = useState<Drug[]>([]);
  const [isSearchingDrugs, setIsSearchingDrugs] = useState(false);
  const [showDrugSearchResults, setShowDrugSearchResults] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [drugSearchType, setDrugSearchType] = useState<
    "itemName" | "itemNameStart" | "genericName"
  >("itemName");
  const [medicationQuantity, setMedicationQuantity] = useState("");
  const [medicationFrequency, setMedicationFrequency] = useState("MANE");
  const [currentFrequencyIndex, setCurrentFrequencyIndex] = useState(0);
  const [medicationDuration, setMedicationDuration] = useState("");
  const [medicationInstructions, setMedicationInstructions] = useState("");
  const [showFrequencyDropdown, setShowFrequencyDropdown] = useState(false);
  const [showInstructionsDropdown, setShowInstructionsDropdown] =
    useState(false);
  const [prescribedMeds, setPrescribedMeds] = useState<PrescribedMedication[]>(
    []
  );
  const [selectedDropdownIndex, setSelectedDropdownIndex] = useState(0);
  const [selectedInstructionIndex, setSelectedInstructionIndex] = useState(0);
  const [showAddSuccess, setShowAddSuccess] = useState(false);

  // Next Visit Date and Doctor Charge states
  const [nextVisitDate, setNextVisitDate] = useState("");
  const [chargingReference, setChargingReference] = useState("");
  const [doctorCharge, setDoctorCharge] = useState("");

  // Frequency options array
  const frequencyList = [
    "MANE",
    "NOCTE",
    "BD",
    "TDS",
    "QDS",
    "HOURLY",
    "Q2H",
    "Q4H",
    "Q6H",
    "Q8H",
  ];

  // Refs for input fields
  const drugSearchInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const durationInputRef = useRef<HTMLInputElement>(null);
  const frequencyInputRef = useRef<HTMLDivElement>(null);
  const instructionsInputRef = useRef<HTMLInputElement>(null);

  // Search drugs with debounce
  useEffect(() => {
    const performDrugSearch = async () => {
      if (drugSearchQuery.length >= 3) {
        setIsSearchingDrugs(true);
        try {
          const lowerQuery = drugSearchQuery.toLowerCase();
          let results: Drug[] = [];

          // Filter based on search type
          if (drugSearchType === "itemName") {
            // Search anywhere in item name
            results = drugsData.filter((drug) =>
              drug.itemName.toLowerCase().includes(lowerQuery)
            );
          } else if (drugSearchType === "itemNameStart") {
            // Search from start of item name
            results = drugsData.filter((drug) =>
              drug.itemName.toLowerCase().startsWith(lowerQuery)
            );
          } else if (drugSearchType === "genericName") {
            // Search in generic name
            results = drugsData.filter((drug) =>
              drug.genericName.toLowerCase().includes(lowerQuery)
            );
          }

          setDrugSearchResults(results);
          setShowDrugSearchResults(true);
        } catch (error) {
          console.error("Drug search error:", error);
        } finally {
          setIsSearchingDrugs(false);
        }
      } else {
        setDrugSearchResults([]);
        setShowDrugSearchResults(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      performDrugSearch();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [drugSearchQuery, drugSearchType]);

  const [clinicalNoteData, setClinicalNoteData] = useState<TClinicalNote>({
    presentingComplains: "",
    medicalNotes: "",
    surgicalNotes: "",
    allergyNotes: "",
    presentingTemplateComment: "",
  });
  const [examinationData, setExaminationData] = useState<TExamination>({
    general: "",
    cardioVascular: "",
    respiratory: "",
    centralNurve: "",
    gartroIntestinal: "",
  });
  const [diagnosisData, setDiagnosisData] = useState({
    infectiousDiseases: "",
    chronicDiseases: "",
    gastrointestinal: "",
    neurological: "",
    musculoskeletal: "",
    other: "",
  });

  const [_investigationHistoryData, setInvestigationHistoryData] = useState<
    IGroupTestsByDateOut[]
  >([]);

  /*
  const tabs: Tab[] = [
    { id: "patients", label: "Patients", icon: "👥", shortcut: "F1" },
    { id: "presenting", label: "Presenting", icon: "📋", shortcut: "F2" },
    { id: "examination", label: "Examination", icon: "🩺", shortcut: "F3" },
    { id: "diagnosis", label: "Diagnosis", icon: "🔬", shortcut: "F4" },
    { id: "investigation", label: "Investigation", icon: "🧪", shortcut: "F5" },
    { id: "management", label: "Management", icon: "💊", shortcut: "F6" },
  ];

  */

  // Open History Modal
  const openHistoryModal = (title: string, data: string[] = []) => {
    setHistoryModal({
      isOpen: true,
      title,
      data,
    });
  };

  // Close History Modal
  const closeHistoryModal = () => {
    setHistoryModal({
      isOpen: false,
      title: "",
      data: [],
    });
  };

  // Keyboard shortcuts for tabs
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault();
        setActiveTab("patients");
      }
      if (e.key === "F2") {
        e.preventDefault();
        setActiveTab("presenting");
      }
      if (e.key === "F3") {
        e.preventDefault();
        setActiveTab("examination");
      }
      if (e.key === "F4") {
        e.preventDefault();
        setActiveTab("diagnosis");
      }
      if (e.key === "F5") {
        e.preventDefault();
        setActiveTab("investigation");
      }
      if (e.key === "F6") {
        e.preventDefault();
        setActiveTab("management");
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  useEffect(() => {
    setIsLoadingPatients(true);
    setPatientsError("");
    // load patient by consultant id
    if (user?.user?.accessToken) {
      serverAPI
        .post<IConsultationAppointmentList, IReqPageSize>(
          API_URL.doctorConsultation.list(user.user?.consultantId, "Pending"),
          {
            pageNumber: 1,
            pageSize: 500,
          }
        )
        .then((d) => {
          const setData: TPatient[] = [];
          setIsLoadingPatients(false);

          if (d?.data?.items?.length) {
            const data: IConsultationAppointment[] = d.data.items;
            const firstPatient: IConsultationAppointment =
              data[0] as IConsultationAppointment;
            const { years: firstPYear } = calculateAgeFromDOB(
              firstPatient.dateOfBirth
            );
            _setPatientName(firstPatient.firstName);
            _setPatientCode(`${firstPatient.patientId}`);
            _setAppointmentNo(`${firstPatient.appointmentId}`);
            _setPatientAge(`${firstPYear}`);
            _setPatientGender(firstPatient.gender);
            _setPatientContact(firstPatient.phoneNumber);

            data.forEach((d) => {
              const { years } = calculateAgeFromDOB(d.dateOfBirth);
              setData.push({
                id: d.appointmentId,
                appoNo: d.appointmentNo.split("-")[2] || "",
                name: d.firstName,
                age: years,
                patientCode: `${d.patientId}`,
                phoneNumber: d.phoneNumber,
                situation: d.isEmergency ? "Emergency" : d.appointmentStatus,
                situationColor: d.isEmergency ? "danger" : "success",
                gender: d.gender,
              });
            });
            setPatients(setData);
          }
          console.log(d.data);
        })
        .catch((e) => {
          console.log(e);
          setIsLoadingPatients(false);
          setPatientsError("error while loading data");
        });

      // load test
      serverAPI
        .post<ILabTesingList, IReqPageSize>(API_URL.labTest.list, {
          pageNumber: 1,
          pageSize: 1000,
        })
        .then((d) => {
          console.log(d.data);
          if (d?.data?.items?.length) setAvailableTests(d.data.items);
        })
        .catch((e) => {
          console.log(e);
        });
    }
  }, [user?.user?.accessToken]);

  useEffect(() => {
    if (patientCode && user?.user?.accessToken) {
      // load investigation data
      serverAPI
        .get<IInvestigationHistoryRes[]>(
          API_URL.doctorConsultation.investigationHistory(
            Number(patientCode),
            "2025-10-30",
            "2025-11-30"
          )
        )
        .then((d) => {
          // console.log(d.data);
          if (d?.data?.length) {
            const resInvestigationHistory = d.data;
            const data = groupTestsByDate(resInvestigationHistory);
            console.log(data);
            setInvestigationHistoryData(data);
          }
        })
        .catch((e) => {
          console.log(e);
        });
    }
  }, [patientCode, user?.user?.accessToken]);

  const saveConsultationData = async () => {
    const payload = {
      clinicalNote: {
        presentingComplains: clinicalNoteData.presentingComplains,
        medicalNotes: clinicalNoteData.medicalNotes,
        surgicalNotes: clinicalNoteData.surgicalNotes,
        allergyNotes: clinicalNoteData.allergyNotes,
        presentingTemplateComment: clinicalNoteData.presentingTemplateComment,
      },
      examination: {
        general: examinationData.general,
        cardioVascular: examinationData.cardioVascular,
        respiratory: examinationData.respiratory,
        centralNurve: examinationData.centralNurve,
        gartroIntestinal: examinationData.gartroIntestinal,
      },
      investigation: selectedTests.map((test) => ({
        labTestId: test.testId,
        labTestName: test.labTestCode,
        values: "",
        refRange: "",
        comment: "",
      })),
      diagnosis: {
        diagnosisDesc: diagnosisData.infectiousDiseases,
      },
      opdPharmacyItem: [],
      appointmentId: appointmentNo,
      patientId: patientCode,
      consultantId: user?.user?.consultantId,
      userName: "ns@ns.lk",
    };

    const res = await serverAPI.post(
      API_URL.doctorConsultation.create,
      payload
    );
    // console.log(payload);
    console.log(res.data);
    return res.data;
  };

  const resetConsultationForms = () => {
    setClinicalNoteData({
      presentingComplains: "",
      medicalNotes: "",
      surgicalNotes: "",
      allergyNotes: "",
      presentingTemplateComment: "",
    });
    setExaminationData({
      general: "",
      cardioVascular: "",
      respiratory: "",
      centralNurve: "",
      gartroIntestinal: "",
    });
    setDiagnosisData({
      infectiousDiseases: "",
      chronicDiseases: "",
      gastrointestinal: "",
      neurological: "",
      musculoskeletal: "",
      other: "",
    });
    setSelectedTests([]);
    setPrescribedMeds([]);
    setInvestigationSearchTerm("");
    setDrugSearchQuery("");
    setMedicationQuantity("");
    setMedicationFrequency("");
    setMedicationDuration("");
    setMedicationInstructions("");
  };

  const focusPresentingSection = () => {
    setActiveTab("presenting");
    setExpandedPresentingSections((prev) =>
      prev.includes("Presenting Complain")
        ? prev
        : [...prev, "Presenting Complain"]
    );
    focusInputAfterExpand(() => presentingComplainsInputRef.current);
  };

  const advanceQueueAfterFinish = () => {
    setPatients((prevPatients) => {
      if (!prevPatients.length) {
        return prevPatients;
      }

      const currentIndex = prevPatients.findIndex(
        (queuePatient) => `${queuePatient.id}` === `${appointmentNo}`
      );
      const removalIndex = currentIndex === -1 ? 0 : currentIndex;
      const remainingPatients = prevPatients.filter(
        (_, index) => index !== removalIndex
      );
      const nextPatient =
        remainingPatients[removalIndex] || remainingPatients[0] || null;

      if (nextPatient) {
        _setPatientName(nextPatient.name);
        _setPatientCode(nextPatient.patientCode || "");
        _setAppointmentNo(nextPatient.id ? `${nextPatient.id}` : "");
        _setPatientAge(
          typeof nextPatient.age === "number"
            ? `${nextPatient.age}`
            : nextPatient.age || ""
        );
        _setPatientGender(nextPatient.gender || "");
        _setPatientContact(nextPatient.phoneNumber || "");
      } else {
        _setPatientName("");
        _setPatientCode("");
        _setAppointmentNo("");
        _setPatientAge("");
        _setPatientGender("");
        _setPatientContact("");
        setActiveTab("patients");
      }

      return remainingPatients;
    });
  };

  const handleFinishAppointment = async () => {
    const hasComplaint = !!clinicalNoteData.presentingComplains?.trim();
    if (!hasComplaint) {
      setFinishError("Presenting Complain is required before finishing.");
      focusPresentingSection();
      return;
    }

    if (!appointmentNo || !patientCode) {
      setFinishError("Patient details are missing for this appointment.");
      return;
    }

    setIsFinishingAppointment(true);
    setFinishError("");
    setLastCompletedAppointment(null);
    const completedAppointmentId = appointmentNo;
    try {
      await saveConsultationData();
      setLastCompletedAppointment(completedAppointmentId);
      resetConsultationForms();
      advanceQueueAfterFinish();
    } catch (error) {
      console.error("Failed to finish appointment", error);
      const fallbackMessage =
        error instanceof Error
          ? error.message
          : "Unable to finish appointment. Please try again.";
      setFinishError(fallbackMessage);
    } finally {
      setIsFinishingAppointment(false);
    }
  };

  const onHoldTokens = ["003", "004"];
  const allergyTags = (clinicalNoteData.allergyNotes || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const alertTags = allergyTags.slice(0, 3);
  const hasAlerts = alertTags.length > 0;
  const hasPresentingComplaint = !!clinicalNoteData.presentingComplains?.trim();
  const canFinishAppointment =
    hasPresentingComplaint &&
    !!appointmentNo &&
    !!patientCode &&
    patients.length > 0 &&
    !isFinishingAppointment;
  const queueSnapshot = {
    pending: patients?.length || 0,
    onHold: onHoldTokens.length,
  };
  const hasAllergyInfo = allergyTags.length > 0;
  const hasSurgicalHistory =
    (clinicalNoteData?.surgicalNotes || "")
      .split("$")
      .map((tag) => tag.trim())
      .filter(Boolean).length > 0;
  const finishStatCards = [
    {
      key: "pending",
      label: "Pending Queue",
      value: queueSnapshot.pending.toString(),
      subLabel: `Next #${
        patients?.[0]?.appoNo || patients?.[0]?.patientCode || "-"
      }`,
      bgColor: "linear-gradient(135deg, #34d399 0%, #14b8a6 100%)",
      icon: "⏳",
    },
    {
      key: "current",
      label: "Current Desk",
      value: appointmentNo || "-",
      subLabel: "Tap Finish to call next",
      bgColor: "linear-gradient(135deg, #60a5fa 0%, #6366f1 100%)",
      icon: "👤",
    },
    {
      key: "hold",
      label: "On Hold",
      value: onHoldTokens.length.toString(),
      subLabel: onHoldTokens.length ? onHoldTokens.join(", ") : "None",
      bgColor: "linear-gradient(135deg, #fbbf24 0%, #f97316 100%)",
      icon: "⏸️",
    },
    {
      key: "visits",
      label: "Visits",
      value: visitCount?.toString() || "0",
      subLabel: "Last 05-04-2025",
      bgColor: "linear-gradient(135deg, #a78bfa 0%, #818cf8 100%)",
      icon: "📊",
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6 max-w-6xl mx-auto px-3 lg:px-0">
      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(400px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

      {/* Notification Toast */}
      {notification.show && (
        <div className="fixed top-9 right-0 z-50">
          <div className="p-4">
            <div
              className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-xl p-4 shadow-2xl backdrop-blur-sm max-w-sm"
              style={{
                animation:
                  "slideInRight 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div
                    className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-xl"
                    style={{
                      animation:
                        "scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    }}
                  >
                    ✓
                  </div>
                </div>
                <div className="flex-1 pr-2">
                  <h3 className="text-emerald-900 font-bold text-base">
                    {notification.message}
                  </h3>
                  <p className="text-emerald-700 text-sm">
                    <span className="font-semibold">
                      {notification.patientName}
                    </span>{" "}
                    ready for consultation
                  </p>
                </div>
                <button
                  onClick={() =>
                    setNotification((prev) => ({ ...prev, show: false }))
                  }
                  className="text-emerald-600 hover:text-emerald-900 text-2xl leading-none flex-shrink-0"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Investigation Print Preview Modal */}
      {showInvestigationPrintModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setShowInvestigationPrintModal(false)}
            ></div>

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-4 flex items-center justify-between rounded-t-xl">
                <div className="flex items-center gap-3">
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
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  <h2 className="text-xl font-bold text-white">
                    Print Investigation Prescription
                  </h2>
                </div>
                <button
                  onClick={() => setShowInvestigationPrintModal(false)}
                  className="text-white hover:text-gray-200 text-3xl leading-none"
                >
                  ×
                </button>
              </div>

              {/* Preview Content */}
              <div className="p-8" style={{ width: "176mm" }}>
                {/* Hospital Header */}
                <div
                  className="text-center pb-3 mb-4"
                  style={{ borderBottom: "2px solid #000" }}
                >
                  <div
                    className="text-xl font-bold mb-1"
                    style={{ color: "#000" }}
                  >
                    PRIME HOSPITALS PVT LTD
                  </div>
                  <div className="text-xs mb-0.5" style={{ color: "#000" }}>
                    NO 217/A-2, PUGODA ROAD, DOMPE, DOMPE
                  </div>
                  <div className="text-xs" style={{ color: "#000" }}>
                    Contact: 0112192909, 0714496828
                  </div>
                </div>

                {/* Patient Info */}
                <div className="p-3 mb-4" style={{ border: "1px solid #666" }}>
                  <div className="flex justify-between mb-2 text-sm">
                    <div style={{ color: "#000" }}>
                      <span className="font-bold">Patient Name:</span>{" "}
                      {patientName}
                    </div>
                    <div
                      className="font-mono text-lg"
                      style={{ color: "#000" }}
                    >
                      {appointmentNo}
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div style={{ color: "#000" }}>
                      <span className="font-bold">Age:</span> {patientAge} years
                    </div>
                    <div style={{ color: "#000" }}>
                      <span className="font-bold">Date:</span>{" "}
                      {new Date().toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Rx */}
                <div
                  className="font-bold text-base mb-3"
                  style={{ color: "#000" }}
                >
                  Rx
                </div>
                <div className="pt-3" style={{ borderTop: "1px solid #000" }}>
                  {selectedTests.map((test, index) => (
                    <div
                      key={index}
                      className="mb-2 text-sm pl-2"
                      style={{ color: "#000" }}
                    >
                      {index + 1}) {test.labTestName}
                    </div>
                  ))}
                </div>

                <div className="mt-4 text-xs italic" style={{ color: "#666" }}>
                  No more items on this prescription
                </div>

                {/* Footer */}
                <div
                  className="mt-8 pt-4"
                  style={{ borderTop: "1px dashed #999" }}
                >
                  <div className="text-xs mb-3" style={{ color: "#000" }}>
                    Next Visit Date: __________
                  </div>
                  <div className="mt-5">
                    <div
                      className="font-bold text-sm"
                      style={{ color: "#000" }}
                    >
                      DR DOCTOR NAME
                    </div>
                    <div
                      className="text-xs italic mt-1"
                      style={{ color: "#666" }}
                    >
                      Signature not required. This is computer generated
                      prescription.
                    </div>
                  </div>
                </div>

                <div
                  className="mt-8 text-[8px] text-center"
                  style={{ color: "#999" }}
                >
                  Software Solution By: HealthCare LA (Pvt) Ltd | +94710490851 |
                  ppa@healthcorela.lk | dileep@healthcorela@gmail.com
                </div>
              </div>

              {/* Action Buttons */}
              <div
                className="sticky bottom-0 px-6 py-4 flex gap-3 justify-end border-t rounded-b-xl"
                style={{ background: "#f9fafb" }}
              >
                <button
                  onClick={() => setShowInvestigationPrintModal(false)}
                  style={{
                    padding: "10px 24px",
                    background: "#e5e7eb",
                    color: "#1f2937",
                    borderRadius: "8px",
                    fontWeight: "600",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#d1d5db";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#e5e7eb";
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    printInvestigationPrescription();
                    setShowInvestigationPrintModal(false);
                  }}
                  style={{
                    padding: "10px 24px",
                    background: "linear-gradient(to right, #14b8a6, #10b981)",
                    color: "#fff",
                    borderRadius: "8px",
                    fontWeight: "600",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(to right, #0d9488, #059669)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(to right, #14b8a6, #10b981)";
                  }}
                >
                  <svg
                    style={{ width: "20px", height: "20px" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Medication Print Preview Modal */}
      {showMedicationPrintModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setShowMedicationPrintModal(false)}
            ></div>

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-green-500 px-6 py-4 flex items-center justify-between rounded-t-xl">
                <div className="flex items-center gap-3">
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
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  <h2 className="text-xl font-bold text-white">
                    Print Medication Prescription
                  </h2>
                </div>
                <button
                  onClick={() => setShowMedicationPrintModal(false)}
                  className="text-white hover:text-gray-200 text-3xl leading-none"
                >
                  ×
                </button>
              </div>

              {/* Preview Content */}
              <div className="p-8" style={{ width: "176mm" }}>
                {/* Hospital Header */}
                <div
                  className="text-center pb-3 mb-4"
                  style={{ borderBottom: "2px solid #000" }}
                >
                  <div
                    className="text-xl font-bold mb-1"
                    style={{ color: "#000" }}
                  >
                    PRIME HOSPITALS PVT LTD
                  </div>
                  <div className="text-xs mb-0.5" style={{ color: "#000" }}>
                    NO 217/A-2, PUGODA ROAD, DOMPE, DOMPE
                  </div>
                  <div className="text-xs" style={{ color: "#000" }}>
                    Contact: 0112192909, 0714496828
                  </div>
                </div>

                {/* Patient Info */}
                <div className="p-3 mb-4" style={{ border: "1px solid #666" }}>
                  <div className="flex justify-between mb-2 text-sm">
                    <div style={{ color: "#000" }}>
                      <span className="font-bold">Patient Name:</span>{" "}
                      {patientName} (File: {patientCode})
                    </div>
                    <div
                      className="font-mono text-lg"
                      style={{ color: "#000" }}
                    >
                      {appointmentNo}
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div style={{ color: "#000" }}>
                      <span className="font-bold">Age:</span> {patientAge} years
                    </div>
                    <div style={{ color: "#000" }}>
                      <span className="font-bold">Date:</span>{" "}
                      {new Date().toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Rx */}
                <div
                  className="font-bold text-base mb-3"
                  style={{ color: "#000" }}
                >
                  Rx
                </div>

                {/* Medications Section */}
                {prescribedMeds.length > 0 && (
                  <>
                    <div
                      className="font-bold text-sm mb-2"
                      style={{ color: "#059669" }}
                    >
                      Medications:
                    </div>
                    <div className="mb-4">
                      {prescribedMeds.map((med, index) => (
                        <div
                          key={index}
                          className="mb-3 p-2"
                          style={{
                            background: "#f9f9f9",
                            borderLeft: "3px solid #10b981",
                          }}
                        >
                          <div
                            className="font-bold text-sm mb-1"
                            style={{ color: "#000" }}
                          >
                            {index + 1}) {med.drugName}
                          </div>
                          <div
                            className="text-xs ml-3"
                            style={{ color: "#333" }}
                          >
                            <div>
                              • Strength: {med.strength} | Form: {med.form}
                            </div>
                            <div>
                              • Frequency: {med.frequency} | Duration:{" "}
                              {med.duration} days | Quantity: {med.quantity}
                            </div>
                            {med.specialInstructions && (
                              <div>
                                • Instructions: {med.specialInstructions}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Investigations Section */}
                {selectedTests.length > 0 && (
                  <>
                    <div
                      className="font-bold text-sm mb-2 mt-4"
                      style={{ color: "#059669" }}
                    >
                      Investigations:
                    </div>
                    <div
                      className="pt-3"
                      style={{ borderTop: "1px solid #000" }}
                    >
                      {selectedTests.map((test, index) => (
                        <div
                          key={index}
                          className="mb-2 text-sm pl-2"
                          style={{ color: "#000" }}
                        >
                          {index + 1}) {test.labTestName}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className="mt-4 text-xs italic" style={{ color: "#666" }}>
                  Prescription Guidelines: FBC/CRP
                </div>

                <div className="mt-2 text-xs italic" style={{ color: "#666" }}>
                  No more items on this prescription
                </div>

                {/* Footer */}
                <div
                  className="mt-8 pt-4"
                  style={{ borderTop: "1px dashed #999" }}
                >
                  <div className="text-xs mb-3" style={{ color: "#000" }}>
                    Next Visit Date: __________
                  </div>
                  <div className="mt-5">
                    <div
                      className="font-bold text-sm"
                      style={{ color: "#000" }}
                    >
                      DR DOCTOR NAME
                    </div>
                    <div
                      className="text-xs italic mt-1"
                      style={{ color: "#666" }}
                    >
                      Signature not required. This is computer generated
                      prescription.
                    </div>
                  </div>
                </div>

                <div
                  className="mt-8 text-[8px] text-center"
                  style={{ color: "#999" }}
                >
                  Software Solution By: HealthCare LA (Pvt) Ltd | +94710490851 |
                  ppa@healthcorela.lk | dileep@healthcorela@gmail.com
                </div>
              </div>

              {/* Action Buttons */}
              <div
                className="sticky bottom-0 px-6 py-4 flex gap-3 justify-end border-t rounded-b-xl"
                style={{ background: "#f9fafb" }}
              >
                <button
                  onClick={() => setShowMedicationPrintModal(false)}
                  style={{
                    padding: "10px 24px",
                    background: "#e5e7eb",
                    color: "#1f2937",
                    borderRadius: "8px",
                    fontWeight: "600",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#d1d5db";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#e5e7eb";
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    printMedicationPrescription();
                    setShowMedicationPrintModal(false);
                  }}
                  style={{
                    padding: "10px 24px",
                    background: "linear-gradient(to right, #10b981, #059669)",
                    color: "#fff",
                    borderRadius: "8px",
                    fontWeight: "600",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(to right, #059669, #047857)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(to right, #10b981, #059669)";
                  }}
                >
                  <svg
                    style={{ width: "20px", height: "20px" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      <HistoryModal
        isOpen={historyModal.isOpen}
        onClose={closeHistoryModal}
        title={historyModal.title}
        historyData={historyModal.data}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Doctor Consultation
          </h1>
          <nav className="text-sm breadcrumbs mt-1">
            <ol className="flex items-center space-x-2 text-gray-600">
              <li>
                <a href="/channel" className="hover:text-primary">
                  Front Desk
                </a>
              </li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-900">Doctor PP</li>
            </ol>
          </nav>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          <p className="text-sm text-gray-600">
            Use{" "}
            <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-semibold">
              F1-F6
            </kbd>{" "}
            to switch tabs
          </p>
        </div>
      </div>

      {/* Finish Appointment Process */}
      <div
        className={`rounded-2xl border shadow-lg p-6 mb-5 space-y-4 transition-all duration-300 ${
          isLoadingPatientData ? "opacity-75" : "opacity-100"
        }`}
        style={{
          background:
            "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #dbeafe 100%)",
          borderColor: "#93c5fd",
        }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 w-full relative">
          {isLoadingPatientData && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/50 backdrop-blur-sm z-10">
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-8 h-8">
                  <div
                    style={{
                      position: "absolute",
                      width: "32px",
                      height: "32px",
                      border: "3px solid transparent",
                      borderTop: "3px solid #10b981",
                      borderRight: "3px solid #059669",
                      borderRadius: "50%",
                      animation:
                        "spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite",
                    }}
                  ></div>
                </div>
                <span className="text-xs font-semibold text-emerald-700">
                  Loading...
                </span>
              </div>
            </div>
          )}
          {finishStatCards.map(
            ({ key, label, value, subLabel, bgColor, icon }) => (
              <div
                key={key}
                className="relative rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer"
                style={{
                  background: bgColor,
                  minHeight: "85px",
                }}
              >
                {/* Content */}
                <div
                  className="relative px-3 py-2.5 flex flex-col gap-1"
                  style={{ position: "relative", zIndex: 2 }}
                >
                  <div className="flex items-center justify-between">
                    <p
                      className="text-[9px] font-bold uppercase tracking-wide"
                      style={{ color: "#ffffff" }}
                    >
                      {label}
                    </p>
                    <span style={{ fontSize: "18px" }}>{icon}</span>
                  </div>
                  <p
                    className="text-xl font-extrabold leading-tight"
                    style={{
                      color: "#ffffff",
                      textShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    }}
                  >
                    {value}
                  </p>
                  <p
                    className="text-[9px] font-semibold"
                    style={{ color: "rgba(255,255,255,0.9)" }}
                  >
                    {subLabel}
                  </p>
                </div>
              </div>
            )
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs font-medium">
          <div
            className="px-2.5 py-1.5 rounded-lg flex items-center gap-1.5"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              border: "1px solid rgba(99, 102, 241, 0.2)",
              color: "#4f46e5",
            }}
          >
            <span className="text-sm">🎫</span>
            <span>Appointment #{appointmentNo || "-"}</span>
          </div>
          <div
            className="px-2.5 py-1.5 rounded-lg flex items-center gap-1.5"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              border: "1px solid rgba(139, 92, 246, 0.2)",
              color: "#7c3aed",
            }}
          >
            <span className="text-sm">👤</span>
            <span>{patientName || "No patient selected"}</span>
          </div>
          <div
            className="px-2.5 py-1.5 rounded-lg flex items-center gap-1.5"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              border: "1px solid rgba(20, 184, 166, 0.2)",
              color: "#14b8a6",
            }}
          >
            <span className="text-sm">🎂</span>
            <span>{patientAge || "N/A"} yrs</span>
          </div>
          <div
            className="px-2.5 py-1.5 rounded-lg flex items-center gap-1.5"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              color: "#3b82f6",
            }}
          >
            <span className="text-sm">
              {patientGender === "Male" ? "♂️" : "♀️"}
            </span>
            <span>{patientGender || "N/A"}</span>
          </div>
          <div
            className="px-2.5 py-1.5 rounded-lg flex items-center gap-1.5"
            style={{
              backgroundColor: hasAllergyInfo
                ? "rgba(254, 226, 226, 0.8)"
                : "rgba(255, 255, 255, 0.6)",
              border: hasAllergyInfo
                ? "1px solid rgba(239, 68, 68, 0.3)"
                : "1px solid rgba(148, 163, 184, 0.2)",
              color: hasAllergyInfo ? "#dc2626" : "#64748b",
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: hasAllergyInfo ? "#ef4444" : "#94a3b8",
                animation: hasAllergyInfo
                  ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
                  : "none",
              }}
            ></span>
            <span>
              Allergy Info: {hasAllergyInfo ? "Available" : "Not available"}
            </span>
          </div>
          <div
            className="px-2.5 py-1.5 rounded-lg flex items-center gap-1.5"
            style={{
              backgroundColor: hasSurgicalHistory
                ? "rgba(254, 226, 226, 0.8)"
                : "rgba(255, 255, 255, 0.6)",
              border: hasSurgicalHistory
                ? "1px solid rgba(239, 68, 68, 0.3)"
                : "1px solid rgba(148, 163, 184, 0.2)",
              color: hasSurgicalHistory ? "#dc2626" : "#64748b",
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: hasSurgicalHistory ? "#ef4444" : "#94a3b8",
                animation: hasSurgicalHistory
                  ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
                  : "none",
              }}
            ></span>
            <span>
              Surgical History:{" "}
              {hasSurgicalHistory ? "Available" : "Not available"}
            </span>
          </div>
        </div>

        {/* Next Visit Date and Doctor Charge Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-[10px] font-semibold text-gray-700 mb-1">
              Next Visit Date
            </label>
            <input
              type="date"
              value={nextVisitDate}
              onChange={(e) => setNextVisitDate(e.target.value)}
              style={{
                fontSize: "12px",
                backgroundColor: "rgba(236, 253, 245, 0.6)",
                borderColor: "rgba(16, 185, 129, 0.3)",
              }}
              className="w-full px-3 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent hover:border-emerald-400 hover:shadow-sm transition-all"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-700 mb-1">
              Reference for Charging
            </label>
            <input
              type="text"
              value={chargingReference}
              onChange={(e) => setChargingReference(e.target.value)}
              list="charging-references"
              style={{
                fontSize: "12px",
                backgroundColor: "rgba(239, 246, 255, 0.6)",
                borderColor: "rgba(59, 130, 246, 0.3)",
              }}
              className="w-full px-3 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-blue-400 hover:shadow-sm transition-all"
              placeholder="Type or select reference"
            />
            <datalist id="charging-references">
              <option value="Consultation" />
              <option value="Follow-up" />
              <option value="Emergency Visit" />
              <option value="Procedure" />
              <option value="Surgery Consultation" />
              <option value="Second Opinion" />
              <option value="Prescription Only" />
              <option value="Medical Certificate" />
            </datalist>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-700 mb-1">
              Doctor Charge (Rs.)
            </label>
            <input
              type="number"
              value={doctorCharge}
              onChange={(e) => setDoctorCharge(e.target.value)}
              style={{
                fontSize: "12px",
                backgroundColor: "rgba(240, 253, 244, 0.6)",
                borderColor: "rgba(34, 197, 94, 0.3)",
              }}
              className="w-full px-3 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent hover:border-emerald-400 hover:shadow-sm transition-all"
              placeholder="Enter doctor charge"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mt-4">
          <div className="space-y-1 max-w-2xl">
            <p className="flex items-center gap-2 text-[13px] font-semibold text-indigo-900">
              <CheckCircleIcon
                className={`h-4 w-4 ${
                  hasPresentingComplaint ? "text-emerald-500" : "text-gray-300"
                }`}
              />
              {hasPresentingComplaint
                ? "Presenting complain captured"
                : "Waiting for presenting complain"}
            </p>
            <p className="text-[13px] text-gray-600">
              {hasPresentingComplaint
                ? "You can finish this appointment from any tab once you are ready."
                : "Enter the presenting complain to enable Finish & Next."}
            </p>
            {lastCompletedAppointment && (
              <p className="text-[13px] text-emerald-600">
                Appointment #{lastCompletedAppointment} sent to backend.
                {patients.length
                  ? " Next patient loaded."
                  : " No more patients in queue."}
              </p>
            )}
            {finishError && (
              <p className="text-[13px] text-red-600 flex items-center gap-1">
                <ExclamationTriangleIcon className="h-4 w-4" />
                {finishError}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full max-w-sm">
            <button
              type="button"
              onClick={focusPresentingSection}
              disabled={isFinishingAppointment}
              className="flex-1 inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-1.5 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Review Presenting
            </button>
            <button
              type="button"
              onClick={handleFinishAppointment}
              disabled={!canFinishAppointment}
              className={`flex-1 inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-[13px] font-semibold text-white ${
                canFinishAppointment
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-emerald-200 cursor-not-allowed"
              }`}
            >
              {isFinishingAppointment ? "Finishing..." : "Finish & Next"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100">
        {/* Tab Headers */}
        <div className="border-b border-gray-100">
          <div className="relative px-3 py-3">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-50/80 via-white to-emerald-50/80 opacity-80 blur-[1px]"></div>
            <div className="relative flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-1">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] md:text-[12px] font-semibold leading-tight transition-all border whitespace-nowrap ${
                        isActive
                          ? "bg-white text-emerald-600 border-emerald-200 shadow-sm"
                          : "text-gray-500 border-transparent hover:border-gray-200 hover:bg-white/80"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-lg border ${
                          isActive
                            ? "border-emerald-200 bg-emerald-50 text-emerald-500"
                            : "border-gray-200 bg-gray-50 text-gray-400"
                        }`}
                      >
                        {tab.icon}
                      </span>
                      <span className="text-[11px] md:text-[12px]">
                        {tab.label}
                      </span>
                      <span
                        className={`text-[8px] font-black tracking-widest rounded-md border px-1 py-0.5 ${
                          isActive
                            ? "border-emerald-200 bg-emerald-500/10 text-emerald-600"
                            : "border-gray-200 bg-gray-100 text-gray-500"
                        }`}
                      >
                        {tab.shortcut}
                      </span>
                      {isActive && (
                        <span className="absolute -bottom-2 left-4 right-4 h-0.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.45)]"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {/* Patients Tab */}
          {activeTab === "patients" && (
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "20px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                overflow: "hidden",
              }}
            >
              {/* Modern Table Content */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr
                      style={{
                        background:
                          "linear-gradient(to right, #f8f9ff 0%, #f0f4ff 100%)",
                        borderBottom: "2px solid #e0e7ff",
                      }}
                    >
                      {[
                        { label: "Appt No", align: "left" },
                        { label: "Patient Name", align: "left" },
                        { label: "Age", align: "left" },
                        { label: "Gender", align: "left" },
                        { label: "Status", align: "left" },
                        { label: "Action", align: "center" },
                      ].map(({ label }) => (
                        <th
                          key={label}
                          style={{
                            padding: "10px 14px",
                            textAlign: "center",
                            fontSize: "10px",
                            fontWeight: "700",
                            color: "#5b6b8c",
                            textTransform: "uppercase",
                            letterSpacing: "0.6px",
                          }}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody style={{ backgroundColor: "#ffffff" }}>
                    {isLoadingPatients ? (
                      <tr>
                        <td
                          colSpan={6}
                          style={{ padding: "70px 24px", textAlign: "center" }}
                        >
                          <div className="flex flex-col items-center gap-4">
                            <div
                              style={{
                                position: "relative",
                                width: "56px",
                                height: "56px",
                              }}
                            >
                              <div
                                style={{
                                  position: "absolute",
                                  width: "56px",
                                  height: "56px",
                                  border: "4px solid transparent",
                                  borderTop: "4px solid #667eea",
                                  borderRight: "4px solid #764ba2",
                                  borderRadius: "50%",
                                  animation:
                                    "spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite",
                                }}
                              ></div>
                              <div
                                style={{
                                  position: "absolute",
                                  top: "8px",
                                  left: "8px",
                                  width: "40px",
                                  height: "40px",
                                  border: "3px solid transparent",
                                  borderLeft:
                                    "3px solid rgba(102, 126, 234, 0.3)",
                                  borderRadius: "50%",
                                  animation:
                                    "spin 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite reverse",
                                }}
                              ></div>
                            </div>
                            <p
                              style={{
                                color: "#667eea",
                                fontSize: "14px",
                                fontWeight: "600",
                                letterSpacing: "0.3px",
                              }}
                            >
                              Loading appointments...
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : patients && patients.length > 0 ? (
                      patients.map((patient, index) => {
                        const rowBaseColor =
                          index % 2 === 0 ? "#ffffff" : "#f8fbff";
                        const rowAccent =
                          patient?.situationColor === "danger"
                            ? "#f97316"
                            : "#10b981";
                        const statusText = patient?.situation || "Pending";
                        const normalizedStatus = statusText.toLowerCase();
                        const statusMeta = normalizedStatus.includes("emerg")
                          ? {
                              bg: "#fef2f2",
                              textColor: "#991b1b",
                              border: "#fecaca",
                              iconColor: "#f87171",
                              hint: "Flagged as urgent - prioritize before continuing the queue.",
                              icon: ExclamationTriangleIcon,
                            }
                          : normalizedStatus.includes("hold")
                          ? {
                              bg: "#fff7ed",
                              textColor: "#9a3412",
                              border: "#fed7aa",
                              iconColor: "#f97316",
                              hint: "Patient is temporarily paused until you resume.",
                              icon: PauseCircleIcon,
                            }
                          : normalizedStatus.includes("pending") ||
                            normalizedStatus.includes("wait")
                          ? {
                              bg: "#ecfccb",
                              textColor: "#365314",
                              border: "#bef264",
                              iconColor: "#65a30d",
                              hint: "Waiting in queue for the doctor to call.",
                              icon: ClockIcon,
                            }
                          : {
                              bg: "#e0f2fe",
                              textColor: "#0c4a6e",
                              border: "#bae6fd",
                              iconColor: "#0284c7",
                              hint: "Patient is being managed without alerts.",
                              icon: CheckCircleIcon,
                            };
                        const StatusIcon = statusMeta.icon;

                        return (
                          <tr
                            key={patient?.id || index}
                            style={{
                              borderBottom: "1px solid #f1f3f9",
                              backgroundColor: rowBaseColor,
                              transition:
                                "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                              borderLeft: `4px solid ${rowAccent}`,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#f0f4ff";
                              e.currentTarget.style.transform =
                                "translateX(4px)";
                              e.currentTarget.style.boxShadow =
                                "0 4px 12px rgba(102, 126, 234, 0.08)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                rowBaseColor;
                              e.currentTarget.style.transform = "translateX(0)";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          >
                            <td
                              style={{
                                padding: "12px 16px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  color: "#667eea",
                                  fontFamily: "monospace",
                                }}
                              >
                                #{patient?.appoNo || "—"}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  color: "#2d3748",
                                  letterSpacing: "0.2px",
                                }}
                              >
                                {patient?.name || "N/A"}
                              </div>
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "12px",
                                  color: "#64748b",
                                  fontWeight: "500",
                                }}
                              >
                                {patient?.age || "N/A"} yrs
                              </div>
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <span
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: "8px",
                                  fontSize: "11px",
                                  fontWeight: "600",
                                  backgroundColor:
                                    patient?.gender === "Male"
                                      ? "#eff6ff"
                                      : "#fdf2f8",
                                  color:
                                    patient?.gender === "Male"
                                      ? "#3b82f6"
                                      : "#ec4899",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                {patient?.gender === "Male" ? "♂" : "♀"}{" "}
                                {patient?.gender || "N/A"}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <span
                                title={statusMeta.hint}
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: "12px",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  backgroundColor: statusMeta.bg,
                                  color: statusMeta.textColor,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                                  border: "1px solid",
                                  borderColor: statusMeta.border,
                                }}
                              >
                                <StatusIcon
                                  className="h-4 w-4"
                                  style={{ color: statusMeta.iconColor }}
                                />
                                <span>{statusText}</span>
                                <span
                                  style={{
                                    fontSize: "10px",
                                    fontWeight: "500",
                                    opacity: 0.8,
                                  }}
                                >
                                  #{patient?.appoNo || "--"}
                                </span>
                              </span>
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                textAlign: "center",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <button
                                onClick={() => {
                                  console.log("View patient:", patient);

                                  // Start loading animation
                                  setIsLoadingPatientData(true);

                                  // Simulate loading delay for UI effect
                                  setTimeout(() => {
                                    _setPatientName(patient.name);
                                    _setPatientCode(patient.patientCode || "");
                                    _setAppointmentNo(`${patient.id}`);
                                    _setPatientAge(patient.age as string);
                                    _setPatientGender(patient.gender);
                                    _setPatientContact(patient.phoneNumber);

                                    // Reset all sections to default collapsed state
                                    setExpandedExamSections([]);
                                    setExpandedPresentingSections([]);
                                    setExpandedDiagnosisSections([]);

                                    // Clear all clinical data for new patient
                                    setClinicalNoteData({
                                      presentingComplains: "",
                                      medicalNotes: "",
                                      surgicalNotes: "",
                                      allergyNotes: "",
                                      presentingTemplateComment: "",
                                    });
                                    setExaminationData({
                                      general: "",
                                      cardioVascular: "",
                                      respiratory: "",
                                      centralNurve: "",
                                      gartroIntestinal: "",
                                    });
                                    setDiagnosisData({
                                      infectiousDiseases: "",
                                      chronicDiseases: "",
                                      gastrointestinal: "",
                                      neurological: "",
                                      musculoskeletal: "",
                                      other: "",
                                    });
                                    setSelectedTests([]);
                                    setInvestigationSearchTerm("");

                                    // Show notification and scroll to top
                                    setNotification({
                                      show: true,
                                      message: "Patient loaded successfully",
                                      patientName: patient.name,
                                    });

                                    // Scroll to top of page
                                    window.scrollTo({
                                      top: 0,
                                      behavior: "smooth",
                                    });

                                    // End loading animation
                                    setIsLoadingPatientData(false);

                                    // Auto-hide notification after 3 seconds
                                    setTimeout(() => {
                                      setNotification((prev) => ({
                                        ...prev,
                                        show: false,
                                      }));
                                    }, 3000);
                                  }, 600);
                                }}
                                style={{
                                  padding: "8px 18px",
                                  background:
                                    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                  color: "#ffffff",
                                  borderRadius: "12px",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  border: "none",
                                  cursor: "pointer",
                                  transition:
                                    "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                  boxShadow:
                                    "0 4px 12px rgba(16, 185, 129, 0.3)",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform =
                                    "translateY(-3px)";
                                  e.currentTarget.style.boxShadow =
                                    "0 8px 20px rgba(16, 185, 129, 0.4)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform =
                                    "translateY(0)";
                                  e.currentTarget.style.boxShadow =
                                    "0 4px 12px rgba(16, 185, 129, 0.3)";
                                }}
                              >
                                <svg
                                  style={{ width: "16px", height: "16px" }}
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
                                Select
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : patientsError ? (
                      <tr>
                        <td
                          colSpan={6}
                          style={{ padding: "80px 24px", textAlign: "center" }}
                        >
                          <div className="flex flex-col items-center gap-5">
                            <div
                              style={{
                                width: "80px",
                                height: "80px",
                                background:
                                  "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 8px 24px rgba(239, 68, 68, 0.2)",
                                position: "relative",
                              }}
                            >
                              <div
                                style={{
                                  position: "absolute",
                                  width: "100%",
                                  height: "100%",
                                  borderRadius: "50%",
                                  border: "3px solid rgba(239, 68, 68, 0.2)",
                                  animation: "pulse 2s ease-in-out infinite",
                                }}
                              ></div>
                              <svg
                                style={{ width: "40px", height: "40px" }}
                                fill="none"
                                stroke="#ef4444"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <div>
                              <p
                                style={{
                                  color: "#1e293b",
                                  fontWeight: "700",
                                  fontSize: "17px",
                                  marginBottom: "6px",
                                }}
                              >
                                Error loading appointments
                              </p>
                              <p
                                style={{
                                  fontSize: "14px",
                                  color: "#64748b",
                                  marginTop: "6px",
                                }}
                              >
                                {patientsError}
                              </p>
                            </div>
                            {/*<button*/}
                            {/*    onClick={fetchPatients}*/}
                            {/*    style={{*/}
                            {/*        marginTop: "12px",*/}
                            {/*        padding: "12px 32px",*/}
                            {/*        background:*/}
                            {/*            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",*/}
                            {/*        color: "#ffffff",*/}
                            {/*        borderRadius: "12px",*/}
                            {/*        fontWeight: "600",*/}
                            {/*        fontSize: "14px",*/}
                            {/*        border: "none",*/}
                            {/*        cursor: "pointer",*/}
                            {/*        transition:*/}
                            {/*            "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",*/}
                            {/*        boxShadow:*/}
                            {/*            "0 4px 12px rgba(102, 126, 234, 0.3)",*/}
                            {/*    }}*/}
                            {/*    onMouseEnter={(e) => {*/}
                            {/*        e.currentTarget.style.transform =*/}
                            {/*            "translateY(-3px)";*/}
                            {/*        e.currentTarget.style.boxShadow =*/}
                            {/*            "0 8px 20px rgba(102, 126, 234, 0.4)";*/}
                            {/*    }}*/}
                            {/*    onMouseLeave={(e) => {*/}
                            {/*        e.currentTarget.style.transform =*/}
                            {/*            "translateY(0)";*/}
                            {/*        e.currentTarget.style.boxShadow =*/}
                            {/*            "0 4px 12px rgba(102, 126, 234, 0.3)";*/}
                            {/*    }}*/}
                            {/*>*/}
                            {/*    Try Again*/}
                            {/*</button>*/}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          style={{ padding: "80px 24px", textAlign: "center" }}
                        >
                          <div className="flex flex-col items-center gap-5">
                            <div
                              style={{
                                width: "80px",
                                height: "80px",
                                background:
                                  "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                              }}
                            >
                              <svg
                                style={{ width: "40px", height: "40px" }}
                                fill="none"
                                stroke="#94a3b8"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                />
                              </svg>
                            </div>
                            <div>
                              <p
                                style={{
                                  color: "#1e293b",
                                  fontWeight: "700",
                                  fontSize: "17px",
                                  marginBottom: "6px",
                                }}
                              >
                                No appointments scheduled
                              </p>
                              <p
                                style={{
                                  fontSize: "14px",
                                  color: "#64748b",
                                  marginTop: "6px",
                                }}
                              >
                                Appointments will appear here once scheduled
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Presenting Tab */}
          {activeTab === "presenting" && (
            <div className="space-y-3">
              {/* Common Templates Bar - temporarily disabled */}
              {/*
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-2.5">
                <div className="flex items-center gap-2 mb-2">
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span className="text-sm font-bold text-emerald-800">
                    🎯 Quick Templates
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {quickTemplates.map((template, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const currentValue =
                          clinicalNoteData?.presentingComplains || "";
                        // Check if already exists
                        const existingTags = currentValue
                          .split(",")
                          .map((t) => t.trim());
                        if (existingTags.includes(template.text)) return;

                        const newValue = currentValue
                          ? currentValue + "," + template.text
                          : template.text;
                        setClinicalNoteData((p) => ({
                          ...p,
                          presentingComplains: newValue,
                        }));
                      }}
                      className="px-2.5 py-1 text-sm font-semibold rounded-md border-2 transition-all hover:shadow-md"
                      style={{
                        borderColor: "#10b98160",
                        color: "#10b981",
                        backgroundColor: "#ffffff",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#10b98115";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#ffffff";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      {template.label}
                    </button>
                  ))}
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    <span>Comment</span>
                    <span className="text-gray-400">
                      {(clinicalNoteData.presentingTemplateComment || "").length}/200
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    maxLength={200}
                    className="w-full rounded-lg border-2 border-emerald-100 bg-white/80 px-3 py-2 text-sm text-gray-700 shadow-inner focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all placeholder:text-gray-400"
                    placeholder="Add context or notes for the selected templates..."
                    value={clinicalNoteData.presentingTemplateComment || ""}
                    onChange={(e) =>
                      setClinicalNoteData((prev) => ({
                        ...prev,
                        presentingTemplateComment: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              */}

              <div className="space-y-2">
                {/* Presenting Complain */}
                {(() => {
                  const isExpanded = expandedPresentingSections.includes(
                    "Presenting Complain"
                  );
                  const historyEntries =
                    presentingHistoryData["Presenting Complain"] || [];
                  const hasHistory = historyEntries.length > 0;
                  const headerGradient = hasHistory
                    ? historyHighlightGradient
                    : "from-green-50 to-emerald-50";
                  const tags = (clinicalNoteData?.presentingComplains || "")
                    .split("$")
                    .map((t) => t.trim())
                    .filter((t) => t);

                  return (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                      {/* Header - Collapsible */}
                      <div
                        className={`bg-gradient-to-r ${headerGradient} p-2 cursor-pointer hover:opacity-90 transition-all ${getHistoryHeaderAccent(
                          hasHistory
                        )}`}
                        onClick={() =>
                          togglePresentingSection(
                            "Presenting Complain",
                            () => presentingComplainsInputRef.current
                          )
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                              <span
                                className="rounded-lg flex items-center justify-center shadow-sm"
                                style={{
                                  width: "24px",
                                  height: "24px",
                                  backgroundColor: "#10b981",
                                  color: "#ffffff",
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                }}
                              >
                                1
                              </span>
                              Presenting Complain
                            </h4>
                            {tags.length > 0 ? (
                              <span
                                className="px-2 py-0.5 rounded-full text-sm font-bold"
                                style={{
                                  backgroundColor: "#10b98120",
                                  color: "#10b981",
                                }}
                              >
                                {tags.length} items
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 font-medium">
                                Empty
                              </span>
                            )}
                          </div>

                          {/* Tag Preview Bar - Always visible when has data */}
                          {tags.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              {tags.slice(0, 3).map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.5 rounded text-xs font-medium"
                                  style={{
                                    backgroundColor: "#10b98125",
                                    color: "#10b981",
                                    border: "1px solid #10b98150",
                                  }}
                                >
                                  {tag}
                                </span>
                              ))}
                              {tags.length > 3 && (
                                <span
                                  className="text-sm font-semibold"
                                  style={{ color: "#10b981" }}
                                >
                                  +{tags.length - 3} more
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openHistoryModal(
                                  "Presenting Complain",
                                  historyEntries
                                );
                              }}
                              className={getHistoryButtonClasses(hasHistory)}
                            >
                              <svg
                                className="w-3 h-3"
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
                              <span className="hidden sm:inline">History</span>
                            </button>
                            <svg
                              className={`w-4 h-4 text-gray-600 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Content - Expandable */}
                      {isExpanded && (
                        <div className="p-2.5">
                          {/* Quick Add Tags */}
                          <div className="mb-2">
                            <div className="flex items-center gap-1 mb-1.5">
                              <svg
                                className="w-3 h-3 text-gray-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                              </svg>
                              <span className="text-sm font-semibold text-gray-600">
                                Quick Add:
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {presentingComplainSymptoms.map(
                                (symptom, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      const currentValue =
                                        clinicalNoteData?.presentingComplains ||
                                        "";
                                      // Check if already exists
                                      const existingTags = currentValue
                                        .split("$")
                                        .map((t) => t.trim());
                                      if (existingTags.includes(symptom))
                                        return;

                                      const newValue = currentValue
                                        ? currentValue + "$" + symptom
                                        : symptom;
                                      setClinicalNoteData((p) => ({
                                        ...p,
                                        presentingComplains: newValue,
                                      }));
                                    }}
                                    className="px-2 py-0.5 text-sm font-medium rounded border transition-all hover:shadow-sm"
                                    style={{
                                      borderColor: "#10b98160",
                                      color: "#10b981",
                                      backgroundColor: "#ffffff",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor =
                                        "#10b98110";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor =
                                        "#ffffff";
                                    }}
                                  >
                                    + {symptom}
                                  </button>
                                )
                              )}
                            </div>
                          </div>

                          {/* Tags Display */}
                          <div className="mb-2">
                            <div className="flex flex-wrap gap-1 min-h-[32px] p-2 bg-gray-50 rounded border border-gray-200">
                              {tags.length > 0 ? (
                                tags.map((tag, tagIdx) => (
                                  <span
                                    key={tagIdx}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm font-medium"
                                    style={{
                                      backgroundColor: "#10b98120",
                                      color: "#10b981",
                                      border: "1px solid #10b98140",
                                    }}
                                  >
                                    {tag}
                                    <button
                                      onClick={() => {
                                        const newValue = (
                                          clinicalNoteData?.presentingComplains ||
                                          ""
                                        )
                                          .split("$")
                                          .map((t) => t.trim())
                                          .filter((t) => t !== tag)
                                          .join("$");
                                        setClinicalNoteData((p) => ({
                                          ...p,
                                          presentingComplains: newValue,
                                        }));
                                      }}
                                      className="hover:text-red-600"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))
                              ) : (
                                <span className="text-sm text-gray-400">
                                  No symptoms entered yet...
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Text Input with Enter to Add */}
                          <div className="mb-2">
                            <input
                              type="text"
                              ref={presentingComplainsInputRef}
                              className="input-field text-sm"
                              placeholder="Type symptom and press Enter to add..."
                              onKeyDown={(e) => {
                                if (
                                  e.key === "Enter" &&
                                  e.currentTarget.value.trim()
                                ) {
                                  const newSymptom =
                                    e.currentTarget.value.trim();
                                  const currentValue =
                                    clinicalNoteData?.presentingComplains || "";
                                  const existingTags = currentValue
                                    .split("$")
                                    .map((t) => t.trim());

                                  if (!existingTags.includes(newSymptom)) {
                                    const newValue = currentValue
                                      ? currentValue + "$" + newSymptom
                                      : newSymptom;
                                    setClinicalNoteData((p) => ({
                                      ...p,
                                      presentingComplains: newValue,
                                    }));
                                  }
                                  e.currentTarget.value = "";
                                }
                              }}
                            />
                            <p className="text-sm text-gray-500 mt-1">
                              💡 Press Enter to add symptom
                            </p>
                          </div>

                          {/* Last Visit History */}
                          <div className="mb-2 p-2 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg">
                            <div className="flex items-center gap-1 mb-1">
                              <svg
                                className="w-3 h-3 text-amber-600"
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
                              <span className="text-sm font-bold text-amber-800">
                                Last Visit History
                              </span>
                              <span className="text-sm text-amber-600 ml-auto">
                                2024-12-15
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {["Fever", "Headache", "Body ache"].map(
                                (item, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded text-sm font-medium bg-white"
                                    style={{
                                      color: "#10b981",
                                      border: "1px solid #10b98140",
                                    }}
                                  >
                                    {item}
                                  </span>
                                )
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="mt-2 flex gap-1.5">
                            <div className="flex-1" />
                            {/* <button
                              onClick={() => {
                                console.log(clinicalNoteData);
                              }}
                              className="bg-gray-500 hover:bg-gray-600 text-white text-sm flex-1 py-1.5 rounded-lg font-semibold transition-all shadow-sm"
                            >
                              <svg
                                className="w-3 h-3 inline mr-1"
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
                              Save
                            </button> */}
                            <button
                              onClick={() =>
                                setClinicalNoteData((p) => ({
                                  ...p,
                                  presentingComplains: "",
                                }))
                              }
                              className="bg-gray-300 hover:bg-gray-400 text-gray-700 text-sm py-1.5 px-3 rounded-lg font-semibold transition-all shadow-sm"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Medical History */}
                {(() => {
                  const isExpanded =
                    expandedPresentingSections.includes("Medical History");
                  const historyEntries =
                    presentingHistoryData["Medical History"] || [];
                  const hasHistory = historyEntries.length > 0;
                  const headerGradient = hasHistory
                    ? historyHighlightGradient
                    : "from-blue-50 to-indigo-50";
                  const tags = (clinicalNoteData?.medicalNotes || "")
                    .split("$")
                    .map((t) => t.trim())
                    .filter((t) => t);

                  return (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                      {/* Header - Collapsible */}
                      <div
                        className={`bg-gradient-to-r ${headerGradient} p-2 cursor-pointer hover:opacity-90 transition-all ${getHistoryHeaderAccent(
                          hasHistory
                        )}`}
                        onClick={() =>
                          togglePresentingSection(
                            "Medical History",
                            () => medicalHistoryInputRef.current
                          )
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                              <span
                                className="rounded-lg flex items-center justify-center shadow-sm"
                                style={{
                                  width: "24px",
                                  height: "24px",
                                  backgroundColor: "#3b82f6",
                                  color: "#ffffff",
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                }}
                              >
                                2
                              </span>
                              Medical History
                            </h4>
                            {tags.length > 0 ? (
                              <span
                                className="px-2 py-0.5 rounded-full text-sm font-bold"
                                style={{
                                  backgroundColor: "#3b82f620",
                                  color: "#3b82f6",
                                }}
                              >
                                {tags.length} items
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 font-medium">
                                Empty
                              </span>
                            )}
                          </div>

                          {/* Tag Preview Bar - Always visible when has data */}
                          {tags.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              {tags.slice(0, 3).map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.5 rounded text-xs font-medium"
                                  style={{
                                    backgroundColor: "#3b82f625",
                                    color: "#3b82f6",
                                    border: "1px solid #3b82f650",
                                  }}
                                >
                                  {tag}
                                </span>
                              ))}
                              {tags.length > 3 && (
                                <span
                                  className="text-xs font-semibold"
                                  style={{ color: "#3b82f6" }}
                                >
                                  +{tags.length - 3} more
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openHistoryModal(
                                  "Medical History",
                                  historyEntries
                                );
                              }}
                              className={getHistoryButtonClasses(hasHistory)}
                            >
                              <svg
                                className="w-3 h-3"
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
                              <span className="hidden sm:inline">History</span>
                            </button>
                            <svg
                              className={`w-4 h-4 text-gray-600 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Content - Expandable */}
                      {isExpanded && (
                        <div className="p-2.5">
                          {/* Quick Add Tags */}
                          <div className="mb-2">
                            <div className="flex items-center gap-1 mb-1.5">
                              <svg
                                className="w-3 h-3 text-gray-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                              </svg>
                              <span className="text-xs font-semibold text-gray-600">
                                Quick Add:
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {medicalHistoryConditions.map(
                                (condition, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      const currentValue =
                                        clinicalNoteData?.medicalNotes || "";
                                      // Check if already exists
                                      const existingTags = currentValue
                                        .split("$")
                                        .map((t) => t.trim());
                                      if (existingTags.includes(condition))
                                        return;

                                      const newValue = currentValue
                                        ? currentValue + "$" + condition
                                        : condition;
                                      setClinicalNoteData((p) => ({
                                        ...p,
                                        medicalNotes: newValue,
                                      }));
                                    }}
                                    className="px-2 py-0.5 text-xs font-medium rounded border transition-all hover:shadow-sm"
                                    style={{
                                      borderColor: "#3b82f660",
                                      color: "#3b82f6",
                                      backgroundColor: "#ffffff",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor =
                                        "#3b82f610";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor =
                                        "#ffffff";
                                    }}
                                  >
                                    + {condition}
                                  </button>
                                )
                              )}
                            </div>
                          </div>

                          {/* Tags Display */}
                          <div className="mb-2">
                            <div className="flex flex-wrap gap-1 min-h-[32px] p-2 bg-gray-50 rounded border border-gray-200">
                              {tags.length > 0 ? (
                                tags.map((tag, tagIdx) => (
                                  <span
                                    key={tagIdx}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                                    style={{
                                      backgroundColor: "#3b82f620",
                                      color: "#3b82f6",
                                      border: "1px solid #3b82f640",
                                    }}
                                  >
                                    {tag}
                                    <button
                                      onClick={() => {
                                        const newValue = (
                                          clinicalNoteData?.medicalNotes || ""
                                        )
                                          .split("$")
                                          .map((t) => t.trim())
                                          .filter((t) => t !== tag)
                                          .join("$");
                                        setClinicalNoteData((p) => ({
                                          ...p,
                                          medicalNotes: newValue,
                                        }));
                                      }}
                                      className="hover:text-red-600"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-gray-400">
                                  No medical history entered yet...
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Text Input with Enter to Add */}
                          <div className="mb-2">
                            <input
                              type="text"
                              ref={medicalHistoryInputRef}
                              className="input-field text-xs"
                              placeholder="Type condition and press Enter to add..."
                              onKeyDown={(e) => {
                                if (
                                  e.key === "Enter" &&
                                  e.currentTarget.value.trim()
                                ) {
                                  const newCondition =
                                    e.currentTarget.value.trim();
                                  const currentValue =
                                    clinicalNoteData?.medicalNotes || "";
                                  const existingTags = currentValue
                                    .split("$")
                                    .map((t) => t.trim());

                                  if (!existingTags.includes(newCondition)) {
                                    const newValue = currentValue
                                      ? currentValue + "$" + newCondition
                                      : newCondition;
                                    setClinicalNoteData((p) => ({
                                      ...p,
                                      medicalNotes: newValue,
                                    }));
                                  }
                                  e.currentTarget.value = "";
                                }
                              }}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              💡 Press Enter to add condition
                            </p>
                          </div>

                          {/* Last Visit History */}
                          <div className="mb-2 p-2 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg">
                            <div className="flex items-center gap-1 mb-1">
                              <svg
                                className="w-3 h-3 text-amber-600"
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
                              <span className="text-xs font-bold text-amber-800">
                                Last Visit History
                              </span>
                              <span className="text-xs text-amber-600 ml-auto">
                                2024-10-20
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {["Diabetes Type 2", "Hypertension"].map(
                                (item, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded text-xs font-medium bg-white"
                                    style={{
                                      color: "#3b82f6",
                                      border: "1px solid #3b82f640",
                                    }}
                                  >
                                    {item}
                                  </span>
                                )
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="mt-2 flex gap-1.5">
                            <div className="flex-1" />
                            {/* <button className="bg-gray-500 hover:bg-gray-600 text-white text-xs flex-1 py-1.5 rounded-lg font-semibold transition-all shadow-sm">
                              <svg
                                className="w-3 h-3 inline mr-1"
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
                              Save
                            </button> */}
                            <button
                              onClick={() =>
                                setClinicalNoteData((p) => ({
                                  ...p,
                                  medicalNotes: "",
                                }))
                              }
                              className="bg-gray-300 hover:bg-gray-400 text-gray-700 text-xs py-1.5 px-3 rounded-lg font-semibold transition-all shadow-sm"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Surgical History */}
                {(() => {
                  const isExpanded =
                    expandedPresentingSections.includes("Surgical History");
                  const historyEntries =
                    presentingHistoryData["Surgical History"] || [];
                  const hasHistory = historyEntries.length > 0;
                  const headerGradient = hasHistory
                    ? historyHighlightGradient
                    : "from-purple-50 to-pink-50";
                  const tags = (clinicalNoteData?.surgicalNotes || "")
                    .split("$")
                    .map((t) => t.trim())
                    .filter((t) => t);

                  return (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                      {/* Header - Collapsible */}
                      <div
                        className={`bg-gradient-to-r ${headerGradient} p-2 cursor-pointer hover:opacity-90 transition-all ${getHistoryHeaderAccent(
                          hasHistory
                        )}`}
                        onClick={() =>
                          togglePresentingSection(
                            "Surgical History",
                            () => surgicalHistoryInputRef.current
                          )
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-gray-800 flex items-center gap-2">
                              <span
                                className="rounded-lg flex items-center justify-center shadow-sm"
                                style={{
                                  width: "24px",
                                  height: "24px",
                                  backgroundColor: "#a855f7",
                                  color: "#ffffff",
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                }}
                              >
                                3
                              </span>
                              Surgical History
                            </h4>
                            {tags.length > 0 ? (
                              <span
                                className="px-2 py-0.5 rounded-full text-xs font-bold"
                                style={{
                                  backgroundColor: "#a855f720",
                                  color: "#a855f7",
                                }}
                              >
                                {tags.length} items
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 font-medium">
                                Empty
                              </span>
                            )}
                          </div>

                          {/* Tag Preview Bar - Always visible when has data */}
                          {tags.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              {tags.slice(0, 3).map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.5 rounded text-xs font-medium"
                                  style={{
                                    backgroundColor: "#a855f725",
                                    color: "#a855f7",
                                    border: "1px solid #a855f750",
                                  }}
                                >
                                  {tag}
                                </span>
                              ))}
                              {tags.length > 3 && (
                                <span
                                  className="text-xs font-semibold"
                                  style={{ color: "#a855f7" }}
                                >
                                  +{tags.length - 3} more
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openHistoryModal(
                                  "Surgical History",
                                  historyEntries
                                );
                              }}
                              className={getHistoryButtonClasses(hasHistory)}
                            >
                              <svg
                                className="w-3 h-3"
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
                              <span className="hidden sm:inline">History</span>
                            </button>
                            <svg
                              className={`w-4 h-4 text-gray-600 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Content - Expandable */}
                      {isExpanded && (
                        <div className="p-2.5">
                          {/* Quick Add Tags */}
                          <div className="mb-2">
                            <div className="flex items-center gap-1 mb-1.5">
                              <svg
                                className="w-3 h-3 text-gray-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                              </svg>
                              <span className="text-xs font-semibold text-gray-600">
                                Quick Add:
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {surgicalHistorySurgeries.map((surgery, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    const currentValue =
                                      clinicalNoteData?.surgicalNotes || "";
                                    // Check if already exists
                                    const existingTags = currentValue
                                      .split("$")
                                      .map((t) => t.trim());
                                    if (existingTags.includes(surgery)) return;

                                    const newValue = currentValue
                                      ? currentValue + "$" + surgery
                                      : surgery;
                                    setClinicalNoteData((p) => ({
                                      ...p,
                                      surgicalNotes: newValue,
                                    }));
                                  }}
                                  className="px-2 py-0.5 text-xs font-medium rounded border transition-all hover:shadow-sm"
                                  style={{
                                    borderColor: "#a855f760",
                                    color: "#a855f7",
                                    backgroundColor: "#ffffff",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      "#a855f710";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      "#ffffff";
                                  }}
                                >
                                  + {surgery}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Tags Display */}
                          <div className="mb-2">
                            <div className="flex flex-wrap gap-1 min-h-[32px] p-2 bg-gray-50 rounded border border-gray-200">
                              {tags.length > 0 ? (
                                tags.map((tag, tagIdx) => (
                                  <span
                                    key={tagIdx}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                                    style={{
                                      backgroundColor: "#a855f720",
                                      color: "#a855f7",
                                      border: "1px solid #a855f740",
                                    }}
                                  >
                                    {tag}
                                    <button
                                      onClick={() => {
                                        const newValue = (
                                          clinicalNoteData?.surgicalNotes || ""
                                        )
                                          .split("$")
                                          .map((t) => t.trim())
                                          .filter((t) => t !== tag)
                                          .join("$");
                                        setClinicalNoteData((p) => ({
                                          ...p,
                                          surgicalNotes: newValue,
                                        }));
                                      }}
                                      className="hover:text-red-600"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-gray-400">
                                  No surgical history entered yet...
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Text Input with Enter to Add */}
                          <div className="mb-2">
                            <input
                              type="text"
                              ref={surgicalHistoryInputRef}
                              className="input-field text-xs"
                              placeholder="Type surgery and press Enter to add..."
                              onKeyDown={(e) => {
                                if (
                                  e.key === "Enter" &&
                                  e.currentTarget.value.trim()
                                ) {
                                  const newSurgery =
                                    e.currentTarget.value.trim();
                                  const currentValue =
                                    clinicalNoteData?.surgicalNotes || "";
                                  const existingTags = currentValue
                                    .split("$")
                                    .map((t) => t.trim());

                                  if (!existingTags.includes(newSurgery)) {
                                    const newValue = currentValue
                                      ? currentValue + "$" + newSurgery
                                      : newSurgery;
                                    setClinicalNoteData((p) => ({
                                      ...p,
                                      surgicalNotes: newValue,
                                    }));
                                  }
                                  e.currentTarget.value = "";
                                }
                              }}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              💡 Press Enter to add surgery
                            </p>
                          </div>

                          {/* Last Visit History */}
                          <div className="mb-2 p-2 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg">
                            <div className="flex items-center gap-1 mb-1">
                              <svg
                                className="w-3 h-3 text-amber-600"
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
                              <span className="text-xs font-bold text-amber-800">
                                Last Visit History
                              </span>
                              <span className="text-xs text-amber-600 ml-auto">
                                2020-08-15
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {["Appendectomy"].map((item, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded text-xs font-medium bg-white"
                                  style={{
                                    color: "#a855f7",
                                    border: "1px solid #a855f740",
                                  }}
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="mt-2 flex gap-1.5">
                            <div className="flex-1" />
                            {/* <button className="bg-gray-500 hover:bg-gray-600 text-white text-xs flex-1 py-1.5 rounded-lg font-semibold transition-all shadow-sm">
                              <svg
                                className="w-3 h-3 inline mr-1"
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
                              Save
                            </button> */}
                            <button
                              onClick={() =>
                                setClinicalNoteData((p) => ({
                                  ...p,
                                  surgicalNotes: "",
                                }))
                              }
                              className="bg-gray-300 hover:bg-gray-400 text-gray-700 text-xs py-1.5 px-3 rounded-lg font-semibold transition-all shadow-sm"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Allergy Information */}
                {(() => {
                  const isExpanded = expandedPresentingSections.includes(
                    "Allergy Information"
                  );
                  const historyEntries =
                    presentingHistoryData["Allergy Information"] || [];
                  const hasHistory = historyEntries.length > 0;
                  const headerGradient = hasHistory
                    ? historyHighlightGradient
                    : "from-red-100 to-orange-100";
                  const tags = (clinicalNoteData?.allergyNotes || "")
                    .split("$")
                    .map((t) => t.trim())
                    .filter((t) => t);

                  return (
                    <div className="bg-red-50 border-2 border-red-300 rounded-lg shadow-sm overflow-hidden">
                      {/* Header - Collapsible */}
                      <div
                        className={`bg-gradient-to-r ${headerGradient} p-2 cursor-pointer hover:opacity-90 transition-all ${getHistoryHeaderAccent(
                          hasHistory
                        )}`}
                        onClick={() =>
                          togglePresentingSection(
                            "Allergy Information",
                            () => allergyInformationInputRef.current
                          )
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-gray-800 flex items-center gap-2">
                              <span
                                className="rounded-lg flex items-center justify-center shadow-sm"
                                style={{
                                  width: "24px",
                                  height: "24px",
                                  backgroundColor: "#ef4444",
                                  color: "#ffffff",
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                }}
                              >
                                4
                              </span>
                              Allergy Information
                            </h4>
                            {tags.length > 0 ? (
                              <span
                                className="px-2 py-0.5 rounded-full text-xs font-bold"
                                style={{
                                  backgroundColor: "#ef444420",
                                  color: "#ef4444",
                                }}
                              >
                                {tags.length} items
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 font-medium">
                                Empty
                              </span>
                            )}
                          </div>

                          {/* Tag Preview Bar - Always visible when has data */}
                          {tags.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              {tags.slice(0, 3).map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.5 rounded text-xs font-medium"
                                  style={{
                                    backgroundColor: "#ef444425",
                                    color: "#ef4444",
                                    border: "1px solid #ef444450",
                                  }}
                                >
                                  {tag}
                                </span>
                              ))}
                              {tags.length > 3 && (
                                <span
                                  className="text-xs font-semibold"
                                  style={{ color: "#ef4444" }}
                                >
                                  +{tags.length - 3} more
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openHistoryModal(
                                  "Allergy Information",
                                  historyEntries
                                );
                              }}
                              className={getHistoryButtonClasses(hasHistory)}
                            >
                              <svg
                                className="w-3 h-3"
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
                              <span className="hidden sm:inline">History</span>
                            </button>
                            <svg
                              className={`w-4 h-4 text-gray-600 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Content - Expandable */}
                      {isExpanded && (
                        <div className="p-2.5">
                          {/* Quick Add Tags */}
                          <div className="mb-2">
                            <div className="flex items-center gap-1 mb-1.5">
                              <svg
                                className="w-3 h-3 text-red-600"
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
                              <span className="text-xs font-semibold text-red-700">
                                Common Allergies:
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {allergyInformationAllergies.map(
                                (allergy, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      const currentValue =
                                        clinicalNoteData?.allergyNotes || "";
                                      // Check if already exists
                                      const existingTags = currentValue
                                        .split("$")
                                        .map((t) => t.trim());
                                      if (existingTags.includes(allergy))
                                        return;

                                      const newValue = currentValue
                                        ? currentValue + "$" + allergy
                                        : allergy;
                                      setClinicalNoteData((p) => ({
                                        ...p,
                                        allergyNotes: newValue,
                                      }));
                                    }}
                                    className="px-2 py-0.5 text-xs font-medium rounded border-2 transition-all hover:shadow-sm"
                                    style={{
                                      borderColor: "#ef444460",
                                      color: "#ef4444",
                                      backgroundColor: "#ffffff",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor =
                                        "#ef444410";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor =
                                        "#ffffff";
                                    }}
                                  >
                                    + {allergy}
                                  </button>
                                )
                              )}
                            </div>
                          </div>

                          {/* Tags Display */}
                          <div className="mb-2">
                            <div className="flex flex-wrap gap-1 min-h-[32px] p-2 bg-red-50 rounded border-2 border-red-200">
                              {tags.length > 0 ? (
                                tags.map((tag, tagIdx) => (
                                  <span
                                    key={tagIdx}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                                    style={{
                                      backgroundColor: "#ef444420",
                                      color: "#ef4444",
                                      border: "1px solid #ef444440",
                                    }}
                                  >
                                    {tag}
                                    <button
                                      onClick={() => {
                                        const newValue = (
                                          clinicalNoteData?.allergyNotes || ""
                                        )
                                          .split("$")
                                          .map((t) => t.trim())
                                          .filter((t) => t !== tag)
                                          .join("$");
                                        setClinicalNoteData((p) => ({
                                          ...p,
                                          allergyNotes: newValue,
                                        }));
                                      }}
                                      className="hover:text-red-800"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-gray-400">
                                  No allergies entered yet...
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Text Input with Enter to Add */}
                          <div className="mb-2">
                            <input
                              type="text"
                              ref={allergyInformationInputRef}
                              className="input-field bg-white text-xs"
                              placeholder="Type allergy and press Enter to add..."
                              onKeyDown={(e) => {
                                if (
                                  e.key === "Enter" &&
                                  e.currentTarget.value.trim()
                                ) {
                                  const newAllergy =
                                    e.currentTarget.value.trim();
                                  const currentValue =
                                    clinicalNoteData?.allergyNotes || "";
                                  const existingTags = currentValue
                                    .split("$")
                                    .map((t) => t.trim());

                                  if (!existingTags.includes(newAllergy)) {
                                    const newValue = currentValue
                                      ? currentValue + "$" + newAllergy
                                      : newAllergy;
                                    setClinicalNoteData((p) => ({
                                      ...p,
                                      allergyNotes: newValue,
                                    }));
                                  }
                                  e.currentTarget.value = "";
                                }
                              }}
                            />
                            <p className="text-xs text-red-600 mt-1 font-semibold">
                              ⚠️ Press Enter to add allergy
                            </p>
                          </div>

                          {/* Last Visit History */}
                          <div className="mb-2 p-2 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-lg">
                            <div className="flex items-center gap-1 mb-1">
                              <svg
                                className="w-3 h-3 text-red-600"
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
                              <span className="text-xs font-bold text-red-800">
                                Last Visit History
                              </span>
                              <span className="text-xs text-red-600 ml-auto">
                                2024-06-10
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {["Penicillin", "Sulfa drugs"].map(
                                (item, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded text-xs font-medium bg-white"
                                    style={{
                                      color: "#ef4444",
                                      border: "2px solid #ef444440",
                                    }}
                                  >
                                    ⚠️ {item}
                                  </span>
                                )
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="mt-2 flex gap-1.5">
                            <div className="flex-1" />
                            {/* <button className="bg-gray-500 hover:bg-gray-600 text-white text-xs flex-1 py-1.5 rounded-lg font-semibold transition-all shadow-sm">
                              <svg
                                className="w-3 h-3 inline mr-1"
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
                              Save
                            </button> */}
                            <button
                              onClick={() =>
                                setClinicalNoteData((p) => ({
                                  ...p,
                                  allergyNotes: "",
                                }))
                              }
                              className="bg-gray-300 hover:bg-gray-400 text-gray-700 text-xs py-1.5 px-3 rounded-lg font-semibold transition-all shadow-sm"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Examination Tab */}
          {activeTab === "examination" && (
            <div className="space-y-2">
              {[
                {
                  title: "General",
                  color: "#10b981",
                  bgLight: "from-green-50 to-emerald-50",
                  quickAdd: examinationQuickAdd.General,
                },
                {
                  title: "Cardio Vascular",
                  color: "#3b82f6",
                  bgLight: "from-blue-50 to-indigo-50",
                  quickAdd: examinationQuickAdd["Cardio Vascular"],
                },
                {
                  title: "Respiratory",
                  color: "#a855f7",
                  bgLight: "from-purple-50 to-pink-50",
                  quickAdd: examinationQuickAdd.Respiratory,
                },
                {
                  title: "Central Nerve",
                  color: "#f59e0b",
                  bgLight: "from-amber-50 to-orange-50",
                  quickAdd: examinationQuickAdd["Central Nerve"],
                },
                {
                  title: "Gastro Intestinal",
                  color: "#ec4899",
                  bgLight: "from-pink-50 to-rose-50",
                  quickAdd: examinationQuickAdd["Gastro Intestinal"],
                },
              ].map((item, idx: number) => {
                const isExpanded = expandedExamSections.includes(item.title);
                const historyEntries = examinationHistoryData[item.title] || [];
                const hasHistory = historyEntries.length > 0;
                const headerGradient = hasHistory
                  ? historyHighlightGradient
                  : item.bgLight;
                const findingsCount = (
                  examinationTabKeyValueSelect(
                    item.title as keyof typeof examinationTabKey,
                    examinationData
                  ) || ""
                )
                  .split(",")
                  .filter((tag) => tag.trim()).length;

                return (
                  <div
                    key={item.title}
                    className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
                  >
                    {/* Header - Always Visible - Compact & Improved */}
                    <div
                      className={`bg-gradient-to-r ${headerGradient} p-2 cursor-pointer hover:opacity-90 transition-all ${getHistoryHeaderAccent(
                        hasHistory
                      )}`}
                      onClick={() =>
                        toggleExaminationSection(
                          item.title,
                          () => examinationInputRefs.current[item.title] || null
                        )
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                            <span
                              className="rounded-lg flex items-center justify-center shadow-sm"
                              style={{
                                width: "20px",
                                height: "20px",
                                backgroundColor: item.color,
                                color: "#ffffff",
                                fontSize: "11px",
                                fontWeight: "bold",
                              }}
                            >
                              {idx + 1}
                            </span>
                            {item.title}
                          </h4>

                          {/* Findings Count with Check Icon */}
                          {findingsCount > 0 ? (
                            <span
                              className="text-sm font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-1"
                              style={{
                                backgroundColor: item.color + "30",
                                color: item.color,
                              }}
                            >
                              <svg
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {findingsCount}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 font-medium">
                              Empty
                            </span>
                          )}
                        </div>

                        {/* Tags Preview Bar - Show first 3 tags */}
                        {findingsCount > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {(
                              examinationTabKeyValueSelect(
                                item.title as keyof typeof examinationTabKey,
                                examinationData
                              ) || ""
                            )
                              .split(",")
                              .filter((tag) => tag.trim())
                              .slice(0, 3)
                              .map((tag, tagIdx) => (
                                <span
                                  key={tagIdx}
                                  className="text-sm px-1.5 py-0.5 rounded font-medium"
                                  style={{
                                    backgroundColor: item.color + "25",
                                    color: item.color,
                                    border: `1px solid ${item.color}50`,
                                  }}
                                >
                                  {tag.trim()}
                                </span>
                              ))}
                            {findingsCount > 3 && (
                              <span
                                className="text-sm font-semibold"
                                style={{ color: item.color }}
                              >
                                +{findingsCount - 3} more
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openHistoryModal(
                                `${item.title} Examination`,
                                historyEntries
                              );
                            }}
                            className={getHistoryButtonClasses(hasHistory)}
                          >
                            <svg
                              className="w-3 h-3"
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
                            <span className="hidden sm:inline">History</span>
                          </button>

                          {/* Expand/Collapse Icon */}
                          <svg
                            className={`w-4 h-4 text-gray-600 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Content - Collapsible */}
                    {isExpanded && (
                      <div
                        className="p-2.5 animate-fadeIn"
                        style={{
                          animation: "fadeIn 0.2s ease-in",
                        }}
                      >
                        {/* Quick Add Common Findings */}
                        <div className="mb-2">
                          <div className="flex items-center gap-1 mb-1.5">
                            <svg
                              className="w-3 h-3 text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                              />
                            </svg>
                            <span className="text-sm font-semibold text-gray-600">
                              Quick Add:
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {item.quickAdd.map((quickItem, qIdx) => (
                              <button
                                key={qIdx}
                                onClick={() => {
                                  const key: unknown =
                                    examinationTabKey[
                                      item.title as keyof typeof examinationTabKey
                                    ];
                                  const currentValue =
                                    examinationTabKeyValueSelect(
                                      item.title as keyof typeof examinationTabKey,
                                      examinationData
                                    ) || "";

                                  // Check if already exists
                                  const existingTags = currentValue
                                    .split(",")
                                    .map((t) => t.trim());
                                  if (existingTags.includes(quickItem)) return;

                                  const newValue = currentValue
                                    ? currentValue + "," + quickItem
                                    : quickItem;
                                  setExaminationData((p) => ({
                                    ...p,
                                    [key as keyof TExamination]: newValue,
                                  }));
                                }}
                                className="px-2 py-0.5 text-sm font-medium rounded border transition-all hover:shadow-sm"
                                style={{
                                  borderColor: item.color + "60",
                                  color: item.color,
                                  backgroundColor: "#ffffff",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    item.color + "10";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    "#ffffff";
                                }}
                              >
                                + {quickItem}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Tags Display */}
                        {(
                          examinationTabKeyValueSelect(
                            item.title as keyof typeof examinationTabKey,
                            examinationData
                          ) || ""
                        )
                          .split(",")
                          .filter((tag) => tag.trim()).length > 0 && (
                          <div className="mb-2 flex flex-wrap gap-1.5">
                            {(
                              examinationTabKeyValueSelect(
                                item.title as keyof typeof examinationTabKey,
                                examinationData
                              ) || ""
                            )
                              .split(",")
                              .filter((tag) => tag.trim())
                              .map((tag, tagIdx) => (
                                <span
                                  key={tagIdx}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium"
                                  style={{
                                    backgroundColor: item.color + "20",
                                    color: item.color,
                                    border: `1px solid ${item.color}40`,
                                  }}
                                >
                                  {tag.trim()}
                                  <button
                                    onClick={() => {
                                      const key: unknown =
                                        examinationTabKey[
                                          item.title as keyof typeof examinationTabKey
                                        ];
                                      const currentTags =
                                        examinationTabKeyValueSelect(
                                          item.title as keyof typeof examinationTabKey,
                                          examinationData
                                        ) || "";
                                      const newTags = currentTags
                                        .split(",")
                                        .filter((t) => t.trim() !== tag.trim())
                                        .join(",");
                                      setExaminationData((p) => ({
                                        ...p,
                                        [key as keyof TExamination]: newTags,
                                      }));
                                    }}
                                    className="hover:opacity-70 transition-opacity"
                                  >
                                    <svg
                                      className="w-3 h-3"
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
                                </span>
                              ))}
                          </div>
                        )}

                        {/* Input Field */}
                        <input
                          type="text"
                          ref={(el) => {
                            examinationInputRefs.current[item.title] = el;
                          }}
                          className="input-field text-sm w-full"
                          placeholder={`Type custom finding & press Enter...`}
                          onKeyDown={(e) => {
                            if (
                              e.key === "Enter" &&
                              e.currentTarget.value.trim()
                            ) {
                              const key: unknown =
                                examinationTabKey[
                                  item.title as keyof typeof examinationTabKey
                                ];
                              const currentValue =
                                examinationTabKeyValueSelect(
                                  item.title as keyof typeof examinationTabKey,
                                  examinationData
                                ) || "";
                              const newValue = currentValue
                                ? currentValue +
                                  "," +
                                  e.currentTarget.value.trim()
                                : e.currentTarget.value.trim();
                              setExaminationData((p) => ({
                                ...p,
                                [key as keyof TExamination]: newValue,
                              }));
                              e.currentTarget.value = "";
                            }
                          }}
                        />

                        <div className="mt-2 flex gap-1.5">
                          <div className="flex-1" />
                          {/* <button
                            onClick={() => {
                              console.log(examinationData);
                            }}
                            className="bg-gray-500 hover:bg-gray-600 text-white text-sm flex-1 py-1.5 rounded-lg font-semibold transition-all shadow-sm"
                          >
                            <svg
                              className="w-3 h-3 inline mr-1"
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
                            Save
                          </button> */}
                          <button
                            onClick={() => {
                              const key: unknown =
                                examinationTabKey[
                                  item.title as keyof typeof examinationTabKey
                                ];
                              setExaminationData((p) => ({
                                ...p,
                                [key as keyof TExamination]: "",
                              }));
                            }}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-700 text-sm py-1.5 px-3 rounded-lg font-semibold transition-all shadow-sm"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Diagnosis Tab */}
          {activeTab === "diagnosis" && (
            <div className="space-y-2">
              {[
                {
                  title: "Infectious Diseases",
                  color: "#10b981",
                  bgLight: "from-green-50 to-emerald-50",
                  quickAdd: diagnosisQuickAdd["Infectious Diseases"],
                },
                {
                  title: "Chronic Diseases",
                  color: "#3b82f6",
                  bgLight: "from-blue-50 to-indigo-50",
                  quickAdd: diagnosisQuickAdd["Chronic Diseases"],
                },
                {
                  title: "Gastrointestinal",
                  color: "#a855f7",
                  bgLight: "from-purple-50 to-pink-50",
                  quickAdd: diagnosisQuickAdd.Gastrointestinal,
                },
                {
                  title: "Neurological",
                  color: "#f59e0b",
                  bgLight: "from-amber-50 to-orange-50",
                  quickAdd: diagnosisQuickAdd.Neurological,
                },
                {
                  title: "Musculoskeletal",
                  color: "#ec4899",
                  bgLight: "from-pink-50 to-rose-50",
                  quickAdd: diagnosisQuickAdd.Musculoskeletal,
                },
                {
                  title: "Other",
                  color: "#6366f1",
                  bgLight: "from-indigo-50 to-purple-50",
                  quickAdd: diagnosisQuickAdd.Other,
                },
              ].map((item, idx: number) => {
                const isExpanded = expandedDiagnosisSections.includes(
                  item.title
                );
                const historyEntries = diagnosisHistoryData[item.title] || [];
                const hasHistory = historyEntries.length > 0;
                const headerGradient = hasHistory
                  ? historyHighlightGradient
                  : item.bgLight;
                const diagnosisCount = (
                  diagnosisTabKeyValueSelect(
                    item.title as keyof typeof diagnosisTabKey,
                    diagnosisData
                  ) || ""
                )
                  .split(",")
                  .filter((tag: string) => tag.trim()).length;

                return (
                  <div
                    key={item.title}
                    className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
                  >
                    {/* Header - Always Visible - Compact & Improved */}
                    <div
                      className={`bg-gradient-to-r ${headerGradient} p-2 cursor-pointer hover:opacity-90 transition-all ${getHistoryHeaderAccent(
                        hasHistory
                      )}`}
                      onClick={() =>
                        toggleDiagnosisSection(
                          item.title,
                          () => diagnosisInputRefs.current[item.title] || null
                        )
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                            <span
                              className="rounded-lg flex items-center justify-center shadow-sm"
                              style={{
                                width: "20px",
                                height: "20px",
                                backgroundColor: item.color,
                                color: "#ffffff",
                                fontSize: "11px",
                                fontWeight: "bold",
                              }}
                            >
                              {idx + 1}
                            </span>
                            {item.title}
                          </h4>

                          {/* Diagnosis Count with Check Icon */}
                          {diagnosisCount > 0 ? (
                            <span
                              className="text-sm font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-1"
                              style={{
                                backgroundColor: item.color + "30",
                                color: item.color,
                              }}
                            >
                              <svg
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {diagnosisCount}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 font-medium">
                              Empty
                            </span>
                          )}
                        </div>

                        {/* Diagnosis Preview Bar - Show first 3 diagnoses */}
                        {diagnosisCount > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {(
                              diagnosisTabKeyValueSelect(
                                item.title as keyof typeof diagnosisTabKey,
                                diagnosisData
                              ) || ""
                            )
                              .split(",")
                              .filter((tag: string) => tag.trim())
                              .slice(0, 3)
                              .map((tag: string, tagIdx: number) => (
                                <span
                                  key={tagIdx}
                                  className="text-sm px-1.5 py-0.5 rounded font-medium"
                                  style={{
                                    backgroundColor: item.color + "25",
                                    color: item.color,
                                    border: `1px solid ${item.color}50`,
                                  }}
                                >
                                  {tag.trim()}
                                </span>
                              ))}
                            {diagnosisCount > 3 && (
                              <span
                                className="text-sm font-semibold"
                                style={{ color: item.color }}
                              >
                                +{diagnosisCount - 3} more
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openHistoryModal(
                                `${item.title} Diagnosis`,
                                historyEntries
                              );
                            }}
                            className={getHistoryButtonClasses(hasHistory)}
                          >
                            <svg
                              className="w-3 h-3"
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
                            <span className="hidden sm:inline">History</span>
                          </button>
                          <svg
                            className={`w-4 h-4 text-gray-600 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Content - Diagnosis Entry with Tags */}
                    {isExpanded && (
                      <div className="p-3">
                        {/* Quick Add Buttons */}
                        <div className="mb-2">
                          <div className="flex items-center gap-1 mb-1.5">
                            <svg
                              className="w-3 h-3 text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                              />
                            </svg>
                            <span className="text-sm font-semibold text-gray-600">
                              Quick Add:
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {item.quickAdd.map((diagnosis, qIdx) => (
                              <button
                                key={qIdx}
                                onClick={() => {
                                  const key =
                                    diagnosisTabKey[
                                      item.title as keyof typeof diagnosisTabKey
                                    ];
                                  setDiagnosisData((prev: any) => ({
                                    ...prev,
                                    [key]: prev[key]
                                      ? prev[key] + ", " + diagnosis
                                      : diagnosis,
                                  }));
                                }}
                                className="px-2 py-0.5 text-sm rounded border font-medium transition-all hover:shadow-sm"
                                style={{
                                  borderColor: item.color + "60",
                                  color: item.color,
                                  backgroundColor: "#ffffff",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    item.color + "10";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    "#ffffff";
                                }}
                              >
                                + {diagnosis}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Entered Tags Display */}
                        <div className="mb-2">
                          <div className="flex flex-wrap gap-1 min-h-[32px] p-2 bg-gray-50 rounded border border-gray-200">
                            {(
                              diagnosisTabKeyValueSelect(
                                item.title as keyof typeof diagnosisTabKey,
                                diagnosisData
                              ) || ""
                            )
                              .split(",")
                              .filter((tag: string) => tag.trim())
                              .map((tag: string, tagIdx: number) => (
                                <span
                                  key={tagIdx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm font-medium"
                                  style={{
                                    backgroundColor: item.color + "20",
                                    color: item.color,
                                    border: `1px solid ${item.color}40`,
                                  }}
                                >
                                  {tag.trim()}
                                  <button
                                    onClick={() => {
                                      const key =
                                        diagnosisTabKey[
                                          item.title as keyof typeof diagnosisTabKey
                                        ];
                                      const currentValue =
                                        diagnosisTabKeyValueSelect(
                                          item.title as keyof typeof diagnosisTabKey,
                                          diagnosisData
                                        ) || "";
                                      const newValue = currentValue
                                        .split(",")
                                        .map((t: string) => t.trim())
                                        .filter((t: string) => t !== tag.trim())
                                        .join(", ");
                                      setDiagnosisData((prev: any) => ({
                                        ...prev,
                                        [key]: newValue,
                                      }));
                                    }}
                                    className="hover:text-red-600"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            {!(
                              diagnosisTabKeyValueSelect(
                                item.title as keyof typeof diagnosisTabKey,
                                diagnosisData
                              ) || ""
                            ).trim() && (
                              <span className="text-xs text-gray-400">
                                No diagnosis entered yet...
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Text Input with Enter to Add */}
                        <div className="mb-2">
                          <input
                            type="text"
                            ref={(el) => {
                              diagnosisInputRefs.current[item.title] = el;
                            }}
                            className="input-field text-sm"
                            placeholder="Type diagnosis and press Enter to add..."
                            onKeyDown={(e) => {
                              if (
                                e.key === "Enter" &&
                                e.currentTarget.value.trim()
                              ) {
                                const key =
                                  diagnosisTabKey[
                                    item.title as keyof typeof diagnosisTabKey
                                  ];
                                const newDiagnosis =
                                  e.currentTarget.value.trim();
                                setDiagnosisData((prev: any) => ({
                                  ...prev,
                                  [key]: prev[key]
                                    ? prev[key] + ", " + newDiagnosis
                                    : newDiagnosis,
                                }));
                                e.currentTarget.value = "";
                              }
                            }}
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            💡 Press Enter to add diagnosis
                          </p>
                        </div>

                        {/* Last 3 Visits History */}
                        {/*                    <div className="mb-2">*/}
                        {/*                        <div className="flex items-center gap-1 mb-1.5">*/}
                        {/*                            <svg*/}
                        {/*                                className="w-3 h-3"*/}
                        {/*                                style={{color: item.color}}*/}
                        {/*                                fill="none"*/}
                        {/*                                stroke="currentColor"*/}
                        {/*                                viewBox="0 0 24 24"*/}
                        {/*                            >*/}
                        {/*                                <path*/}
                        {/*                                    strokeLinecap="round"*/}
                        {/*                                    strokeLinejoin="round"*/}
                        {/*                                    strokeWidth={2}*/}
                        {/*                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"*/}
                        {/*                                />*/}
                        {/*                            </svg>*/}
                        {/*                            <span*/}
                        {/*                                className="text-sm font-bold"*/}
                        {/*                                style={{color: item.color}}*/}
                        {/*                            >*/}
                        {/*  Last 3 Visits History*/}
                        {/*</span>*/}
                        {/*                        </div>*/}
                        {/*                        <div className="space-y-1.5">*/}
                        {/*                            /!* Visit 1 - Most Recent *!/*/}
                        {/*                            <div*/}
                        {/*                                className="p-2 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded">*/}
                        {/*                                <div className="flex items-center justify-between mb-1">*/}
                        {/*    <span className="text-sm font-semibold text-gray-700">*/}
                        {/*      Visit 1 - Most Recent*/}
                        {/*    </span>*/}
                        {/*                                    <span className="text-sm text-gray-500">*/}
                        {/*      2025-01-05*/}
                        {/*    </span>*/}
                        {/*                                </div>*/}
                        {/*                                <div className="flex flex-wrap gap-1">*/}
                        {/*                                    {(idx === 0*/}
                        {/*                                            ? ["URTI", "Fever"]*/}
                        {/*                                            : idx === 1*/}
                        {/*                                                ? ["Diabetes Type 2", "HTN"]*/}
                        {/*                                                : idx === 2*/}
                        {/*                                                    ? ["GERD", "Gastritis"]*/}
                        {/*                                                    : idx === 3*/}
                        {/*                                                        ? ["Migraine"]*/}
                        {/*                                                        : idx === 4*/}
                        {/*                                                            ? ["Back Pain"]*/}
                        {/*                                                            : ["Allergic Rhinitis"]*/}
                        {/*                                    ).map((diagnosis, dIdx) => (*/}
                        {/*                                        <span*/}
                        {/*                                            key={dIdx}*/}
                        {/*                                            className="px-2 py-0.5 rounded text-sm font-medium"*/}
                        {/*                                            style={{*/}
                        {/*                                                backgroundColor: item.color + "15",*/}
                        {/*                                                color: item.color,*/}
                        {/*                                                border: `1px solid ${item.color}30`,*/}
                        {/*                                            }}*/}
                        {/*                                        >*/}
                        {/*        {diagnosis}*/}
                        {/*      </span>*/}
                        {/*                                    ))}*/}
                        {/*                                </div>*/}
                        {/*                            </div>*/}

                        {/*                            /!* Visit 2 *!/*/}
                        {/*                            <div*/}
                        {/*                                className="p-2 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded opacity-80">*/}
                        {/*                                <div className="flex items-center justify-between mb-1">*/}
                        {/*    <span className="text-sm font-semibold text-gray-700">*/}
                        {/*      Visit 2*/}
                        {/*    </span>*/}
                        {/*                                    <span className="text-sm text-gray-500">*/}
                        {/*      2024-12-15*/}
                        {/*    </span>*/}
                        {/*                                </div>*/}
                        {/*                                <div className="flex flex-wrap gap-1">*/}
                        {/*                                    {(idx === 0*/}
                        {/*                                            ? ["Bronchitis"]*/}
                        {/*                                            : idx === 1*/}
                        {/*                                                ? ["Asthma", "DM Type 2"]*/}
                        {/*                                                : idx === 2*/}
                        {/*                                                    ? ["IBS"]*/}
                        {/*                                                    : idx === 3*/}
                        {/*                                                        ? ["Tension Headache"]*/}
                        {/*                                                        : idx === 4*/}
                        {/*                                                            ? ["Knee Pain"]*/}
                        {/*                                                            : ["Anemia"]*/}
                        {/*                                    ).map((diagnosis, dIdx) => (*/}
                        {/*                                        <span*/}
                        {/*                                            key={dIdx}*/}
                        {/*                                            className="px-2 py-0.5 rounded text-sm font-medium"*/}
                        {/*                                            style={{*/}
                        {/*                                                backgroundColor: item.color + "10",*/}
                        {/*                                                color: item.color,*/}
                        {/*                                                border: `1px solid ${item.color}25`,*/}
                        {/*                                            }}*/}
                        {/*                                        >*/}
                        {/*        {diagnosis}*/}
                        {/*      </span>*/}
                        {/*                                    ))}*/}
                        {/*                                </div>*/}
                        {/*                            </div>*/}

                        {/*                            /!* Visit 3 - Oldest *!/*/}
                        {/*                            <div*/}
                        {/*                                className="p-2 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded opacity-60">*/}
                        {/*                                <div className="flex items-center justify-between mb-1">*/}
                        {/*    <span className="text-sm font-semibold text-gray-700">*/}
                        {/*      Visit 3 - Oldest*/}
                        {/*    </span>*/}
                        {/*                                    <span className="text-sm text-gray-500">*/}
                        {/*      2024-11-20*/}
                        {/*    </span>*/}
                        {/*                                </div>*/}
                        {/*                                <div className="flex flex-wrap gap-1">*/}
                        {/*                                    {(idx === 0*/}
                        {/*                                            ? ["Viral Fever"]*/}
                        {/*                                            : idx === 1*/}
                        {/*                                                ? ["HTN"]*/}
                        {/*                                                : idx === 2*/}
                        {/*                                                    ? ["Gastritis"]*/}
                        {/*                                                    : idx === 3*/}
                        {/*                                                        ? ["Vertigo"]*/}
                        {/*                                                        : idx === 4*/}
                        {/*                                                            ? ["Shoulder Pain"]*/}
                        {/*                                                            : ["Vitamin D Deficiency"]*/}
                        {/*                                    ).map((diagnosis, dIdx) => (*/}
                        {/*                                        <span*/}
                        {/*                                            key={dIdx}*/}
                        {/*                                            className="px-2 py-0.5 rounded text-sm font-medium"*/}
                        {/*                                            style={{*/}
                        {/*                                                backgroundColor: item.color + "08",*/}
                        {/*                                                color: item.color,*/}
                        {/*                                                border: `1px solid ${item.color}20`,*/}
                        {/*                                            }}*/}
                        {/*                                        >*/}
                        {/*        {diagnosis}*/}
                        {/*      </span>*/}
                        {/*                                    ))}*/}
                        {/*                                </div>*/}
                        {/*                            </div>*/}
                        {/*                        </div>*/}
                        {/*                    </div>*/}

                        {/* Action Buttons */}
                        <div className="flex gap-1.5">
                          <div className="flex-1" />
                          {/* <button
                            onClick={() => {
                              console.log(diagnosisData);
                            }}
                            className="bg-gray-500 hover:bg-gray-600 text-white text-sm flex-1 py-1.5 rounded-lg font-semibold transition-all shadow-sm"
                          >
                            <svg
                              className="w-3 h-3 inline mr-1"
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
                            Save
                          </button> */}
                          <button
                            onClick={() => {
                              const key =
                                diagnosisTabKey[
                                  item.title as keyof typeof diagnosisTabKey
                                ];
                              setDiagnosisData((prev: any) => ({
                                ...prev,
                                [key]: "",
                              }));
                            }}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-700 text-sm py-1.5 px-3 rounded-lg font-semibold transition-all shadow-sm"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Investigation Tab */}
          {activeTab === "investigation" && (
            <div className="space-y-3">
              {/* Investigation History moved to bottom of the Investigation tab */}
              {/* STEP 1: Test Selection & Prescription */}
              <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <BeakerIcon className="w-5 h-5 text-teal-600" />
                  <h4 className="text-sm font-bold text-gray-800">
                    Test Selection & Prescription
                  </h4>
                </div>

                <div className="space-y-3">
                  {/* Quick Templates - Glass Gray Background */}
                  <div className="relative bg-gradient-to-br from-gray-100/90 via-gray-50/80 to-gray-100/90 backdrop-blur-sm border border-gray-300 rounded-lg p-2.5 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className="w-4 h-4 text-gray-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                      </svg>
                      <span className="text-xs font-bold text-gray-800">
                        🎯 Quick Test Templates
                      </span>
                    </div>

                    {/* Grid Layout Template Cards - Compact Glass Design */}
                    <div className="flex flex-wrap gap-2">
                      {investigationTemplates.map((template, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleQuickTemplate(template.tests)}
                          className="group relative bg-gray-100/80 backdrop-blur-sm border border-gray-300 hover:border-teal-400 px-3 py-2 rounded-lg hover:bg-white transition-all duration-200"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg flex-shrink-0">
                              {template.icon}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-gray-700 whitespace-nowrap">
                                {template.name}
                              </span>
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-white border border-gray-300 text-gray-600">
                                {template.tests.length}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Search Box - Simplified */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      className="w-full pl-10 pr-10 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all placeholder-gray-400"
                      placeholder="Search for laboratory tests..."
                      value={investigationSearchTerm}
                      onChange={(e) =>
                        setInvestigationSearchTerm(e.target.value)
                      }
                    />
                    {investigationSearchTerm && (
                      <button
                        onClick={() => setInvestigationSearchTerm("")}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-red-600 transition-colors"
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Tests Grid and Selected Tests - Side by Side */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {/* Available Tests */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-cyan-50 p-2 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2">
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
                              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            />
                          </svg>
                          <p className="text-xs font-bold text-gray-800">
                            Available Tests
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                          {filteredTests.length}
                        </span>
                      </div>

                      <div className="bg-gray-50 rounded-lg border border-gray-200 p-2.5 h-[280px] overflow-y-auto">
                        {filteredTests.length > 0 ? (
                          <div className="space-y-1.5">
                            {filteredTests.map((test, index) => {
                              const isSelected = selectedTests.some(
                                (t) => t.testId == test.id
                              );
                              return (
                                <button
                                  key={index}
                                  onClick={() => handleTestToggle(test)}
                                  className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-semibold transition-all ${
                                    isSelected
                                      ? "bg-emerald-100 text-emerald-900 border border-emerald-400"
                                      : "bg-white border border-gray-200 text-gray-700 hover:border-teal-400 hover:bg-teal-50"
                                  }`}
                                >
                                  <div
                                    className={`w-4 h-4 border rounded flex items-center justify-center flex-shrink-0 ${
                                      isSelected
                                        ? "border-emerald-600 bg-emerald-600"
                                        : "border-gray-300 bg-white"
                                    }`}
                                  >
                                    {isSelected && (
                                      <svg
                                        className="w-3 h-3 text-white"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    )}
                                  </div>
                                  <span className="text-left flex-1">
                                    {test?.labTestName}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center relative z-10">
                            <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mb-4 shadow-inner">
                              <svg
                                className="w-10 h-10 text-gray-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                              </svg>
                            </div>
                            <p className="text-sm font-bold text-gray-700 mb-1">
                              No tests found
                            </p>
                            <p className="text-xs text-gray-500">
                              Try a different search term
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Selected Tests for Prescription */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-gradient-to-r from-emerald-50 to-green-50 p-2 rounded-lg border border-emerald-200">
                        <div className="flex items-center gap-2">
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
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                            />
                          </svg>
                          <p className="text-xs font-bold text-gray-800">
                            Selected Tests
                          </p>
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            {selectedTests.length}
                          </span>
                        </div>
                        {selectedTests.length > 0 && (
                          <button
                            onClick={() => setSelectedTests([])}
                            className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 transition-all bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg border border-red-200"
                          >
                            <svg
                              className="w-3 h-3"
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
                            Clear
                          </button>
                        )}
                      </div>

                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 h-[280px] overflow-y-auto flex flex-col">
                        {/* Decorative elements */}
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-400/5 rounded-full blur-3xl"></div>

                        {selectedTests.length > 0 ? (
                          <>
                            <div className="flex flex-wrap gap-1.5 mb-2 flex-1">
                              {selectedTests.map((test, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 border border-emerald-400 px-2.5 py-1.5 rounded-lg text-xs font-bold"
                                >
                                  <svg
                                    className="w-3 h-3 text-emerald-700"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  {test?.labTestName}
                                  <button
                                    onClick={() => handleRemoveTest(test)}
                                    className="ml-1 bg-red-100 hover:bg-red-200 rounded-full w-4 h-4 flex items-center justify-center text-red-700 hover:text-red-800 font-bold text-sm transition-all"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>

                            <div className="mt-auto pt-2 border-t border-gray-200">
                              <button
                                onClick={handlePrintInvestigationPrescription}
                                className="w-full text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                                style={{
                                  background:
                                    "linear-gradient(to right, #14b8a6, #0d9488)",
                                  color: "#ffffff",
                                  transition: "all 0.2s",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background =
                                    "linear-gradient(to right, #0d9488, #0f766e)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background =
                                    "linear-gradient(to right, #14b8a6, #0d9488)";
                                }}
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
                                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                  />
                                </svg>
                                <span>Print Prescription</span>
                                <span
                                  className="ml-auto px-2 py-0.5 rounded text-xs font-semibold"
                                  style={{ background: "#0f766e" }}
                                >
                                  {selectedTests.length}
                                </span>
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                              <span className="text-3xl">🔬</span>
                            </div>
                            <p className="text-sm font-bold text-gray-700 mb-1">
                              No tests selected
                            </p>
                            <p className="text-xs text-gray-500">
                              Select tests from available list
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 2: Test Results Entry - Compact */}
              {prescribedTests.length > 0 ? (
                <TestDataEntrySection
                  prescribedTests={selectedTests}
                  setPrescribedTests={setSelectedTests}
                />
              ) : (
                <div className="relative bg-gradient-to-br from-white via-purple-50 to-white border-2 border-purple-200 rounded-xl p-8 shadow-lg">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                      <ChartBarIcon className="w-8 h-8 text-purple-500" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-800 mb-2">
                      No Prescribed Tests
                    </h4>
                    <p className="text-sm text-gray-600">
                      Please select tests from the list above and print the
                      prescription first.
                    </p>
                  </div>
                </div>
              )}

              {/* Investigation History - Grouped by Date (Bottom) */}
              <InvestigationHistorySection
                investigationHistory={investigationHistory}
              />
            </div>
          )}

          {/* Management Tab */}
          {activeTab === "management" && (
            <div className="space-y-2">
              {/* STEP 1: Drug Search & Selection - COMPACT */}
              <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 border border-emerald-200 rounded-lg p-2 shadow relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/5 rounded-full blur-2xl -z-10"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
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
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      Drug Search
                    </h4>
                    <span className="bg-emerald-100 px-1.5 py-0.5 rounded text-xs font-bold text-emerald-700">
                      1/3
                    </span>
                  </div>

                  {/* Search Type Selector */}
                  <div className="mb-2 flex items-center gap-2">
                    <label className="text-xs font-semibold text-gray-700">
                      Search By:
                    </label>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setDrugSearchType("itemName")}
                        className={`px-2 py-1 text-xs rounded transition-all flex items-center gap-1 ${
                          drugSearchType === "itemName"
                            ? "bg-emerald-600 text-white font-bold"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        <span
                          className={`px-1 py-0.5 rounded text-xs font-bold ${
                            drugSearchType === "itemName"
                              ? "bg-white/20"
                              : "bg-gray-300 text-gray-700"
                          }`}
                        >
                          1
                        </span>
                        Item Name
                      </button>
                      <button
                        onClick={() => setDrugSearchType("itemNameStart")}
                        className={`px-2 py-1 text-xs rounded transition-all flex items-center gap-1 ${
                          drugSearchType === "itemNameStart"
                            ? "bg-emerald-600 text-white font-bold"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        <span
                          className={`px-1 py-0.5 rounded text-xs font-bold ${
                            drugSearchType === "itemNameStart"
                              ? "bg-white/20"
                              : "bg-gray-300 text-gray-700"
                          }`}
                        >
                          2
                        </span>
                        Starts With
                      </button>
                      <button
                        onClick={() => setDrugSearchType("genericName")}
                        className={`px-2 py-1 text-xs rounded transition-all flex items-center gap-1 ${
                          drugSearchType === "genericName"
                            ? "bg-emerald-600 text-white font-bold"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        <span
                          className={`px-1 py-0.5 rounded text-xs font-bold ${
                            drugSearchType === "genericName"
                              ? "bg-white/20"
                              : "bg-gray-300 text-gray-700"
                          }`}
                        >
                          3
                        </span>
                        Generic Name
                      </button>
                    </div>
                  </div>

                  {/* Drug Search Input */}
                  <div className="relative">
                    <div className="absolute left-2.5 top-2 pointer-events-none">
                      <svg
                        className="w-3.5 h-3.5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <input
                      ref={drugSearchInputRef}
                      type="text"
                      value={drugSearchQuery}
                      onChange={(e) => {
                        setDrugSearchQuery(e.target.value);
                        setSelectedDropdownIndex(0);
                      }}
                      onFocus={() => {
                        if (drugSearchResults.length > 0) {
                          setShowDrugSearchResults(true);
                          setSelectedDropdownIndex(0);
                        }
                      }}
                      onKeyDown={(e) => {
                        // Keyboard shortcuts for search type
                        if (e.key === "1") {
                          e.preventDefault();
                          setDrugSearchType("itemName");
                          return;
                        } else if (e.key === "2") {
                          e.preventDefault();
                          setDrugSearchType("itemNameStart");
                          return;
                        } else if (e.key === "3") {
                          e.preventDefault();
                          setDrugSearchType("genericName");
                          return;
                        }

                        if (
                          showDrugSearchResults &&
                          drugSearchResults.length > 0
                        ) {
                          if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setSelectedDropdownIndex((prev) =>
                              prev < drugSearchResults.length - 1
                                ? prev + 1
                                : prev
                            );
                          } else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            setSelectedDropdownIndex((prev) =>
                              prev > 0 ? prev - 1 : prev
                            );
                          } else if (e.key === "Enter") {
                            e.preventDefault();
                            const selectedDrugItem =
                              drugSearchResults[selectedDropdownIndex];
                            if (selectedDrugItem) {
                              setSelectedDrug(selectedDrugItem);
                              setDrugSearchQuery("");
                              setShowDrugSearchResults(false);
                              setDrugSearchResults([]);
                              // Focus quantity input
                              setTimeout(
                                () => quantityInputRef.current?.focus(),
                                100
                              );
                            }
                          } else if (e.key === "Escape") {
                            setShowDrugSearchResults(false);
                          }
                        }
                      }}
                      className="w-full pl-8 pr-3 py-1.5 border border-emerald-200 rounded-md focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all outline-none text-xs font-medium bg-white/80 backdrop-blur-sm"
                      placeholder="Type drug name (3+ chars)..."
                    />

                    {isSearchingDrugs && (
                      <div className="absolute right-2.5 top-2">
                        <div className="animate-spin h-3.5 w-3.5 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
                      </div>
                    )}

                    {/* Search Results Dropdown */}
                    {showDrugSearchResults && drugSearchResults.length > 0 && (
                      <div className="absolute z-[100] w-full mt-1 bg-white border-2 border-emerald-300 rounded-md shadow-2xl max-h-48 overflow-y-auto">
                        <div className="p-1">
                          <div className="flex items-center justify-between px-2 py-1 bg-gradient-to-r from-emerald-50 to-teal-50 rounded mb-1 border-b-2 border-emerald-200">
                            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                              <svg
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {drugSearchResults.length} Found
                            </span>
                            <button
                              onClick={() => setShowDrugSearchResults(false)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <svg
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </div>
                          {drugSearchResults.map((drug, index) => (
                            <div
                              key={drug.id}
                              onClick={() => {
                                setSelectedDrug(drug);
                                setDrugSearchQuery("");
                                setShowDrugSearchResults(false);
                                setDrugSearchResults([]);
                                // Focus to quantity input immediately
                                setTimeout(
                                  () => quantityInputRef.current?.focus(),
                                  100
                                );
                              }}
                              className={`px-2 py-1 cursor-pointer transition-all border-b border-gray-100 last:border-b-0 group ${
                                index === selectedDropdownIndex
                                  ? "bg-gradient-to-r from-emerald-100 to-teal-100"
                                  : "hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-bold text-xs transition-colors flex-shrink-0 ${
                                    index === selectedDropdownIndex
                                      ? "text-emerald-700"
                                      : "text-gray-800 group-hover:text-emerald-700"
                                  }`}
                                >
                                  {drug.itemName}
                                </span>
                                <span className="text-xs text-gray-600 flex-shrink-0">
                                  •
                                </span>
                                <span className="text-xs text-blue-700 flex-shrink-0">
                                  {drug.genericName}
                                </span>
                                <span className="text-xs text-gray-600 flex-shrink-0">
                                  •
                                </span>
                                <span className="text-xs text-amber-700 flex-shrink-0">
                                  {drug.form}
                                </span>
                                {drug.manufacturer && (
                                  <>
                                    <span className="text-xs text-gray-600 flex-shrink-0">
                                      •
                                    </span>
                                    <span className="text-xs text-gray-500 flex-shrink-0">
                                      {drug.manufacturer}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {drugSearchQuery.length > 0 &&
                      drugSearchQuery.length < 3 && (
                        <div className="mt-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700 flex items-center gap-1">
                          <svg
                            className="w-3 h-3 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>Type 3+ characters</span>
                        </div>
                      )}
                  </div>

                  {/* Selected Drug Display - Compact */}
                  {selectedDrug && (
                    <div className="mt-1.5 p-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-md shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded flex items-center justify-center">
                            <svg
                              className="w-3 h-3 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L5 10.274zm10 0l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L15 10.274z" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-bold text-xs text-white">
                              {selectedDrug.itemName}
                            </div>
                            <div className="text-xs text-white/90 flex items-center gap-1 flex-wrap">
                              <span className="px-1 py-0.5 bg-white/20 rounded text-xs">
                                {selectedDrug.genericName}
                              </span>
                              <span className="px-1 py-0.5 bg-white/20 rounded text-xs">
                                {selectedDrug.form}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedDrug(null);
                            setDrugSearchQuery("");
                          }}
                          className="px-1.5 py-1 bg-white/20 hover:bg-white/30 text-white text-xs rounded transition-all"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* STEP 2: Medication Details & Frequency - COMPACT */}
              <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 border border-purple-200 rounded-lg p-2 shadow relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/5 rounded-full blur-2xl -z-10"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <svg
                        className="w-3.5 h-3.5 text-purple-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path
                          fillRule="evenodd"
                          d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Details
                    </h4>
                    <span className="bg-purple-100 px-1.5 py-0.5 rounded text-xs font-bold text-purple-700">
                      2/2
                    </span>
                  </div>

                  {/* Compact Input Grid - All in One Row */}
                  <div className="grid grid-cols-4 gap-1.5 mb-1.5">
                    {/* Quantity */}
                    <div>
                      <label className="text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                        <svg
                          className="w-3 h-3 text-purple-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                          <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                          <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                        </svg>
                        Qty
                      </label>
                      <input
                        ref={quantityInputRef}
                        type="number"
                        value={medicationQuantity}
                        onChange={(e) => setMedicationQuantity(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && medicationQuantity) {
                            e.preventDefault();
                            durationInputRef.current?.focus();
                          } else if (e.key === "Delete") {
                            e.preventDefault();
                            setSelectedDrug(null);
                            setDrugSearchQuery("");
                            setMedicationQuantity("");
                            setMedicationFrequency("");
                            setMedicationDuration("");
                            setMedicationInstructions("");
                            setTimeout(
                              () => drugSearchInputRef.current?.focus(),
                              100
                            );
                          }
                        }}
                        min="1"
                        className="w-full px-2 py-1.5 border border-purple-200 rounded-md focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all outline-none text-xs font-semibold bg-white/80"
                        placeholder="Qty"
                      />
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                        <svg
                          className="w-3 h-3 text-purple-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Days
                      </label>
                      <input
                        ref={durationInputRef}
                        type="number"
                        value={medicationDuration}
                        onChange={(e) => setMedicationDuration(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && medicationDuration) {
                            e.preventDefault();
                            // Set default frequency to MANE and focus frequency field
                            setMedicationFrequency("MANE");
                            setCurrentFrequencyIndex(0);
                            setTimeout(
                              () => frequencyInputRef.current?.focus(),
                              100
                            );
                          } else if (e.key === "Tab" && medicationDuration) {
                            // Allow tab to also move to frequency
                            setMedicationFrequency("MANE");
                            setCurrentFrequencyIndex(0);
                          } else if (e.key === "Delete") {
                            e.preventDefault();
                            setSelectedDrug(null);
                            setDrugSearchQuery("");
                            setMedicationQuantity("");
                            setMedicationFrequency("MANE");
                            setMedicationDuration("");
                            setMedicationInstructions("");
                            setTimeout(
                              () => drugSearchInputRef.current?.focus(),
                              100
                            );
                          }
                        }}
                        min="1"
                        className="w-full px-2 py-1.5 border border-purple-200 rounded-md focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all outline-none text-xs font-semibold bg-white/80"
                        placeholder="Days"
                      />
                    </div>

                    {/* Selected Frequency Display */}
                    <div>
                      <label className="text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                        <svg
                          className="w-3 h-3 text-purple-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Frequency
                      </label>
                      <div
                        ref={frequencyInputRef}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowRight" || e.key === "Tab") {
                            e.preventDefault();
                            const nextIndex =
                              (currentFrequencyIndex + 1) %
                              frequencyList.length;
                            setCurrentFrequencyIndex(nextIndex);
                            const nextFreq = frequencyList[nextIndex];
                            if (nextFreq !== undefined)
                              setMedicationFrequency(nextFreq);
                          } else if (e.key === "ArrowLeft") {
                            e.preventDefault();
                            const prevIndex =
                              currentFrequencyIndex === 0
                                ? frequencyList.length - 1
                                : currentFrequencyIndex - 1;
                            setCurrentFrequencyIndex(prevIndex);
                            const prevFreq = frequencyList[prevIndex];
                            if (prevFreq !== undefined)
                              setMedicationFrequency(prevFreq);
                          } else if (e.key === "Enter") {
                            e.preventDefault();
                            setTimeout(
                              () => instructionsInputRef.current?.focus(),
                              100
                            );
                          } else if (e.key === "Delete") {
                            e.preventDefault();
                            setSelectedDrug(null);
                            setDrugSearchQuery("");
                            setMedicationQuantity("");
                            setMedicationFrequency("MANE");
                            setCurrentFrequencyIndex(0);
                            setMedicationDuration("");
                            setMedicationInstructions("");
                            setTimeout(
                              () => drugSearchInputRef.current?.focus(),
                              100
                            );
                          }
                        }}
                        className="px-2 py-1.5 border-2 rounded-md text-xs font-bold text-center transition-all shadow-lg cursor-pointer focus:ring-2 focus:ring-purple-500 outline-none"
                        style={{
                          borderColor: medicationFrequency
                            ? "#9333ea"
                            : "#d1d5db",
                          background: medicationFrequency
                            ? "linear-gradient(to right, #c084fc, #a855f7, #9333ea)"
                            : "linear-gradient(to right, #f3f4f6, #e5e7eb, #d1d5db)",
                          color: medicationFrequency ? "#ffffff" : "#374151",
                        }}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="uppercase tracking-wide">
                            {medicationFrequency}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Instructions Input */}
                    <div className="relative">
                      <label className="text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                        <svg
                          className="w-3 h-3 text-purple-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Instructions
                      </label>
                      <input
                        ref={instructionsInputRef}
                        type="text"
                        value={medicationInstructions}
                        onChange={(e) => {
                          setMedicationInstructions(e.target.value);
                          setSelectedInstructionIndex(0); // Reset selection on text change
                        }}
                        onFocus={() => {
                          setShowInstructionsDropdown(true);
                          setSelectedInstructionIndex(0);
                        }}
                        onKeyDown={(e) => {
                          const filteredInstructions =
                            commonInstructions.filter((inst) =>
                              inst.instruction
                                .toLowerCase()
                                .includes(medicationInstructions.toLowerCase())
                            );

                          if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setSelectedInstructionIndex((prev) =>
                              prev < filteredInstructions.length - 1
                                ? prev + 1
                                : prev
                            );
                          } else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            setSelectedInstructionIndex((prev) =>
                              prev > 0 ? prev - 1 : 0
                            );
                          } else if (e.key === "Enter") {
                            e.preventDefault();

                            // If dropdown is open and there are filtered results, select the highlighted instruction
                            if (
                              showInstructionsDropdown &&
                              filteredInstructions.length > 0
                            ) {
                              const selectedInstruction =
                                filteredInstructions[selectedInstructionIndex];
                              if (selectedInstruction) {
                                setMedicationInstructions(
                                  selectedInstruction.instruction
                                );
                                setShowInstructionsDropdown(false);
                              }
                            } else {
                              // Otherwise, submit the medication
                              setShowInstructionsDropdown(false);
                              if (
                                selectedDrug &&
                                medicationQuantity &&
                                medicationFrequency &&
                                medicationDuration
                              ) {
                                const newMed: PrescribedMedication = {
                                  id: Date.now().toString(),
                                  drugId: selectedDrug.id,
                                  itemCode: selectedDrug.itemCode,
                                  drugName: selectedDrug.itemName,
                                  strength: "",
                                  form: selectedDrug.form,
                                  quantity: parseInt(medicationQuantity),
                                  frequency: medicationFrequency,
                                  duration: parseInt(medicationDuration),
                                  specialInstructions:
                                    medicationInstructions || undefined,
                                };
                                setPrescribedMeds([...prescribedMeds, newMed]);

                                // Show success animation
                                setShowAddSuccess(true);
                                setTimeout(
                                  () => setShowAddSuccess(false),
                                  2000
                                );

                                setSelectedDrug(null);
                                setDrugSearchQuery("");
                                setMedicationQuantity("");
                                setMedicationFrequency("");
                                setMedicationDuration("");
                                setMedicationInstructions("");
                                setTimeout(
                                  () => drugSearchInputRef.current?.focus(),
                                  100
                                );
                              }
                            }
                          } else if (e.key === "Escape") {
                            setShowInstructionsDropdown(false);
                          } else if (e.key === "Delete") {
                            e.preventDefault();
                            // Clear all fields
                            setSelectedDrug(null);
                            setDrugSearchQuery("");
                            setMedicationQuantity("");
                            setMedicationFrequency("");
                            setMedicationDuration("");
                            setMedicationInstructions("");
                            setTimeout(
                              () => drugSearchInputRef.current?.focus(),
                              100
                            );
                          }
                        }}
                        className="w-full px-2 py-1.5 border border-purple-200 rounded-md focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all outline-none text-xs bg-white/80"
                        placeholder="Optional..."
                      />

                      {/* Instructions Dropdown with Filtering */}
                      {showInstructionsDropdown &&
                        (() => {
                          const filteredInstructions =
                            commonInstructions.filter((inst) =>
                              inst.instruction
                                .toLowerCase()
                                .includes(medicationInstructions.toLowerCase())
                            );

                          return filteredInstructions.length > 0 ? (
                            <div className="absolute z-[100] w-full mt-1 bg-white border-2 border-purple-300 rounded-md shadow-2xl max-h-48 overflow-y-auto">
                              <div className="p-1">
                                <div className="px-2 py-1 bg-gradient-to-r from-purple-50 to-pink-50 rounded mb-1 flex items-center justify-between border-b-2 border-purple-200">
                                  <span className="text-xs font-bold text-purple-700 uppercase flex items-center gap-1">
                                    <svg
                                      className="w-4 h-4"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    Suggestions ({filteredInstructions.length})
                                  </span>
                                  <button
                                    onClick={() =>
                                      setShowInstructionsDropdown(false)
                                    }
                                    className="text-gray-400 hover:text-gray-600"
                                  >
                                    <svg
                                      className="w-3 h-3"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                  {filteredInstructions.map((inst, index) => (
                                    <div
                                      key={inst.id}
                                      onClick={() => {
                                        setMedicationInstructions(
                                          inst.instruction
                                        );
                                        setShowInstructionsDropdown(false);
                                      }}
                                      className={`px-2 py-1.5 cursor-pointer rounded transition-all border group ${
                                        index === selectedInstructionIndex
                                          ? "bg-gradient-to-r from-purple-100 to-pink-100 border-purple-300"
                                          : "hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 border-transparent hover:border-purple-200"
                                      }`}
                                    >
                                      <div
                                        className={`text-xs flex items-center gap-1 ${
                                          index === selectedInstructionIndex
                                            ? "text-purple-700 font-bold"
                                            : "text-gray-700 group-hover:text-purple-700"
                                        }`}
                                      >
                                        <svg
                                          className={`w-3 h-3 text-purple-500 transition-opacity ${
                                            index === selectedInstructionIndex
                                              ? "opacity-100"
                                              : "opacity-0 group-hover:opacity-100"
                                          }`}
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                        {inst.instruction}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : null;
                        })()}
                    </div>
                  </div>

                  {/* Quick Frequency Selection */}
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                      <svg
                        className="w-3.5 h-3.5 text-purple-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Frequency
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1">
                      {/* MANE Button */}
                      <button
                        onClick={() => {
                          setMedicationFrequency("MANE");
                          setCurrentFrequencyIndex(0);
                          setShowFrequencyDropdown(false);
                          setTimeout(
                            () => instructionsInputRef.current?.focus(),
                            100
                          );
                        }}
                        className="px-2 py-2 rounded-md text-xs transition-all"
                        style={
                          medicationFrequency?.toUpperCase() === "MANE"
                            ? {
                                background:
                                  "linear-gradient(to bottom right, #10b981, #16a34a)",
                                color: "#ffffff",
                                boxShadow: "0 0 0 1px rgb(110 231 183 / 0.3)",
                              }
                            : {
                                background: "#ffffff",
                                border: "1px solid rgb(167 243 208)",
                                color: "rgb(4 120 87)",
                              }
                        }
                      >
                        <div className="opacity-75 mb-0.5">☀️</div>
                        <div className="font-bold">MANE</div>
                      </button>

                      {/* NOCTE Button */}
                      <button
                        onClick={() => {
                          setMedicationFrequency("NOCTE");
                          setCurrentFrequencyIndex(1);
                          setShowFrequencyDropdown(false);
                          setTimeout(
                            () => instructionsInputRef.current?.focus(),
                            100
                          );
                        }}
                        className="px-2 py-2 rounded-md text-xs transition-all"
                        style={
                          medicationFrequency?.toUpperCase() === "NOCTE"
                            ? {
                                background:
                                  "linear-gradient(to bottom right, #6366f1, #2563eb)",
                                color: "#ffffff",
                                boxShadow: "0 0 0 1px rgb(165 180 252 / 0.3)",
                              }
                            : {
                                background: "#ffffff",
                                border: "1px solid rgb(199 210 254)",
                                color: "rgb(67 56 202)",
                              }
                        }
                      >
                        <div className="opacity-75 mb-0.5">🌙</div>
                        <div className="font-bold">NOCTE</div>
                      </button>

                      {/* BD Button */}
                      <button
                        onClick={() => {
                          setMedicationFrequency("BD");
                          setCurrentFrequencyIndex(2);
                          setShowFrequencyDropdown(false);
                          setTimeout(
                            () => instructionsInputRef.current?.focus(),
                            100
                          );
                        }}
                        className="px-2 py-2 rounded-md text-xs transition-all"
                        style={
                          medicationFrequency?.toUpperCase() === "BD"
                            ? {
                                background:
                                  "linear-gradient(to bottom right, #3b82f6, #06b6d4)",
                                color: "#ffffff",
                                boxShadow: "0 0 0 1px rgb(147 197 253 / 0.3)",
                              }
                            : {
                                background: "#ffffff",
                                border: "1px solid rgb(191 219 254)",
                                color: "rgb(29 78 216)",
                              }
                        }
                      >
                        <div className="opacity-75 mb-0.5">📅</div>
                        <div className="font-bold">BD</div>
                      </button>

                      {/* TDS Button */}
                      <button
                        onClick={() => {
                          setMedicationFrequency("TDS");
                          setCurrentFrequencyIndex(3);
                          setShowFrequencyDropdown(false);
                          setTimeout(
                            () => instructionsInputRef.current?.focus(),
                            100
                          );
                        }}
                        className="px-2 py-2 rounded-md text-xs transition-all"
                        style={
                          medicationFrequency?.toUpperCase() === "TDS"
                            ? {
                                background:
                                  "linear-gradient(to bottom right, #f59e0b, #ea580c)",
                                color: "#ffffff",
                                boxShadow: "0 0 0 1px rgb(252 211 77 / 0.3)",
                              }
                            : {
                                background: "#ffffff",
                                border: "1px solid rgb(253 230 138)",
                                color: "rgb(180 83 9)",
                              }
                        }
                      >
                        <div className="opacity-75 mb-0.5">⏰</div>
                        <div className="font-bold">TDS</div>
                      </button>

                      {/* QDS Button */}
                      <button
                        onClick={() => {
                          setMedicationFrequency("QDS");
                          setCurrentFrequencyIndex(4);
                          setShowFrequencyDropdown(false);
                          setTimeout(
                            () => instructionsInputRef.current?.focus(),
                            100
                          );
                        }}
                        className="px-2 py-2 rounded-md text-xs transition-all"
                        style={
                          medicationFrequency?.toUpperCase() === "QDS"
                            ? {
                                background:
                                  "linear-gradient(to bottom right, #8b5cf6, #9333ea)",
                                color: "#ffffff",
                                boxShadow: "0 0 0 1px rgb(196 181 253 / 0.3)",
                              }
                            : {
                                background: "#ffffff",
                                border: "1px solid rgb(221 214 254)",
                                color: "rgb(109 40 217)",
                              }
                        }
                      >
                        <div className="opacity-75 mb-0.5">🔄</div>
                        <div className="font-bold">QDS</div>
                      </button>

                      {/* HOURLY Button */}
                      <button
                        onClick={() => {
                          setMedicationFrequency("HOURLY");
                          setCurrentFrequencyIndex(5);
                          setShowFrequencyDropdown(false);
                          setTimeout(
                            () => instructionsInputRef.current?.focus(),
                            100
                          );
                        }}
                        className="px-2 py-2 rounded-md text-xs transition-all"
                        style={
                          medicationFrequency?.toUpperCase() === "HOURLY"
                            ? {
                                background:
                                  "linear-gradient(to bottom right, #ef4444, #f43f5e)",
                                color: "#ffffff",
                                boxShadow: "0 0 0 1px rgb(252 165 165 / 0.3)",
                              }
                            : {
                                background: "#ffffff",
                                border: "1px solid rgb(254 202 202)",
                                color: "rgb(185 28 28)",
                              }
                        }
                      >
                        <div className="opacity-75 mb-0.5">⚡</div>
                        <div className="font-bold">HOURLY</div>
                      </button>
                    </div>

                    {/* More Frequencies */}
                    <button
                      onClick={() =>
                        setShowFrequencyDropdown(!showFrequencyDropdown)
                      }
                      className="mt-1.5 w-full px-2 py-1.5 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 text-gray-700 rounded-md text-xs font-bold hover:from-gray-100 hover:to-gray-200 hover:border-gray-300 transition-all flex items-center justify-center gap-1"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path
                          fillRule="evenodd"
                          d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      More ({frequencyOptions.length - 6})
                      <svg
                        className={`w-3.5 h-3.5 transition-transform ${
                          showFrequencyDropdown ? "rotate-180" : ""
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    {showFrequencyDropdown && (
                      <div className="mt-1 bg-white border-2 border-purple-300 rounded-md shadow-2xl p-1 max-h-48 overflow-y-auto animate-fadeIn z-[100] relative">
                        {frequencyOptions.slice(6).map((freq) => (
                          <div
                            key={freq.id}
                            onClick={() => {
                              setMedicationFrequency(freq.value);
                              setShowFrequencyDropdown(false);
                              setTimeout(
                                () => instructionsInputRef.current?.focus(),
                                100
                              );
                            }}
                            className="px-2 py-1.5 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 cursor-pointer rounded transition-all border-b border-gray-100 last:border-b-0 group"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-bold text-xs text-gray-800 group-hover:text-purple-700">
                                  {freq.label}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {freq.description}
                                </div>
                              </div>
                              <svg
                                className="w-4 h-4 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"
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
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add to Prescription Button */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (
                          !selectedDrug ||
                          !medicationQuantity ||
                          !medicationFrequency ||
                          !medicationDuration
                        ) {
                          alert(
                            "Please fill in all required fields (Quantity, Frequency, Duration)"
                          );
                          return;
                        }
                        const newMed: PrescribedMedication = {
                          id: Date.now().toString(),
                          drugId: selectedDrug.id,
                          itemCode: selectedDrug.itemCode,
                          drugName: selectedDrug.itemName,
                          strength: "",
                          form: selectedDrug.form,
                          quantity: parseInt(medicationQuantity),
                          frequency: medicationFrequency,
                          duration: parseInt(medicationDuration),
                          specialInstructions:
                            medicationInstructions || undefined,
                        };
                        setPrescribedMeds([...prescribedMeds, newMed]);

                        // Show success animation
                        setShowAddSuccess(true);
                        setTimeout(() => setShowAddSuccess(false), 2000);

                        setSelectedDrug(null);
                        setDrugSearchQuery("");
                        setMedicationQuantity("");
                        setMedicationFrequency("");
                        setMedicationDuration("");
                        setMedicationInstructions("");
                        setTimeout(
                          () => drugSearchInputRef.current?.focus(),
                          100
                        );
                      }}
                      className="flex-1 px-3 py-2 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 hover:from-emerald-600 hover:via-green-600 hover:to-teal-700 text-white font-bold rounded-md transition-all shadow hover:shadow-lg text-xs flex items-center justify-center gap-1.5 border border-white/20"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Add to List</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDrug(null);
                        setDrugSearchQuery("");
                        setMedicationQuantity("");
                        setMedicationFrequency("");
                        setMedicationDuration("");
                        setMedicationInstructions("");
                        setTimeout(
                          () => drugSearchInputRef.current?.focus(),
                          100
                        );
                      }}
                      title="Press Delete key to clear"
                      className="px-3 py-2 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white font-bold rounded-md transition-all shadow hover:shadow-lg text-xs flex items-center justify-center gap-1.5 border border-white/20 relative group"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Clear</span>
                      <span className="ml-0.5 px-1 py-0.5 bg-white/20 rounded text-xs">
                        Del
                      </span>
                    </button>
                  </div>

                  {/* Success Message Animation */}
                  {showAddSuccess && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[200] animate-bounce">
                      <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 text-white px-6 py-3 rounded-lg shadow-2xl border-2 border-white flex items-center gap-2 animate-pulse">
                        <svg
                          className="w-6 h-6 animate-spin"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="font-bold text-sm">
                          Added to Prescription List!
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Prescribed Medications Grid */}
              <div
                style={{
                  background: "transparent",
                  border: "2px solid rgba(16, 185, 129, 0.3)",
                  borderRadius: "16px",
                  padding: "16px",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{ position: "relative", zIndex: 10 }}>
                  {/* Header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          background:
                            "linear-gradient(to bottom right, #10b981, #059669)",
                          color: "#fff",
                          borderRadius: "12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 4px 6px rgba(16, 185, 129, 0.3)",
                        }}
                      >
                        <svg
                          style={{ width: "24px", height: "24px" }}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                          <path
                            fillRule="evenodd"
                            d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div>
                        <h2
                          style={{
                            fontSize: "16px",
                            fontWeight: "700",
                            color: "#1f2937",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          Current Prescription List
                        </h2>
                        <p style={{ fontSize: "12px", color: "#6b7280" }}>
                          {prescribedMeds.length}{" "}
                          {prescribedMeds.length === 1
                            ? "medication"
                            : "medications"}{" "}
                          prescribed
                        </p>
                      </div>
                    </div>
                    {prescribedMeds.length > 0 && (
                      <div
                        style={{
                          background: "rgba(16, 185, 129, 0.1)",
                          border: "1px solid rgba(16, 185, 129, 0.3)",
                          padding: "8px 16px",
                          borderRadius: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: "700",
                            color: "#059669",
                          }}
                        >
                          {prescribedMeds.length} Items
                        </span>
                      </div>
                    )}
                  </div>

                  {prescribedMeds.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "64px 0" }}>
                      <div
                        style={{
                          width: "96px",
                          height: "96px",
                          background:
                            "linear-gradient(to bottom right, rgba(229, 231, 235, 0.5), rgba(209, 213, 219, 0.5))",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 16px",
                          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.06)",
                        }}
                      >
                        <svg
                          style={{
                            width: "48px",
                            height: "48px",
                            color: "#9ca3af",
                          }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                          />
                        </svg>
                      </div>
                      <p
                        style={{
                          fontSize: "16px",
                          fontWeight: "700",
                          color: "#374151",
                          marginBottom: "8px",
                        }}
                      >
                        No Medications Prescribed Yet
                      </p>
                      <p style={{ fontSize: "14px", color: "#6b7280" }}>
                        Search and add medications above to build the
                        prescription list
                      </p>
                    </div>
                  ) : (
                    <div
                      style={{
                        overflowX: "auto",
                        borderRadius: "12px",
                        border: "2px solid rgba(16, 185, 129, 0.2)",
                      }}
                    >
                      <table style={{ width: "100%", fontSize: "13px" }}>
                        <thead>
                          <tr
                            style={{
                              background:
                                "linear-gradient(to right, #10b981, #059669, #0d9488)",
                              color: "#fff",
                            }}
                          >
                            <th
                              style={{
                                padding: "8px 12px",
                                textAlign: "left",
                                borderTopLeftRadius: "12px",
                                fontSize: "11px",
                                fontWeight: "700",
                              }}
                            >
                              LN
                            </th>
                            <th
                              style={{
                                padding: "8px 12px",
                                textAlign: "left",
                                fontSize: "11px",
                                fontWeight: "700",
                              }}
                            >
                              Item Code
                            </th>
                            <th
                              style={{
                                padding: "8px 12px",
                                textAlign: "left",
                                fontSize: "11px",
                                fontWeight: "700",
                              }}
                            >
                              Item Name
                            </th>
                            <th
                              style={{
                                padding: "8px 12px",
                                textAlign: "left",
                                fontSize: "11px",
                                fontWeight: "700",
                              }}
                            >
                              Form
                            </th>
                            <th
                              style={{
                                padding: "8px 12px",
                                textAlign: "left",
                                fontSize: "11px",
                                fontWeight: "700",
                              }}
                            >
                              Quantity
                            </th>
                            <th
                              style={{
                                padding: "8px 12px",
                                textAlign: "left",
                                fontSize: "11px",
                                fontWeight: "700",
                              }}
                            >
                              Frequency
                            </th>
                            <th
                              style={{
                                padding: "8px 12px",
                                textAlign: "left",
                                fontSize: "11px",
                                fontWeight: "700",
                              }}
                            >
                              Duration
                            </th>
                            <th
                              style={{
                                padding: "8px 12px",
                                textAlign: "left",
                                fontSize: "11px",
                                fontWeight: "700",
                              }}
                            >
                              Instructions
                            </th>
                            <th
                              style={{
                                padding: "8px 12px",
                                textAlign: "center",
                                borderTopRightRadius: "12px",
                                fontSize: "11px",
                                fontWeight: "700",
                              }}
                            >
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody
                          style={{ background: "rgba(255, 255, 255, 0.5)" }}
                        >
                          {prescribedMeds.map((med, index) => (
                            <tr
                              key={med.id}
                              style={{
                                borderBottom:
                                  "2px solid rgba(16, 185, 129, 0.1)",
                                transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background =
                                  "linear-gradient(to right, rgba(16, 185, 129, 0.05), rgba(5, 150, 105, 0.05))";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background =
                                  "transparent";
                              }}
                            >
                              <td
                                style={{
                                  padding: "6px 10px",
                                  fontWeight: "700",
                                  color: "#4b5563",
                                }}
                              >
                                <div
                                  style={{
                                    width: "24px",
                                    height: "24px",
                                    background:
                                      "linear-gradient(to bottom right, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.15))",
                                    borderRadius: "6px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#059669",
                                    fontSize: "11px",
                                    fontWeight: "700",
                                  }}
                                >
                                  {index + 1}
                                </div>
                              </td>
                              <td style={{ padding: "6px 10px" }}>
                                <span
                                  style={{
                                    padding: "3px 8px",
                                    background: "rgba(99, 102, 241, 0.1)",
                                    color: "#4338ca",
                                    borderRadius: "6px",
                                    fontSize: "11px",
                                    fontWeight: "700",
                                  }}
                                >
                                  {med.itemCode || "N/A"}
                                </span>
                              </td>
                              <td style={{ padding: "6px 10px" }}>
                                <div
                                  style={{
                                    fontWeight: "600",
                                    color: "#1f2937",
                                    fontSize: "12px",
                                  }}
                                >
                                  {med.drugName}
                                </div>
                              </td>
                              <td style={{ padding: "6px 10px" }}>
                                <span
                                  style={{
                                    padding: "3px 8px",
                                    background: "rgba(168, 85, 247, 0.1)",
                                    color: "#7c3aed",
                                    borderRadius: "6px",
                                    fontSize: "11px",
                                    fontWeight: "700",
                                  }}
                                >
                                  {med.form}
                                </span>
                              </td>
                              <td style={{ padding: "6px 10px" }}>
                                <span
                                  style={{
                                    fontWeight: "700",
                                    color: "#059669",
                                    fontSize: "13px",
                                  }}
                                >
                                  {Number(med.quantity) *
                                    Number(med.duration) *
                                    getFrequencyMultiplier(med.frequency)}
                                </span>
                              </td>
                              <td style={{ padding: "6px 10px" }}>
                                <select
                                  value={med.frequency}
                                  onChange={(e) => {
                                    const newFrequency = e.target.value;
                                    // Update the medication in the list
                                    setPrescribedMeds(
                                      prescribedMeds.map((m) =>
                                        m.id === med.id
                                          ? { ...m, frequency: newFrequency }
                                          : m
                                      )
                                    );
                                    // Also update the frequency bar selection
                                    setMedicationFrequency(newFrequency);
                                    const newIndex = frequencyList.findIndex(
                                      (f) =>
                                        f.toUpperCase() ===
                                        newFrequency.toUpperCase()
                                    );
                                    if (newIndex !== -1) {
                                      setCurrentFrequencyIndex(newIndex);
                                    }
                                  }}
                                  style={{
                                    padding: "4px 10px",
                                    borderRadius: "9999px",
                                    fontSize: "10px",
                                    fontWeight: "700",
                                    textTransform: "uppercase",
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                    background:
                                      "linear-gradient(to right, #f59e0b, #ea580c)",
                                    color: "#ffffff",
                                    border: "none",
                                    cursor: "pointer",
                                    outline: "none",
                                  }}
                                >
                                  {frequencyOptions.map((freq) => (
                                    <option
                                      key={freq.id}
                                      value={freq.value}
                                      style={{
                                        background: "#ffffff",
                                        color: "#374151",
                                      }}
                                    >
                                      {freq.label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td style={{ padding: "6px 10px" }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  <svg
                                    style={{
                                      width: "14px",
                                      height: "14px",
                                      color: "#6b7280",
                                    }}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  <span
                                    style={{
                                      fontWeight: "600",
                                      color: "#374151",
                                      fontSize: "12px",
                                    }}
                                  >
                                    {med.duration} days
                                  </span>
                                </div>
                              </td>
                              <td
                                style={{
                                  padding: "6px 10px",
                                  maxWidth: "250px",
                                }}
                              >
                                {med.specialInstructions ? (
                                  <div
                                    style={{
                                      fontSize: "11px",
                                      color: "#4b5563",
                                      background: "rgba(249, 250, 251, 0.5)",
                                      padding: "3px 6px",
                                      borderRadius: "4px",
                                      border:
                                        "1px solid rgba(209, 213, 219, 0.5)",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                    title={med.specialInstructions}
                                  >
                                    {med.specialInstructions}
                                  </div>
                                ) : (
                                  <span
                                    style={{
                                      fontSize: "11px",
                                      color: "#9ca3af",
                                      fontStyle: "italic",
                                    }}
                                  >
                                    No instructions
                                  </span>
                                )}
                              </td>
                              <td
                                style={{
                                  padding: "6px 10px",
                                  textAlign: "center",
                                }}
                              >
                                <button
                                  onClick={() =>
                                    setPrescribedMeds(
                                      prescribedMeds.filter(
                                        (m) => m.id !== med.id
                                      )
                                    )
                                  }
                                  style={{
                                    padding: "6px 12px",
                                    background:
                                      "linear-gradient(to right, #ef4444, #f43f5e)",
                                    color: "#fff",
                                    borderRadius: "6px",
                                    transition: "all 0.2s",
                                    fontWeight: "700",
                                    fontSize: "10px",
                                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                                    border: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    margin: "0 auto",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background =
                                      "linear-gradient(to right, #dc2626, #e11d48)";
                                    e.currentTarget.style.boxShadow =
                                      "0 6px 10px rgba(0, 0, 0, 0.15)";
                                    e.currentTarget.style.transform =
                                      "translateY(-2px)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background =
                                      "linear-gradient(to right, #ef4444, #f43f5e)";
                                    e.currentTarget.style.boxShadow =
                                      "0 4px 6px rgba(0, 0, 0, 0.1)";
                                    e.currentTarget.style.transform =
                                      "translateY(0)";
                                  }}
                                >
                                  <svg
                                    style={{ width: "16px", height: "16px" }}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {prescribedMeds.length > 0 && (
                    <div
                      style={{
                        marginTop: "16px",
                        display: "flex",
                        flexDirection: "row",
                        gap: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{
                          flex: "1",
                          minWidth: "250px",
                          border: "2px solid rgba(134, 239, 172, 0.3)",
                          borderRadius: "12px",
                          padding: "16px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background:
                            "linear-gradient(to right, rgba(209, 250, 229, 0.3), rgba(167, 243, 208, 0.3))",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: "600",
                              textTransform: "uppercase",
                              marginBottom: "4px",
                              color: "#15803d",
                            }}
                          >
                            Total Medications
                          </div>
                          <div
                            style={{
                              fontSize: "24px",
                              fontWeight: "700",
                              color: "#166534",
                            }}
                          >
                            {prescribedMeds.length}
                          </div>
                        </div>
                        <svg
                          style={{
                            width: "48px",
                            height: "48px",
                            opacity: 0.2,
                            color: "#22c55e",
                          }}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L5 10.274zm10 0l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L15 10.274z" />
                        </svg>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          onClick={() => setPrescribedMeds([])}
                          style={{
                            padding: "12px 24px",
                            borderRadius: "12px",
                            transition: "all 0.2s",
                            fontWeight: "700",
                            fontSize: "14px",
                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            background:
                              "linear-gradient(to right, #6b7280, #4b5563)",
                            color: "#ffffff",
                            border: "none",
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              "linear-gradient(to right, #4b5563, #374151)";
                            e.currentTarget.style.boxShadow =
                              "0 6px 10px rgba(0, 0, 0, 0.15)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                              "linear-gradient(to right, #6b7280, #4b5563)";
                            e.currentTarget.style.boxShadow =
                              "0 4px 6px rgba(0, 0, 0, 0.1)";
                          }}
                        >
                          <svg
                            style={{ width: "20px", height: "20px" }}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Clear All
                        </button>
                        <button
                          onClick={() => {
                            openHistoryModal("Prescription", [
                              "05-04-2025: Paracetamol 500mg TDS x 3 days",
                            ]);
                          }}
                          style={{
                            padding: "12px 24px",
                            background:
                              "linear-gradient(to right, #3b82f6, #06b6d4)",
                            color: "#fff",
                            borderRadius: "12px",
                            transition: "all 0.2s",
                            fontWeight: "700",
                            fontSize: "14px",
                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            border: "none",
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              "linear-gradient(to right, #2563eb, #0891b2)";
                            e.currentTarget.style.boxShadow =
                              "0 6px 10px rgba(0, 0, 0, 0.15)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                              "linear-gradient(to right, #3b82f6, #06b6d4)";
                            e.currentTarget.style.boxShadow =
                              "0 4px 6px rgba(0, 0, 0, 0.1)";
                          }}
                        >
                          <svg
                            style={{ width: "20px", height: "20px" }}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          History
                        </button>
                        <button
                          onClick={() => {
                            if (prescribedMeds.length === 0) {
                              alert(
                                "Please add medications to the prescription first."
                              );
                              return;
                            }
                            setShowMedicationPrintModal(true);
                          }}
                          style={{
                            padding: "12px 32px",
                            background:
                              "linear-gradient(to right, #10b981, #059669, #0d9488)",
                            color: "#fff",
                            borderRadius: "12px",
                            transition: "all 0.2s",
                            fontWeight: "700",
                            fontSize: "14px",
                            boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            border: "2px solid rgba(255, 255, 255, 0.2)",
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              "linear-gradient(to right, #059669, #047857, #0f766e)";
                            e.currentTarget.style.boxShadow =
                              "0 20px 25px rgba(0, 0, 0, 0.15)";
                            e.currentTarget.style.transform =
                              "translateY(-4px)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                              "linear-gradient(to right, #10b981, #059669, #0d9488)";
                            e.currentTarget.style.boxShadow =
                              "0 10px 15px rgba(0, 0, 0, 0.1)";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          <svg
                            style={{ width: "24px", height: "24px" }}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                          </svg>
                          Print Prescription
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Keyboard Shortcuts Help */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border-2 border-gray-200 shadow-md">
                <h3 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    />
                  </svg>
                  Keyboard Shortcuts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded font-mono font-bold">
                      Type
                    </span>
                    <span className="text-gray-600">
                      Auto search after 3 chars
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200">
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded font-mono font-bold">
                      Enter
                    </span>
                    <span className="text-gray-600">Qty → Frequency</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-mono font-bold">
                      Enter
                    </span>
                    <span className="text-gray-600">
                      Duration → Instructions
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-mono font-bold">
                      Ctrl+Enter
                    </span>
                    <span className="text-gray-600">Add to Prescription</span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="flex items-start gap-3 rounded-2xl border border-white/30 bg-white/10 px-3 py-3 text-white shadow-inner">
                    <div className="rounded-xl bg-white/20 p-2 text-amber-100">
                      <ExclamationTriangleIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/70">
                        Clinical Alerts
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {hasAlerts ? (
                          alertTags.map((alert) => (
                            <span
                              key={alert}
                              className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold tracking-wide"
                            >
                              {alert}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-white/70">
                            No allergy alerts recorded for this visit.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl border border-white/30 bg-black/10 px-3 py-3 text-white">
                    <div className="rounded-xl bg-white/10 p-2 text-emerald-100">
                      <ClockIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/70">
                        Queue Snapshot
                      </p>
                      <p className="text-sm font-semibold text-white">
                        {queueSnapshot.pending} pending · {queueSnapshot.onHold}{" "}
                        on hold
                      </p>
                      <p className="text-xs text-white/70">
                        Updates live as front desk changes the queue.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorPP;
