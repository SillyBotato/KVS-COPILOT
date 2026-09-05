"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { uploadExcel } from "@/lib/api";
import type { ProcessingStatus as Status } from "@/types/api";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [recordCount, setRecordCount] = useState(0);

  async function handleUpload() {
    if (!file) return;

    setStatus("uploading");
    setMessage("Uploading and processing file...");

    try {
      const result = await uploadExcel(file);
      const count = result.prepared.recordCount;

      if (count === 0) {
        setStatus("error");
        setMessage("No class records found in the uploaded file.");
        return;
      }

      setRecordCount(count);
      setStatus("complete");
      setMessage(
        `Processed ${count} class record${count !== 1 ? "s" : ""}. Redirecting to dashboard...`
      );

      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Upload failed");
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Teacher / Admin Dashboard
        </h1>
        <p className="mt-2 text-sm text-muted">
          Upload your KVS enrollment Excel file to begin the review and approval
          workflow.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Upload Enrollment Data
        </h2>

        <FileUpload
          onFileSelect={setFile}
          onUpload={handleUpload}
          selectedFile={file}
          disabled={status === "uploading"}
        />

        <ProcessingStatus
          status={status}
          message={message}
          recordCount={recordCount}
        />
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-3">
          How it works
        </h2>
        <ol className="space-y-3 text-sm text-muted">
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
              1
            </span>
            <span>Upload your KVS enrollment Excel file (.xlsx, .xls, or .csv)</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
              2
            </span>
            <span>Backend processes all class records automatically</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
              3
            </span>
            <span>Review each class and click Approve when ready</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
              4
            </span>
            <span>Approved records are available for the Chrome extension</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
