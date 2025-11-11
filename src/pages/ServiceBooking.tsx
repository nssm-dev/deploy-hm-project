const ServiceBooking = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-[calc(100vh-64px)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Service Booking</h1>
        <p className="mt-2 text-gray-500">Book and manage hospital services</p>
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
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="text-lg font-medium mb-2 text-gray-900">
            Service Booking Module
          </h3>
          <p className="text-gray-500">This feature is coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default ServiceBooking;
