const Dashboard = () => {
  return (
    <div
      style={{
        padding: "1.5rem",
        background:
          "linear-gradient(to bottom right, #f8fafc, #dbeafe, #e0e7ff)",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            color: "#0f172a",
            marginBottom: "0.5rem",
          }}
        >
          Dashboard
        </h1>
        <p style={{ color: "#64748b" }}>
          Welcome to NS Hospital Management System
        </p>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        {/* Stat 1 - Cyan/Blue */}
        <div
          style={{
            background: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
            padding: "1.5rem",
            borderRadius: "1rem",
            boxShadow: "0 10px 25px rgba(6, 182, 212, 0.3)",
            color: "white",
          }}
        >
          <p
            style={{
              fontSize: "0.75rem",
              opacity: 0.9,
              fontWeight: "bold",
              textTransform: "uppercase",
              marginBottom: "0.5rem",
            }}
          >
            TOTAL PATIENTS
          </p>
          <h3 style={{ fontSize: "2.5rem", fontWeight: "900" }}>1,234</h3>
          <span
            style={{
              fontSize: "0.875rem",
              backgroundColor: "rgba(255,255,255,0.2)",
              padding: "0.25rem 0.5rem",
              borderRadius: "0.5rem",
              fontWeight: "600",
            }}
          >
            +12%
          </span>
        </div>

        {/* Stat 2 - Violet/Purple */}
        <div
          style={{
            background: "linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)",
            padding: "1.5rem",
            borderRadius: "1rem",
            boxShadow: "0 10px 25px rgba(139, 92, 246, 0.3)",
            color: "white",
          }}
        >
          <p
            style={{
              fontSize: "0.75rem",
              opacity: 0.9,
              fontWeight: "bold",
              textTransform: "uppercase",
              marginBottom: "0.5rem",
            }}
          >
            APPOINTMENTS TODAY
          </p>
          <h3 style={{ fontSize: "2.5rem", fontWeight: "900" }}>45</h3>
          <span
            style={{
              fontSize: "0.875rem",
              backgroundColor: "rgba(255,255,255,0.2)",
              padding: "0.25rem 0.5rem",
              borderRadius: "0.5rem",
              fontWeight: "600",
            }}
          >
            +8%
          </span>
        </div>

        {/* Stat 3 - Orange/Yellow */}
        <div
          style={{
            background: "linear-gradient(135deg, #f97316 0%, #eab308 100%)",
            padding: "1.5rem",
            borderRadius: "1rem",
            boxShadow: "0 10px 25px rgba(249, 115, 22, 0.3)",
            color: "white",
          }}
        >
          <p
            style={{
              fontSize: "0.75rem",
              opacity: 0.9,
              fontWeight: "bold",
              textTransform: "uppercase",
              marginBottom: "0.5rem",
            }}
          >
            DOCTORS AVAILABLE
          </p>
          <h3 style={{ fontSize: "2.5rem", fontWeight: "900" }}>24</h3>
          <span
            style={{
              fontSize: "0.875rem",
              backgroundColor: "rgba(255,255,255,0.2)",
              padding: "0.25rem 0.5rem",
              borderRadius: "0.5rem",
              fontWeight: "600",
            }}
          >
            +5%
          </span>
        </div>

        {/* Stat 4 - Pink/Red */}
        <div
          style={{
            background: "linear-gradient(135deg, #ec4899 0%, #ef4444 100%)",
            padding: "1.5rem",
            borderRadius: "1rem",
            boxShadow: "0 10px 25px rgba(236, 72, 153, 0.3)",
            color: "white",
          }}
        >
          <p
            style={{
              fontSize: "0.75rem",
              opacity: 0.9,
              fontWeight: "bold",
              textTransform: "uppercase",
              marginBottom: "0.5rem",
            }}
          >
            REVENUE TODAY
          </p>
          <h3 style={{ fontSize: "2.5rem", fontWeight: "900" }}>$12,543</h3>
          <span
            style={{
              fontSize: "0.875rem",
              backgroundColor: "rgba(255,255,255,0.2)",
              padding: "0.25rem 0.5rem",
              borderRadius: "0.5rem",
              fontWeight: "600",
            }}
          >
            +15%
          </span>
        </div>
      </div>

      {/* Recent Activities */}
      <div
        style={{
          background: "white",
          padding: "1.5rem",
          borderRadius: "1rem",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}
      >
        <h3
          style={{
            fontSize: "1.25rem",
            fontWeight: "bold",
            color: "#0f172a",
            marginBottom: "1rem",
          }}
        >
          Recent Appointments
        </h3>

        <div
          style={{
            marginBottom: "1rem",
            padding: "1rem",
            background: "linear-gradient(to right, #f8fafc, white)",
            borderRadius: "0.5rem",
          }}
        >
          <p
            style={{
              fontWeight: "600",
              color: "#0f172a",
              marginBottom: "0.25rem",
            }}
          >
            John Doe
          </p>
          <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
            Cardiology • 10:00 AM
          </p>
        </div>

        <div
          style={{
            marginBottom: "1rem",
            padding: "1rem",
            background: "linear-gradient(to right, #f8fafc, white)",
            borderRadius: "0.5rem",
          }}
        >
          <p
            style={{
              fontWeight: "600",
              color: "#0f172a",
              marginBottom: "0.25rem",
            }}
          >
            Jane Smith
          </p>
          <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
            Pediatrics • 11:30 AM
          </p>
        </div>

        <div
          style={{
            padding: "1rem",
            background: "linear-gradient(to right, #f8fafc, white)",
            borderRadius: "0.5rem",
          }}
        >
          <p
            style={{
              fontWeight: "600",
              color: "#0f172a",
              marginBottom: "0.25rem",
            }}
          >
            Mike Brown
          </p>
          <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
            Orthopedics • 2:00 PM
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
