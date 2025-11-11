// Central export point for all types

// Re-export all types from individual files
export * from "./appointment.types";
export * from "./patient.types";
export * from "./doctor.types";
export * from "./master.types";
export * from "./common.types";
export * from "./auth.types";
export * from "./component.types";

// API related types
export type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE";
