import type { IInvestigationHistoryRes } from "../api/dto/res/res.types";
import type { GroupedTests, IGroupTestsByDateOut } from "./types";

export const groupTestsByDate = (
  investigationHistory: IInvestigationHistoryRes[]
): IGroupTestsByDateOut[] => {
  // Step 1: Group items by date
  const grouped = investigationHistory.reduce<GroupedTests>((acc, item) => {
    const date = item.createdOn.split("T")[0] || "";
    (acc[date] ||= []).push(item);
    return acc;
  }, {});

  // Step 2: Sort by date descending
  const sortedEntries = Object.entries(grouped).sort(
    ([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime()
  );

  // Step 3: Convert back to object
  const finalObj = Object.fromEntries(sortedEntries);

  //   Step 4: Convert to Array

  return Object.keys(finalObj).map((key) => {
    return {
      date: key,
      tests: finalObj[key] || [],
    };
  });
};
