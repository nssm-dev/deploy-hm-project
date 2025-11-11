import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { NavbarProps } from "../../types";

const Navbar = ({
  toggleSidebar,
  toggleMinimize,
  isMinimized,
}: NavbarProps) => {
  const navigate = useNavigate();
  const [profileDropdown, setProfileDropdown] = useState<boolean>(false);
  const [messageDropdown, setMessageDropdown] = useState<boolean>(false);
  const [notificationDropdown, setNotificationDropdown] =
    useState<boolean>(false);

  const SIDEBAR_WIDTH = 258;
  const SIDEBAR_MINI_WIDTH = 70;
  const brandWidth = isMinimized ? SIDEBAR_MINI_WIDTH : SIDEBAR_WIDTH;
  const toggleButtonLeft = isMinimized
    ? `${SIDEBAR_MINI_WIDTH + 8}px`
    : `${SIDEBAR_WIDTH + 8}px`;

  const handleLogout = () => {
    // Clear any stored authentication data
    localStorage.clear();
    sessionStorage.clear();

    // Close the dropdown
    setProfileDropdown(false);

    // Navigate to login page
    navigate("/login");
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 bg-gradient-to-r from-white via-gray-50 to-white shadow-lg border-b border-gray-100 backdrop-blur-md h-16"
      style={{ height: "64px", zIndex: 60 }}
    >
      {/* Decorative gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500"></div>

      <div className="flex items-center justify-between h-full pr-4 pl-4 lg:pl-0 relative">
        {/* Logo and Toggle */}
        <div
          className="flex items-center relative z-10"
          style={{ flexShrink: 0 }}
        >
          {/* Mobile Logo - Always show on small screens */}
          <Link
            to="/"
            className="lg:hidden flex items-center group"
            style={{
              backgroundColor: "#0f172a",
              padding: "0 1.5rem",
              height: "64px",
            }}
          >
            <img
              src="/assets/images/NS_logo.svg"
              alt="NS HIMS"
              className="h-8 group-hover:scale-110 transition-transform duration-300"
            />
          </Link>

          {/* Desktop brand block */}
          <Link
            to="/"
            className="hidden lg:flex items-center group"
            style={{
              width: `${brandWidth}px`,
              height: "64px",
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
              padding: isMinimized ? "0" : "0 1.5rem",
              justifyContent: isMinimized ? "center" : "flex-start",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              borderRight: "1px solid rgba(148, 163, 184, 0.1)",
              overflow: "hidden",
              boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.05)",
            }}
          >
            {isMinimized ? (
              <img
                src="/assets/images/NS-logo-mini.svg"
                alt="Nine Sense"
                className="h-8 w-8 group-hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <>
                <img
                  src="/assets/images/NS_logo.svg"
                  alt="Nine Sense"
                  className="h-8 group-hover:scale-105 transition-transform duration-300"
                />
              </>
            )}
          </Link>
        </div>

        {/* Minimize/Expand Button - Desktop (Always visible) */}
        <button
          onClick={toggleMinimize}
          className="hidden lg:flex items-center justify-center absolute top-1/2 transform -translate-y-1/2 p-2.5 rounded-xl bg-gradient-to-br from-emerald-50 to-blue-50 hover:from-emerald-100 hover:to-blue-100 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 group"
          style={{
            color: "#059669",
            left: toggleButtonLeft,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            zIndex: 70,
          }}
          title={isMinimized ? "Expand Sidebar" : "Minimize Sidebar"}
        >
          {isMinimized ? (
            // Right double arrow when minimized (expand icon)
            <svg
              className="w-5 h-5 group-hover:translate-x-0.5 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </svg>
          ) : (
            // Hamburger when expanded (minimize icon)
            <svg
              className="w-5 h-5 group-hover:scale-95 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>

        {/* Mobile Menu Toggle */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2.5 rounded-xl bg-gradient-to-br from-emerald-50 to-blue-50 hover:from-emerald-100 hover:to-blue-100 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105"
          style={{ color: "#059669" }}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Search Bar */}
        <div className="hidden xl:flex flex-1 max-w-md mx-8">
          <div className="relative w-full group">
            <div
              className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none transition-colors duration-300 group-focus-within:text-emerald-600"
              style={{ color: "#94a3b8" }}
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              className="w-full pl-11 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all duration-300 bg-white hover:border-gray-300"
              style={{ fontSize: "0.875rem" }}
              placeholder="Search patients, doctors, appointments..."
            />
          </div>
        </div>

        {/* Right Side Items */}
        <div className="flex items-center space-x-3">
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setNotificationDropdown(!notificationDropdown)}
              className="relative p-2.5 rounded-xl bg-white hover:bg-gradient-to-br hover:from-orange-50 hover:to-red-50 border border-gray-200 hover:border-orange-300 transition-all duration-300 hover:scale-105 hover:shadow-md group"
            >
              <svg
                className="w-5 h-5 text-gray-600 group-hover:text-orange-600 transition-colors duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="absolute -top-1 -right-1 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-gradient-to-br from-red-500 to-red-600 items-center justify-center text-[9px] font-bold text-white shadow-md">
                  3
                </span>
              </span>
            </button>

            {notificationDropdown && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl overflow-hidden z-50 border border-gray-100 animate-fadeIn">
                {/* Gradient Header */}
                <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white px-5 py-4">
                  <div className="flex items-center justify-between">
                    <h6 className="font-bold text-base">Notifications</h6>
                    <span className="bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-semibold">
                      3 New
                    </span>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <div className="p-4 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 border-b border-gray-100 transition-all duration-200 cursor-pointer group">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-11 h-11 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300">
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
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h6 className="text-sm font-bold text-gray-800 mb-0.5">
                          Event today
                        </h6>
                        <p className="text-xs text-gray-500 line-clamp-2">
                          Just a reminder that you have an event today
                        </p>
                        <span className="text-[10px] text-emerald-600 font-semibold mt-1 inline-block">
                          2 min ago
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 border-b border-gray-100 transition-all duration-200 cursor-pointer group">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-11 h-11 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300">
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
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h6 className="text-sm font-bold text-gray-800 mb-0.5">
                          Settings
                        </h6>
                        <p className="text-xs text-gray-500">
                          Update dashboard
                        </p>
                        <span className="text-[10px] text-amber-600 font-semibold mt-1 inline-block">
                          15 min ago
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 border-b border-gray-100 transition-all duration-200 cursor-pointer group">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300">
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
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h6 className="text-sm font-bold text-gray-800 mb-0.5">
                          Launch Admin
                        </h6>
                        <p className="text-xs text-gray-500">New admin wow!</p>
                        <span className="text-[10px] text-blue-600 font-semibold mt-1 inline-block">
                          1 hour ago
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-3 text-center bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
                  <button className="text-sm text-emerald-600 hover:text-emerald-700 font-bold transition-colors duration-200">
                    See all notifications →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Messages Dropdown */}
          <div className="relative">
            <button
              onClick={() => setMessageDropdown(!messageDropdown)}
              className="relative p-2.5 rounded-xl bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:scale-105 hover:shadow-md group"
            >
              <svg
                className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-md">
                4
              </span>
            </button>

            {messageDropdown && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-fadeIn z-50">
                {/* Gradient Header */}
                <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white px-5 py-4">
                  <div className="flex items-center justify-between">
                    <h6 className="font-bold text-base">Messages</h6>
                    <span className="bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-semibold">
                      4 New
                    </span>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <div className="p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border-b border-gray-100 transition-all duration-200 cursor-pointer group">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold shadow-md group-hover:scale-110 transition-transform duration-300">
                        S
                      </div>
                      <div className="flex-1 min-w-0">
                        <h6 className="text-sm font-bold text-gray-800 mb-0.5">
                          Sanka send you a message
                        </h6>
                        <p className="text-xs text-gray-500">1 Minutes ago</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border-b border-gray-100 transition-all duration-200 cursor-pointer group">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-md group-hover:scale-110 transition-transform duration-300">
                        A
                      </div>
                      <div className="flex-1 min-w-0">
                        <h6 className="text-sm font-bold text-gray-800 mb-0.5">
                          Aaquib send you a message
                        </h6>
                        <p className="text-xs text-gray-500">15 Minutes ago</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border-b border-gray-100 transition-all duration-200 cursor-pointer group">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold shadow-md group-hover:scale-110 transition-transform duration-300">
                        M
                      </div>
                      <div className="flex-1 min-w-0">
                        <h6 className="text-sm font-bold text-gray-800 mb-0.5">
                          Manjula send you a message
                        </h6>
                        <p className="text-xs text-gray-500">18 Minutes ago</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-3 text-center bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-bold transition-colors duration-200">
                    View all messages →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdown(!profileDropdown)}
              className="flex items-center space-x-2.5 px-3 py-2 rounded-xl bg-white hover:bg-gradient-to-br hover:from-emerald-50 hover:to-blue-50 border border-gray-200 hover:border-emerald-300 transition-all duration-300 hover:scale-105 hover:shadow-md group"
            >
              <div className="relative">
                {/* Modern Gradient Avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center ring-2 ring-white shadow-lg group-hover:ring-emerald-200 group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                {/* Online Status Indicator */}
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full animate-pulse shadow-sm"></span>
              </div>
              <span className="hidden md:block font-semibold text-gray-700 text-sm group-hover:text-emerald-600 transition-colors duration-300">
                Admin
              </span>
              <svg
                className="w-4 h-4 text-gray-500 group-hover:text-emerald-600 transition-all duration-300 group-hover:translate-y-0.5"
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
            </button>

            {profileDropdown && (
              <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-fadeIn z-50">
                {/* Gradient Profile Header */}
                <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white px-6 py-8 text-center relative overflow-hidden">
                  {/* Decorative Elements */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/30 rounded-full blur-2xl"></div>
                  </div>

                  <div className="relative">
                    {/* Modern Gradient Avatar - Large */}
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-white via-emerald-50 to-teal-100 flex items-center justify-center ring-4 ring-white/40 shadow-2xl transform transition-transform duration-300 hover:scale-105">
                      <svg
                        className="w-12 h-12 text-emerald-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>

                    <h6 className="font-bold text-lg mb-1">Admin User</h6>
                    <p className="text-sm text-white/90 mb-3">
                      admin@hospital.com
                    </p>

                    {/* Role Badge */}
                    <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <svg
                        className="w-3.5 h-3.5 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-xs font-bold text-white">
                        Administrator
                      </span>
                    </div>
                  </div>
                </div>

                {/* Logout Section */}
                <div className="p-4">
                  <button
                    onClick={handleLogout}
                    className="group relative w-full flex items-center justify-between px-5 py-4 bg-gradient-to-br from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 border-2 border-red-200 hover:border-red-300 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg overflow-hidden"
                  >
                    {/* Animated background effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/5 to-red-500/0 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>

                    <div className="relative flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-300">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                      </div>
                      <div className="text-left">
                        <div className="text-base font-bold text-red-600 group-hover:text-red-700 transition-colors duration-300">
                          Logout
                        </div>
                        <div className="text-xs text-red-500 group-hover:text-red-600 transition-colors duration-300">
                          Sign out from your account
                        </div>
                      </div>
                    </div>

                    <svg
                      className="relative w-5 h-5 text-red-500 group-hover:text-red-600 group-hover:translate-x-1 transition-all duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
