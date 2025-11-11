import type { InvestigationHistoryEntry } from "../../../pages/DoctorPP";

export const InvestigationHistorySection = ({
  investigationHistory,
}: {
  investigationHistory: InvestigationHistoryEntry[];
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mt-4">
      <h3 className="text-base font-bold text-gray-800 mb-2 flex items-center gap-2">
        <svg
          className="w-5 h-5 text-blue-500"
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
        Investigation History
      </h3>
      <div className="space-y-4">
        {investigationHistory.map((entry) => (
          <div key={entry.date}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-gray-700 bg-gray-100 border border-gray-300 rounded px-2 py-0.5 flex items-center gap-1">
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {entry.date}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {entry.tests.map((test, idx) => {
                const displayValue =
                  test.value ?? test.result ?? "Not recorded";
                const displayReferenceRange =
                  test.referenceRange ?? "Not provided";
                const displayComment = test.comment ?? "No comment recorded";

                return (
                  <div
                    key={test.name + idx}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-gray-800 text-sm">
                        {test.name}
                      </span>
                      <span className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">
                        Test #{idx + 1}
                      </span>
                    </div>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="bg-white border border-emerald-100 rounded-md px-3 py-2 shadow-sm">
                        <dt className="text-[11px] font-semibold text-emerald-700">
                          Value
                        </dt>
                        <dd className="text-sm font-bold text-emerald-900">
                          {displayValue}
                        </dd>
                      </div>
                      <div className="bg-white border border-blue-100 rounded-md px-3 py-2 shadow-sm">
                        <dt className="text-[11px] font-semibold text-blue-700">
                          Reference Range
                        </dt>
                        <dd className="text-sm font-bold text-blue-900">
                          {displayReferenceRange}
                        </dd>
                      </div>
                    </dl>
                    <div className="text-xs text-gray-500 italic pl-1">
                      Comment: {displayComment}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
