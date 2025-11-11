import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useDispatch, useSelector } from "react-redux";
import { authUserSelector, setUserData } from "../../redux/slice/user-slice";
import type { AppDispatch, IAuth } from "../../redux/type";
import { serverAPI } from "../../api";

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [sidebarMinimized, setSidebarMinimized] = useState<boolean>(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(
    window.innerWidth >= 1024
  );
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(authUserSelector);

  console.log(user);

  useEffect(() => {
    const userDataString = localStorage.getItem("hm-user-auth");
    if (userDataString) {
      const userData: IAuth = JSON.parse(userDataString);
      serverAPI.setToken(userData.accessToken);
      dispatch(setUserData(userData));
    }
  }, []);
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
      // Auto-close mobile sidebar on resize to desktop
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebarMinimize = () => {
    setSidebarMinimized(!sidebarMinimized);
  };

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ backgroundColor: "#f0f1f6" }}
    >
      <Navbar
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        toggleMinimize={toggleSidebarMinimize}
        isMinimized={sidebarMinimized}
      />
      <div className="flex overflow-x-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          closeSidebar={() => setSidebarOpen(false)}
          isMinimized={sidebarMinimized}
        />
        <main
          className="flex-1 p-3 sm:p-4 md:p-6 mt-16 transition-all duration-300 overflow-x-hidden w-full"
          style={{
            marginLeft: isDesktop ? (sidebarMinimized ? "70px" : "258px") : "0",
            maxWidth: isDesktop
              ? `calc(100vw - ${sidebarMinimized ? "70px" : "258px"})`
              : "100vw",
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
