// Common UI and utility types

export interface ISelectorList {
  id?: number;
  value: string;
  title: string;
}

export interface ToastNotification {
  id: number;
  title: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

export interface StatItem {
  title: string;
  value: string;
  icon: string;
  color: string;
  change: string;
  changeType: string;
}

export interface ComingSoonProps {
  title: string;
}

// Button & UI types
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "info";
export type ButtonSize = "sm" | "default" | "lg";
export type GradientType =
  | "primary"
  | "secondary"
  | "success"
  | "info"
  | "warning"
  | "danger"
  | "light"
  | "dark";
