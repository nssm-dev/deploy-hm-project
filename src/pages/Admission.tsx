const Admission = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-[calc(100vh-64px)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admission</h1>
        <p className="mt-2 text-gray-500">Patient admission management</p>
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
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <h3 className="text-lg font-medium mb-2 text-gray-900">
            Admission Module
          </h3>
          <p className="text-gray-500">This feature is coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default Admission;
