import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import type {
  SidebarProps,
  MenuItemProps,
  SubmenuItemProps,
  CollapsibleMenuProps,
} from "../../types";

const Sidebar = ({ isOpen, closeSidebar, isMinimized }: SidebarProps) => {
  const location = useLocation();
  const [frontDeskOpen, setFrontDeskOpen] = useState<boolean>(false);
  const [masterFilesOpen, setMasterFilesOpen] = useState<boolean>(false);

  const isActive = (path: string): boolean => {
    return location.pathname === path;
  };

  useEffect(() => {
    const frontDeskRoutes = [
      "/channel",
      "/admission",
      "/cashier",
      "/service-booking",
      "/doctor-pp",
    ];
    const masterFileRoutes = ["/professional-master", "/speciality-master"];

    if (frontDeskRoutes.includes(location.pathname)) {
      setFrontDeskOpen(true);
    }

    if (masterFileRoutes.includes(location.pathname)) {
      setMasterFilesOpen(true);
    }
  }, [location.pathname]);

  // Reusable menu item component with HTML exact colors
  function MenuItem({ to, icon, label }: MenuItemProps) {
    const active = isActive(to);
    const [isHovered, setIsHovered] = useState<boolean>(false);
    const [showPopup, setShowPopup] = useState<boolean>(false);
    const [popupPosition, setPopupPosition] = useState<{ top: number }>({
      top: 0,
    });
    const menuRef = useRef<HTMLAnchorElement>(null);

    const handleMouseEnter = () => {
      setIsHovered(true);
      if (isMinimized && menuRef.current) {
        const rect = menuRef.current.getBoundingClientRect();
        setPopupPosition({ top: rect.top });
        setShowPopup(true);
      }
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      setShowPopup(false);
    };

    return (
      <>
        <Link
          ref={menuRef}
          to={to}
          onClick={closeSidebar}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: isMinimized ? "center" : "flex-start",
            padding: isMinimized ? "0.625rem 1rem" : "0.5rem 1rem",
            fontSize: "0.875rem",
            fontFamily: "Ubuntu, sans-serif",
            color: active ? "#44ce42" : isHovered ? "#ffffff" : "#8e94a9",
            backgroundColor: active
              ? "transparent"
              : isHovered
              ? "#151520"
              : "transparent",
            textDecoration: "none",
            transition: "all 0.2s ease",
            borderRadius: "6px",
            margin: "1px 0",
            position: "relative",
          }}
          title={isMinimized ? label : ""}
        >
          <span
            style={{
              fontSize: "1rem",
              minWidth: "18px",
              marginRight: isMinimized ? "0" : "10px",
              color: "#44ce42", // Always green icon
            }}
          >
            {icon}
          </span>
          {!isMinimized && (
            <span style={{ fontWeight: active ? "600" : "400" }}>{label}</span>
          )}
        </Link>

        {/* Popup on Hover - When minimized */}
        {isMinimized && showPopup && (
          <div
            onMouseEnter={() => setShowPopup(true)}
            onMouseLeave={() => setShowPopup(false)}
            style={{
              position: "fixed",
              left: "70px",
              top: `${popupPosition.top}px`,
              backgroundColor: "#151520",
              borderRadius: "0 6px 6px 0",
              boxShadow: "0 3px 10px rgba(0,0,0,0.4)",
              padding: "8px 16px",
              minWidth: "140px",
              zIndex: 9999,
              fontSize: "0.825rem",
              color: "#ffffff",
              fontFamily: "Ubuntu, sans-serif",
              whiteSpace: "nowrap",
              pointerEvents: "auto",
            }}
          >
            {label}
          </div>
        )}
      </>
    );
  }

  // Collapsible menu component with HTML exact colors and hover popup
  function CollapsibleMenu({
    icon,
    label,
    isOpen,
    setIsOpen,
    children,
    submenuItems,
  }: CollapsibleMenuProps) {
    const [isHovered, setIsHovered] = useState<boolean>(false);
    const [showPopup, setShowPopup] = useState<boolean>(false);
    const [popupPosition, setPopupPosition] = useState<{
      top: number;
      left: number;
    }>({ top: 0, left: 0 });
    const menuRef = useRef<HTMLLIElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLUListElement>(null);
    const closeTimeoutRef = useRef<number | null>(null);
    const [contentHeight, setContentHeight] = useState<number>(0);
    const hasActiveChild = submenuItems?.some((item) => isActive(item.to));

    const closePopup = () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      setIsHovered(false);
      setShowPopup(false);
    };

    const openPopup = () => {
      if (!isMinimized || !menuRef.current) {
        return;
      }

      const rect = menuRef.current.getBoundingClientRect();
      setIsHovered(true);
      setPopupPosition({ top: rect.top, left: rect.right });
      setShowPopup(true);
    };

    // Update popup position based on menu item position
    const handleMouseEnter = () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      setIsHovered(true);
      openPopup();
    };

    const handleMouseLeave = (event: React.MouseEvent<HTMLElement>) => {
      if (!isMinimized) {
        setIsHovered(false);
        setShowPopup(false);
        return;
      }

      const nextTarget = event.relatedTarget as HTMLElement | null;
      if (nextTarget) {
        if (
          menuRef.current?.contains(nextTarget) ||
          popupRef.current?.contains(nextTarget)
        ) {
          return;
        }
      }

      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
      closeTimeoutRef.current = window.setTimeout(() => {
        closePopup();
      }, 220);
    };

    const togglePopup = () => {
      if (!isMinimized) {
        return;
      }

      if (showPopup) {
        closePopup();
      } else {
        openPopup();
      }
    };

    const handleKeyboardToggle = (
      event: React.KeyboardEvent<HTMLButtonElement>
    ) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        togglePopup();
      }

      if (event.key === "Escape" && showPopup) {
        event.preventDefault();
        closePopup();
      }
    };

    const handleButtonBlur = (event: React.FocusEvent<HTMLButtonElement>) => {
      if (!isMinimized) {
        return;
      }

      const nextTarget = event.relatedTarget as HTMLElement | null;
      if (nextTarget && menuRef.current?.contains(nextTarget)) {
        return;
      }

      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
      closeTimeoutRef.current = window.setTimeout(() => {
        closePopup();
      }, 80);
    };

    const handlePopupBlur = (event: React.FocusEvent<HTMLDivElement>) => {
      const nextTarget = event.relatedTarget as HTMLElement | null;
      if (nextTarget) {
        if (
          menuRef.current?.contains(nextTarget) ||
          popupRef.current?.contains(nextTarget)
        ) {
          return;
        }
      }

      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
      closeTimeoutRef.current = window.setTimeout(() => {
        closePopup();
      }, 160);
    };

    const handlePopupMouseMove = () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    };

    const handlePopupMouseLeave = (event: React.MouseEvent<HTMLDivElement>) => {
      if (!isMinimized) {
        closePopup();
        return;
      }

      const nextTarget = event.relatedTarget as HTMLElement | null;
      if (
        nextTarget &&
        (menuRef.current?.contains(nextTarget) ||
          popupRef.current?.contains(nextTarget))
      ) {
        return;
      }

      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
      closeTimeoutRef.current = window.setTimeout(() => {
        closePopup();
      }, 160);
    };

    useEffect(() => {
      if (isMinimized) {
        return;
      }

      if (!isOpen) {
        setContentHeight(0);
        return;
      }

      if (contentRef.current) {
        setContentHeight(contentRef.current.scrollHeight);
      }
    }, [isOpen, isMinimized, submenuItems]);

    useEffect(() => {
      if (isMinimized || !isOpen || !contentRef.current) {
        return;
      }

      if (typeof ResizeObserver === "undefined") {
        return;
      }

      const observer = new ResizeObserver(() => {
        if (contentRef.current) {
          setContentHeight(contentRef.current.scrollHeight);
        }
      });

      observer.observe(contentRef.current);

      return () => observer.disconnect();
    }, [isMinimized, isOpen, submenuItems]);

    useEffect(() => {
      return () => {
        if (closeTimeoutRef.current !== null) {
          window.clearTimeout(closeTimeoutRef.current);
        }
      };
    }, []);

    const contentId = `submenu-${label.toLowerCase().replace(/\s+/g, "-")}`;
    const measuredHeight = contentRef.current
      ? contentRef.current.scrollHeight
      : contentHeight;

    // When minimized, show as single icon with popup on hover
    if (isMinimized) {
      return (
        <li
          ref={menuRef}
          style={{ marginBottom: "1px", position: "relative" }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button
            type="button"
            role="button"
            aria-haspopup="true"
            aria-expanded={showPopup}
            onFocus={handleMouseEnter}
            onBlur={handleButtonBlur}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onKeyDown={handleKeyboardToggle}
            onClick={(event) => {
              event.preventDefault();
              togglePopup();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.625rem 1rem",
              fontSize: "0.875rem",
              fontFamily: "Ubuntu, sans-serif",
              color: hasActiveChild
                ? "#44ce42"
                : isHovered
                ? "#ffffff"
                : "#8e94a9",
              backgroundColor: hasActiveChild
                ? "rgba(68, 206, 66, 0.12)"
                : isHovered
                ? "#151520"
                : "transparent",
              borderRadius: "6px",
              border: "none",
              width: "100%",
              backgroundClip: "padding-box",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <span
              style={{ fontSize: "1rem", minWidth: "18px", color: "#44ce42" }}
            >
              {icon}
            </span>
          </button>

          {/* Popup Menu on Hover - Compact Fixed Position */}
          {showPopup && (
            <div
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handlePopupMouseLeave}
              onMouseMove={handlePopupMouseMove}
              onFocus={handleMouseEnter}
              onBlur={handlePopupBlur}
              ref={popupRef}
              style={{
                position: "fixed",
                left: `${Math.max(64, popupPosition.left - 4)}px`,
                top: `${Math.max(8, popupPosition.top)}px`,
                backgroundColor: "#151520",
                borderRadius: "0 6px 6px 0",
                boxShadow: "0 3px 10px rgba(0,0,0,0.4)",
                padding: "0",
                minWidth: "200px",
                zIndex: 9999,
                pointerEvents: "auto",
              }}
            >
              {/* Menu Title */}
              <div
                style={{
                  padding: "8px 16px",
                  fontSize: "0.8rem",
                  fontWeight: "700",
                  color: "#ffffff",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "#151520",
                  borderRadius: "0 6px 0 0",
                }}
              >
                {label}
              </div>

              {/* Submenu Items */}
              <div
                style={{
                  padding: "6px 0",
                  backgroundColor: "#151520",
                  borderRadius: "0 0 6px 0",
                }}
              >
                {submenuItems &&
                  submenuItems.map((item, index) => (
                    <Link
                      key={index}
                      to={item.to}
                      onClick={() => {
                        closePopup();
                        closeSidebar();
                      }}
                      onFocus={handleMouseEnter}
                      style={{
                        display: "block",
                        padding: "7px 16px",
                        fontSize: "0.8rem",
                        color: "#8e94a9",
                        textDecoration: "none",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#1a1a26";
                        e.currentTarget.style.color = "#ffffff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "#8e94a9";
                      }}
                    >
                      {item.label}
                    </Link>
                  ))}
              </div>
            </div>
          )}
        </li>
      );
    }

    return (
      <li style={{ marginBottom: "1px" }}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          aria-expanded={isOpen}
          aria-controls={contentId}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            fontFamily: "Ubuntu, sans-serif",
            color: hasActiveChild
              ? "#44ce42"
              : isHovered
              ? "#ffffff"
              : "#8e94a9",
            backgroundColor: hasActiveChild
              ? "rgba(68, 206, 66, 0.12)"
              : isHovered
              ? "#151520"
              : "transparent",
            border: "none",
            textAlign: "left",
            cursor: "pointer",
            transition: "all 0.25s ease",
            borderRadius: "6px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <span
              style={{
                marginRight: "10px",
                fontSize: "1rem",
                minWidth: "18px",
                color: "#44ce42",
              }}
            >
              {icon}
            </span>
            <span
              style={{
                fontWeight: hasActiveChild ? "600" : "400",
                color: hasActiveChild ? "#44ce42" : "inherit",
              }}
            >
              {label}
            </span>
          </div>
          <svg
            style={{
              width: "9px",
              height: "9px",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.25s ease",
              color: hasActiveChild ? "#44ce42" : "rgba(255,255,255,.4)",
            }}
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
        <div
          id={contentId}
          style={{
            maxHeight: isOpen ? `${Math.max(measuredHeight, 1)}px` : "0px",
            opacity: isOpen ? 1 : 0,
            overflow: "hidden",
            transition: "max-height 0.3s ease, opacity 0.2s ease",
            pointerEvents: isOpen ? "auto" : "none",
          }}
        >
          <ul
            ref={contentRef}
            style={{
              marginTop: "4px",
              marginLeft: "0",
              paddingLeft: "0",
              listStyle: "none",
              opacity: isOpen ? 1 : 0,
              transition: "opacity 0.2s ease",
            }}
          >
            {children}
          </ul>
        </div>
      </li>
    );
  }

  // Submenu item component - compact version
  function SubmenuItem({ to, label }: SubmenuItemProps) {
    const active = isActive(to);
    const [isHovered, setIsHovered] = useState<boolean>(false);

    return (
      <li>
        <Link
          to={to}
          onClick={closeSidebar}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            display: "block",
            padding: "0.5rem 1rem 0.5rem 2.5rem",
            fontSize: "0.8rem",
            fontFamily: "Ubuntu, sans-serif",
            color: active ? "#44ce42" : isHovered ? "#ffffff" : "#8e94a9",
            fontWeight: active ? 600 : 400,
            backgroundColor: "transparent",
            textDecoration: "none",
            transition: "color 0.2s ease",
          }}
        >
          {label}
        </Link>
      </li>
    );
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
        ></div>
      )}

      {/* Sidebar - HTML Exact Colors */}
      <aside
        className={`sidebar-container fixed left-0 bottom-0 shadow-lg transform transition-all duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
        style={{
          backgroundColor: "#181824",
          width: isMinimized ? "70px" : "258px",
          top: isMinimized ? "0" : "64px",
          fontFamily: "Ubuntu, sans-serif",
          zIndex: isMinimized ? 50 : 40,
          overflowY: "auto",
          overflowX: "hidden",
          scrollbarGutter: "stable",
        }}
      >
        {/* Logo Area - Shows when minimized */}
        {isMinimized && (
          <div
            className="hidden lg:flex items-center justify-center"
            style={{
              backgroundColor: "#181824",
              height: "64px",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <img
              src="/assets/images/NS-logo-mini.svg"
              alt="NS"
              className="h-8 w-8"
            />
          </div>
        )}

        {/* Close Button - Right Side (Mobile Only) */}
        {!isMinimized && (
          <button
            onClick={closeSidebar}
            className="lg:hidden absolute top-4 right-4 p-2 rounded-md hover:bg-gray-700 transition-colors z-50"
            style={{ color: "#8e94a9" }}
            title="Close Menu"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        <nav className="h-full py-2">
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: isMinimized ? "0 6px" : "0 12px",
            }}
          >
            {/* Dashboard */}
            <li>
              <MenuItem
                to="/"
                icon={
                  <svg
                    style={{ width: "18px", height: "18px" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                }
                label="Dashboard"
              />
            </li>

            {/* Operations Category - Hide when minimized */}
            {!isMinimized && (
              <li
                style={{
                  padding: "12px 12px 4px 12px",
                  fontSize: "0.7rem",
                  fontWeight: "700",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  marginTop: "8px",
                }}
              >
                Operations
              </li>
            )}

            {/* Front Desk - Collapsible Menu */}
            <CollapsibleMenu
              icon={
                <svg
                  style={{ width: "18px", height: "18px" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              }
              label="Front Desk"
              isOpen={frontDeskOpen}
              setIsOpen={setFrontDeskOpen}
              submenuItems={[
                { to: "/channel", label: "Channel" },
                { to: "/channel-quick", label: "Quick Appointment" },
                { to: "/admission", label: "Admission" },
                { to: "/cashier", label: "Cashier" },
                { to: "/service-booking", label: "Service Booking" },
                { to: "/doctor-pp", label: "Doctor PP" },
              ]}
            >
              <SubmenuItem to="/channel" label="Channel" />
              <SubmenuItem to="/channel-quick" label="Quick Appointment" />
              <SubmenuItem to="/admission" label="Admission" />
              <SubmenuItem to="/cashier" label="Cashier" />
              <SubmenuItem to="/service-booking" label="Service Booking" />
              <SubmenuItem to="/doctor-pp" label="Doctor PP" />
            </CollapsibleMenu>

            {/* Patients */}
            <li>
              <MenuItem
                to="/patients"
                icon={
                  <svg
                    style={{ width: "18px", height: "18px" }}
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
                }
                label="Patients"
              />
            </li>

            {/* Resources Category */}
            {!isMinimized && (
              <li
                style={{
                  padding: "12px 12px 4px 12px",
                  fontSize: "0.7rem",
                  fontWeight: "700",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  marginTop: "8px",
                }}
              >
                Resources
              </li>
            )}

            {/* Service */}
            <li>
              <MenuItem
                to="/service"
                icon={
                  <svg
                    style={{ width: "18px", height: "18px" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 13.255A23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                }
                label="Service"
              />
            </li>

            {/* Inventory */}
            <li>
              <MenuItem
                to="/inventory"
                icon={
                  <svg
                    style={{ width: "18px", height: "18px" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                }
                label="Inventory"
              />
            </li>

            {/* Human Resources */}
            <li>
              <MenuItem
                to="/human-resources"
                icon={
                  <svg
                    style={{ width: "18px", height: "18px" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                }
                label="Human Resources"
              />
            </li>

            {/* Finance Category */}
            {!isMinimized && (
              <li
                style={{
                  padding: "12px 12px 4px 12px",
                  fontSize: "0.7rem",
                  fontWeight: "700",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  marginTop: "8px",
                }}
              >
                Finance
              </li>
            )}

            {/* Payroll */}
            <li>
              <MenuItem
                to="/payroll"
                icon={
                  <svg
                    style={{ width: "18px", height: "18px" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
                label="Payroll"
              />
            </li>

            {/* Financial Accounts */}
            <li>
              <MenuItem
                to="/financial-accounts"
                icon={
                  <svg
                    style={{ width: "18px", height: "18px" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                }
                label="Financial Accounts"
              />
            </li>

            {/* Configuration Category */}
            {!isMinimized && (
              <li
                style={{
                  padding: "12px 12px 4px 12px",
                  fontSize: "0.7rem",
                  fontWeight: "700",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  marginTop: "8px",
                }}
              >
                Configuration
              </li>
            )}

            {/* Master Files - Collapsible Menu */}
            <CollapsibleMenu
              icon={
                <svg
                  style={{ width: "18px", height: "18px" }}
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
              }
              label="Master Files"
              isOpen={masterFilesOpen}
              setIsOpen={setMasterFilesOpen}
              submenuItems={[
                { to: "/professional-master", label: "Professional Master" },
                { to: "/speciality-master", label: "Speciality Master" },
              ]}
            >
              <SubmenuItem
                to="/professional-master"
                label="Professional Master"
              />
              <SubmenuItem to="/speciality-master" label="Speciality Master" />
            </CollapsibleMenu>

            {/* Settings */}
            <li>
              <MenuItem
                to="/settings"
                icon={
                  <svg
                    style={{ width: "18px", height: "18px" }}
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
                }
                label="Settings"
              />
            </li>

            {/* System Category */}
            {!isMinimized && (
              <li
                style={{
                  padding: "12px 12px 4px 12px",
                  fontSize: "0.7rem",
                  fontWeight: "700",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  marginTop: "8px",
                  borderTop: "1px solid rgba(151,151,151,.15)",
                  paddingTop: "16px",
                }}
              >
                System
              </li>
            )}

            {/* Noticeboard */}
            <li>
              <MenuItem
                to="/noticeboard"
                icon={
                  <svg
                    style={{ width: "18px", height: "18px" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                    />
                  </svg>
                }
                label="Noticeboard"
              />
            </li>

            {/* Logout */}
            <li style={{ marginTop: "4px", marginBottom: "16px" }}>
              <MenuItem
                to="/login"
                icon={
                  <svg
                    style={{ width: "18px", height: "18px" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                }
                label="Logout"
              />
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
