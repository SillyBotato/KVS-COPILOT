"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getAllRecords, approveRecord } from "@/lib/api";
import type { ApprovedRecord } from "@/types/api";

export default function DashboardPage() {
  const router = useRouter();
  const [records, setRecords] = useState<ApprovedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const fetchRecords = useCallback(() => {
    getAllRecords()
      .then((res) => {
        setRecords(res.records);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load records");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  async function handleApprove(recordId: string) {
    setApprovingId(recordId);
    try {
      await approveRecord(recordId);
      const res = await getAllRecords();
      setRecords(res.records);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setApprovingId(null);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex items-center justify-center py-20">
          <svg className="h-6 w-6 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="ml-3 text-sm text-muted">Loading records...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="rounded-xl border border-error/20 bg-error-light p-6 text-center">
          <p className="text-sm font-medium text-error">{error}</p>
          <button
            onClick={() => { setError(""); fetchRecords(); }}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="rounded-xl border border-border bg-card p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light">
            <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-foreground">No records yet</h2>
          <p className="mt-2 text-sm text-muted">
            Upload an enrollment Excel file to generate class records.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            Upload file
          </button>
        </div>
      </div>
    );
  }

  const approvedCount = records.filter((r) => r.approved).length;
  const pendingCount = records.length - approvedCount;
  const totalStudents = records.reduce((sum, r) => sum + r.fields.totalEnrolledStudents, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Class Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            {records.length} class record{records.length !== 1 ? "s" : ""} loaded.
            {approvedCount} approved, {pendingCount} pending.
          </p>
        </div>
        <a
          href="https://kvs-copilot-demo-5q9e.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-lg bg-success px-4 py-2 text-sm font-medium text-white hover:bg-success/90 transition-colors"
        >
          Open Portal
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted uppercase tracking-wide">Total Students</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{totalStudents}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted uppercase tracking-wide">Total Classes</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{records.length}</p>
        </div>
        <div className="rounded-xl border border-success/20 bg-success-light p-4 shadow-sm">
          <p className="text-xs font-medium text-success uppercase tracking-wide">Approved</p>
          <p className="mt-1 text-2xl font-bold text-success">{approvedCount}</p>
        </div>
        <div className="rounded-xl border border-warning/20 bg-warning-light p-4 shadow-sm">
          <p className="text-xs font-medium text-warning uppercase tracking-wide">Needs Review</p>
          <p className="mt-1 text-2xl font-bold text-warning">{pendingCount}</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-foreground mb-4">All Classes</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {records.map((record) => (
          <div
            key={record.id}
            className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => router.push(`/review/${record.id}`)}
                className="text-base font-semibold text-foreground hover:text-primary transition-colors text-left"
              >
                {record.displayName}
              </button>
              {record.approved ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-success-light px-2 py-0.5 text-xs font-medium text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Approved
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning-light px-2 py-0.5 text-xs font-medium text-warning">
                  <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                  Needs Review
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-muted">Students</p>
                <p className="text-sm font-semibold text-foreground">{record.fields.totalEnrolledStudents}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Boys</p>
                <p className="text-sm font-semibold text-foreground">{record.fields.boys}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Girls</p>
                <p className="text-sm font-semibold text-foreground">{record.fields.girls}</p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between text-xs text-muted mb-3">
                <span>
                  SC: {record.fields.scheduledCaste} | ST: {record.fields.scheduledTribes} | OBC: {record.fields.otherBackwardClasses}
                </span>
              </div>
              {!record.approved && (
                <button
                  onClick={() => handleApprove(record.id)}
                  disabled={approvingId === record.id}
                  className="w-full rounded-lg bg-success px-3 py-1.5 text-xs font-medium text-white hover:bg-success/90 transition-colors disabled:opacity-50"
                >
                  {approvingId === record.id ? "Approving..." : "Approve"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
