import type { IInvestigationHistoryRes } from "../api/dto/res/res.types";

export interface AgeBreakdown {
  years: number;
  months: number;
  days: number;
  text: string;
  isFuture: boolean;
}

export type GroupedTests = Record<string, IInvestigationHistoryRes[]>;

export interface IGroupTestsByDateOut {
  date: string;
  tests: IInvestigationHistoryRes[];
}
