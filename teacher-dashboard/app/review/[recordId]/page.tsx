"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAllRecords, approveRecord } from "@/lib/api";
import type { ApprovedRecord, ValidationWarning } from "@/types/api";

function computeLocalWarnings(fields: ApprovedRecord["fields"]): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  if (fields.boys + fields.girls !== fields.totalEnrolledStudents) {
    warnings.push({
      field: "totalEnrolledStudents",
      message: `boys (${fields.boys}) + girls (${fields.girls}) = ${fields.boys + fields.girls}, which does not match totalEnrolledStudents (${fields.totalEnrolledStudents}).`,
      severity: "error",
    });
  }
  const catSum =
    fields.scheduledCaste +
    fields.scheduledTribes +
    fields.otherBackwardClasses +
    fields.general +
    fields.generalMinorities;
  if (catSum !== fields.totalEnrolledStudents) {
    warnings.push({
      field: "categories",
      message: `Social-category fields sum to ${catSum}, which does not match totalEnrolledStudents (${fields.totalEnrolledStudents}).`,
      severity: "warning",
    });
  }
  return warnings;
}

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const recordId = params.recordId as string;

  const [record, setRecord] = useState<ApprovedRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approving, setApproving] = useState(false);

  const fetchRecord = useCallback(() => {
    getAllRecords()
      .then((res) => {
        const found = res.records.find((r) => r.id === recordId);
        if (found) {
          setRecord(found);
        } else {
          setError(`Record "${recordId}" not found.`);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load record");
        setLoading(false);
      });
  }, [recordId]);

  useEffect(() => {
    fetchRecord();
  }, [fetchRecord]);

  async function handleApprove() {
    if (!record) return;
    setApproving(true);
    try {
      await approveRecord(record.id);
      const res = await getAllRecords();
      const found = res.records.find((r) => r.id === recordId);
      if (found) setRecord(found);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setApproving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="flex items-center justify-center py-20">
          <svg className="h-6 w-6 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="ml-3 text-sm text-muted">Loading record...</span>
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-xl border border-error/20 bg-error-light p-6 text-center">
          <p className="text-sm font-medium text-error">{error || "Record not found"}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const warnings = computeLocalWarnings(record.fields);

  const sections = [
    {
      title: "Enrollment Overview",
      items: [
        { label: "Number of Sections", value: record.fields.numberOfSections },
        { label: "Authorised Capacity", value: record.fields.authorisedCapacity ?? "N/A" },
        { label: "Total Enrolled Students", value: record.fields.totalEnrolledStudents },
        { label: "Boys", value: record.fields.boys },
        { label: "Girls", value: record.fields.girls },
      ],
    },
    {
      title: "Social Categories",
      items: [
        { label: "Scheduled Caste (SC)", value: record.fields.scheduledCaste },
        { label: "Scheduled Tribes (ST)", value: record.fields.scheduledTribes },
        { label: "Other Backward Classes (OBC)", value: record.fields.otherBackwardClasses },
        { label: "General", value: record.fields.general },
        { label: "General Minorities", value: record.fields.generalMinorities },
      ],
    },
    {
      title: "Other",
      items: [
        { label: "Physically Handicapped (PH)", value: record.fields.ph },
        { label: "Last Updated", value: record.fields.lastUpdated ?? "N/A" },
        { label: "Source Class", value: record.sourceClass },
        { label: "Section", value: record.section ?? "N/A" },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <button
        onClick={() => router.push("/dashboard")}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{record.displayName}</h1>
          <p className="mt-1 text-sm text-muted">
            Detailed enrollment breakdown for this class
          </p>
        </div>
        <div className="flex items-center gap-3">
          {record.approved ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-light px-3 py-1 text-sm font-medium text-success">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Approved
            </span>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-light px-3 py-1 text-sm font-medium text-warning">
                <span className="h-2 w-2 rounded-full bg-warning" />
                Needs Review
              </span>
              <button
                onClick={handleApprove}
                disabled={approving}
                className="inline-flex items-center gap-1.5 rounded-full bg-success px-3 py-1 text-sm font-medium text-white hover:bg-success/90 transition-colors disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {approving ? "Approving..." : "Approve"}
              </button>
            </>
          )}
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="mb-6 space-y-2">
          {warnings.map((w, i) => (
            <div
              key={i}
              className={`rounded-lg border px-4 py-3 ${
                w.severity === "error"
                  ? "border-error/20 bg-error-light"
                  : "border-warning/20 bg-warning-light"
              }`}
            >
              <p className={`text-sm font-medium ${w.severity === "error" ? "text-error" : "text-warning"}`}>
                {w.severity === "error" ? "Error" : "Warning"}: {w.field}
              </p>
              <p className={`text-xs mt-0.5 ${w.severity === "error" ? "text-error/80" : "text-warning/80"}`}>
                {w.message}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="border-b border-border bg-muted/10 px-5 py-3">
              <h2 className="text-sm font-semibold text-foreground">{section.title}</h2>
            </div>
            <div className="divide-y divide-border">
              {section.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm text-muted">{item.label}</span>
                  <span className="text-sm font-semibold text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Chrome Extension Compatibility
        </h2>
        <p className="text-xs text-muted mb-3">
          {record.approved
            ? "This record is available at "
            : "Approve this record to make it available at "}
          <code className="rounded bg-muted/20 px-1.5 py-0.5 font-mono text-xs">
            GET /api/approved/default
          </code>
          {" "}for the KVS Copilot Chrome extension to autofill the admin website.
        </p>
        <div className="rounded-lg bg-muted/5 border border-border p-3">
          <pre className="text-xs text-muted overflow-x-auto">
            {JSON.stringify(
              {
                id: record.id,
                displayName: record.displayName,
                approved: record.approved,
                fields: record.fields,
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
