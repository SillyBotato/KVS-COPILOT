"use client";

import type React from "react";
import type { ProcessingStatus as Status, ValidationWarning } from "@/types/api";

interface ProcessingStatusProps {
  status: Status;
  message?: string;
  recordCount?: number;
  warnings?: ValidationWarning[];
}

export default function ProcessingStatus({
  status,
  message,
  recordCount,
  warnings,
}: ProcessingStatusProps) {
  if (status === "idle") return null;

  const statusConfig: Record<
    Status,
    { label: string; color: string; bg: string; icon: React.ReactNode }
  > = {
    idle: { label: "", color: "", bg: "", icon: null },
    uploading: {
      label: "Uploading file...",
      color: "text-primary",
      bg: "bg-primary-light",
      icon: (
        <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ),
    },
    processing: {
      label: "Processing Excel data...",
      color: "text-primary",
      bg: "bg-primary-light",
      icon: (
        <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ),
    },
    computing: {
      label: "Computing class records...",
      color: "text-primary",
      bg: "bg-primary-light",
      icon: (
        <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ),
    },
    complete: {
      label: "Processing complete",
      color: "text-success",
      bg: "bg-success-light",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    error: {
      label: "Error",
      color: "text-error",
      bg: "bg-error-light",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  };

  const config = statusConfig[status];

  return (
    <div className="mt-6 space-y-3">
      <div
        className={`flex items-center gap-3 rounded-lg ${config.bg} px-4 py-3`}
      >
        <span className={config.color}>{config.icon}</span>
        <span className={`text-sm font-medium ${config.color}`}>
          {config.label}
        </span>
      </div>

      {message && (
        <p className="text-sm text-muted pl-1">{message}</p>
      )}

      {status === "complete" && recordCount !== undefined && (
        <div className="rounded-lg bg-success-light border border-success/20 px-4 py-3">
          <p className="text-sm font-medium text-success">
            {recordCount} record{recordCount !== 1 ? "s" : ""} computed successfully
          </p>
        </div>
      )}

      {warnings && warnings.length > 0 && (
        <div className="rounded-lg bg-warning-light border border-warning/20 px-4 py-3">
          <p className="text-sm font-medium text-warning mb-1">
            {warnings.length} warning{warnings.length !== 1 ? "s" : ""} found
          </p>
          <ul className="space-y-1">
            {warnings.map((w, i) => (
              <li key={i} className="text-xs text-warning/80">
                <span className="font-medium">{w.field}:</span> {w.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
