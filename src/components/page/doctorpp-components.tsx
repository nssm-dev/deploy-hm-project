import { ChartBarIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { STR_SEPARATOR } from "../../utils/CONST";
import type { ISelectedTest } from "../../api/dto/res/res.types";
import type { Dispatch, SetStateAction } from "react";
import type { TSaveTestEntryDataFun } from "./types";

export const TestDataEntrySection = ({
  prescribedTests,
  setPrescribedTests,
}: {
  prescribedTests: ISelectedTest[];
  setPrescribedTests: Dispatch<SetStateAction<ISelectedTest[]>>;
}) => {
  const onSave: TSaveTestEntryDataFun = (
    index: number,
    fields: string[],
    values: { [index: string]: string },
    refs: { [index: string]: string },
    comment: string
  ) => {
    const setValue =
      fields
        ?.map((f) => {
          return values[f] || "_";
        })
        .join(STR_SEPARATOR) || "";
    const setRef =
      fields
        ?.map((f) => {
          return refs[f] || "_";
        })
        .join(STR_SEPARATOR) || "";

    setPrescribedTests((p) => {
      const temp = [...p];
      temp.forEach((t, i) => {
        if (i == index) {
          temp[i] = {
            ...t,
            values: setValue || "",
            refRange: setRef || "",
            comment,
          };
        }
      });
      return temp;
    });
    console.log("set value: ", setValue);
    console.log("set ref: ", setRef);
  };

  return (
    <div className="relative bg-gradient-to-br from-white via-purple-50 to-white border-2 border-purple-200 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-transparent rounded-2xl pointer-events-none"></div>

      <div className="mb-3 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md"
              style={{
                background: "linear-gradient(135deg, #a855f7 0%, #9333ea 100%)",
              }}
            >
              <span
                className="text-white text-sm font-bold"
                style={{ textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}
              >
                2
              </span>
            </div>
            <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5 text-purple-600" />
              Test Results Entry
            </h4>
          </div>
        </div>
      </div>

      {/* Test Results Cards - Compact Layout */}
      <div className="space-y-2 relative z-10">
        {prescribedTests.map((test, testIdx) => (
          <TestUnit
            test={test}
            key={testIdx}
            testIdx={testIdx}
            onSave={onSave}
          />
        ))}
      </div>

      {/* Action Buttons - Compact */}
      <div className="mt-2 flex gap-2">
        <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5">
          <SaveBtnSvg />
          Save Results
        </button>
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5">
          <PrintBtnSvg />
          Print
        </button>
        <button className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5">
          <ClearBtnSvg />
          Clear
        </button>
      </div>
    </div>
  );
};

const TestUnit = ({
  test,
  testIdx,
  onSave,
}: {
  test: ISelectedTest;
  testIdx: number;
  onSave: TSaveTestEntryDataFun;
}) => {
  const [fields, setFields] = useState<string[]>([]);
  const [values, setValues] = useState<{ [index: string]: string }>({});
  const [refs, setRefs] = useState<{ [index: string]: string }>({});
  const [comment, setComment] = useState<string>("");

  useEffect(() => {
    if (test.fields) {
      const getFields = test.fields.split(STR_SEPARATOR);
      setFields(getFields);
      const val_ref_set: { [index: string]: string } = {};
      getFields.forEach((f) => {
        val_ref_set[f] = "";
      });
      setValues(val_ref_set);
      setRefs(val_ref_set);
    }
  }, [test?.fields]);

  return (
    <div
      key={testIdx}
      className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Test Header - Compact */}
      <div className="px-4 py-2.5 bg-gray-100 border-b border-gray-300">
        <div className="flex items-center justify-between">
          <h5 className="text-sm font-bold text-gray-900 flex items-center gap-0">
            {test.labTestName}
          </h5>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-white border border-gray-300 rounded text-xs text-gray-600 font-medium flex items-center gap-1">
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Prescribed:{" "}
              {test.createdOn ? `${test.createdOn}`.split("T")[0] : ""}
            </span>
            <span className="px-2.5 py-1 bg-white border border-gray-300 rounded text-xs text-gray-700 font-medium">
              {fields.length} parameters
            </span>
          </div>
        </div>
      </div>

      <div className="p-3">
        {/* Current Entry Fields - Compact Inline */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-5 h-5 rounded flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              }}
            >
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{
                  filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
                }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </div>
            <p className="text-xs font-bold text-gray-800">Current Values:</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {fields?.map((field, fieldIdx) => (
              <div key={fieldIdx} className="space-y-1">
                <label className="text-xs text-gray-700 font-semibold block">
                  {field}
                </label>
                <input
                  type="text"
                  value={values[field]}
                  onChange={(e) => {
                    setValues((p) => ({ ...p, [field]: e.target.value }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key == "Enter") {
                      onSave(testIdx, fields, values, refs, comment);
                    }
                  }}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder="Enter value"
                />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-emerald-700 font-semibold flex-shrink-0">
                    Ref:
                  </span>
                  <input
                    type="text"
                    className="flex-1 px-2.5 py-1.5 border border-emerald-300 bg-emerald-50 rounded-md text-xs font-medium text-emerald-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                    placeholder="enter ref"
                    value={refs[field]}
                    onChange={(e) => {
                      setRefs((p) => ({ ...p, [field]: e.target.value }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key == "Enter") {
                        onSave(testIdx, fields, values, refs, comment);
                      }
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comment Field - One per Test */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="w-4 h-4 text-blue-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                clipRule="evenodd"
              />
            </svg>
            <label className="text-xs font-bold text-gray-800">
              Test Comment / Clinical Notes:
            </label>
          </div>
          <textarea
            className="w-full px-3 py-2.5 border-2 border-blue-300 bg-blue-50 rounded-lg text-sm font-medium text-blue-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none shadow-sm"
            placeholder="Add overall observations or notes for this test..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            onKeyDown={(e) => {
              if (e.key == "Enter") {
                onSave(testIdx, fields, values, refs, comment);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

const SaveBtnSvg = () => (
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
      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
    />
  </svg>
);

const PrintBtnSvg = () => (
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
      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
    />
  </svg>
);

const ClearBtnSvg = () => (
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
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);
