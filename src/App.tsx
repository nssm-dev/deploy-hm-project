import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import type { ComingSoonProps } from "./types";

// Eager load critical routes
import MainLayout from "./components/layout/MainLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Lazy load other pages for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DoctorPP = lazy(() => import("./pages/DoctorPP"));
const Channel = lazy(() => import("./pages/Channel"));
const QuickAppointment = lazy(() => import("./pages/QuickAppointment"));
const Admission = lazy(() => import("./pages/Admission"));
const Cashier = lazy(() => import("./pages/Cashier"));
const ServiceBooking = lazy(() => import("./pages/ServiceBooking"));
const ProfessionalMaster = lazy(() => import("./pages/ProfessionalMaster"));
const SpecialityMaster = lazy(() => import("./pages/SpecialityMaster"));

// Loading component
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-screen bg-gray-50">
    <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
  </div>
);

const App = () => {
  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* Front Desk */}
            <Route path="channel" element={<Channel />} />
            <Route path="channel-quick" element={<QuickAppointment />} />
            <Route path="admission" element={<Admission />} />
            <Route path="cashier" element={<Cashier />} />
            <Route path="service-booking" element={<ServiceBooking />} />
            <Route path="doctor-pp" element={<DoctorPP />} />
            <Route path="doctor-profile" element={<DoctorPP />} />
            <Route
              path="report-issue"
              element={<ComingSoon title="Report Issue" />}
            />

            {/* Master Files */}
            <Route
              path="professional-master"
              element={<ProfessionalMaster />}
            />
            <Route path="speciality-master" element={<SpecialityMaster />} />

            {/* Other Modules */}
            <Route path="service" element={<ComingSoon title="Service" />} />
            <Route
              path="inventory"
              element={<ComingSoon title="Inventory" />}
            />
            <Route
              path="human-resources"
              element={<ComingSoon title="Human Resources" />}
            />
            <Route path="payroll" element={<ComingSoon title="Payroll" />} />
            <Route
              path="financial-accounts"
              element={<ComingSoon title="Financial Accounts" />}
            />
            <Route path="patients" element={<ComingSoon title="Patients" />} />

            {/* User Menu */}
            <Route path="settings" element={<ComingSoon title="Settings" />} />
            <Route
              path="noticeboard"
              element={<ComingSoon title="Noticeboard" />}
            />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
};

// Coming Soon Component
const ComingSoon = ({ title }: ComingSoonProps) => {
  return (
    <div className="p-6 bg-gray-50 min-h-[calc(100vh-64px)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="mt-2 text-gray-500">
          Module management and configuration
        </p>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-12">
          <svg
            className="mx-auto h-24 w-24 mb-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
          <h3 className="text-lg font-medium mb-2 text-gray-900">
            {title} Module
          </h3>
          <p className="text-gray-500">This feature is coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default App;
