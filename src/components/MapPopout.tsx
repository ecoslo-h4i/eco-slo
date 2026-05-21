"use client";

import { Flag, X } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { AppButton, TextField, TextAreaField, appButtonClassName } from "@/components/ui/form-controls";
import Badge from "@/components/badge";

type Member = {
  id: number;
  firstname: string;
  lastname: string;
};

type Tree = {
  id: number;
  latitude: number;
  longitude: number;
  member: Member | null;
  species_name?: string | null;
  common_name: string;
  address: string;
  status: string;
  date_planted: string;
  notes: string;
  is_public: boolean;
};

type AdminMember = {
  id: number;
  role: string | null;
};

type MapPopoutProps = {
  tree: Tree | null;
  onClose: () => void;
};

function displayValue(value: string | null | undefined) {
  return value?.trim() ? value : "Not available";
}

function displayStatus(status: string) {
  return status === "Graduated" ? "Off-boarded" : status;
}

function statusBadgeVariant(status: string) {
  return status === "Active" ? "success" : "muted";
}

function InfoBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="min-h-[86px] rounded-[14px] bg-off-white px-4 py-4">
      <h3 className="mb-2 font-serif text-[15px] font-bold uppercase leading-none tracking-normal text-text">
        {label}
      </h3>
      <div className="font-mulish text-[13px] font-normal leading-snug text-text">{children}</div>
    </section>
  );
}

export default function MapPopout({ tree, onClose }: MapPopoutProps) {
  const [isReporting, setIsReporting] = useState(false);
  const [message, setMessage] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [adminAssigneeIds, setAdminAssigneeIds] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadAdmins() {
      try {
        const response = await fetch("/api/admin/members", { cache: "no-store" });
        if (!response.ok) return;
        const json = await response.json();
        const members: AdminMember[] = Array.isArray(json.message) ? json.message : [];
        if (cancelled) return;
        const adminIds = members.filter((member) => member.role === "Admin").map((member) => member.id);
        setAdminAssigneeIds(adminIds);
      } catch (error) {
        console.error("Unable to load admin members for issue report", error);
      }
    }

    void loadAdmins();
    return () => {
      cancelled = true;
    };
  }, []);

  const clearReportForm = () => {
    setMessage("");
    setReporterName("");
    setReporterPhone("");
    setReporterEmail("");
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const closeReportModal = () => {
    clearReportForm();
    setIsReporting(false);
  };

  const openReportModal = () => {
    setSubmitError(null);
    setSubmitSuccess(null);
    setIsReporting(true);
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      setSubmitError("Please enter a report message.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    const reporterDetails = [reporterName.trim(), reporterPhone.trim(), reporterEmail.trim()].filter(Boolean).join(" ");
    const bodyMessage = `${message.trim()}${reporterDetails ? `\n\nReported by: ${reporterDetails}` : ""}`;

    const taskPayload = {
      assignees: adminAssigneeIds.length > 0 ? adminAssigneeIds : [],
      completion_date: null,
      created_by: null,
      is_complete: false,
      message: bodyMessage,
      surveys_needed: 0,
      title: `Reported Issue on Tree ${tree?.id ?? "?"}`,
    };

    try {
      const response = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskPayload),
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => null);
        setSubmitError(errorJson?.message || "Unable to submit report at this time.");
        return;
      }

      setSubmitSuccess("Issue report submitted successfully.");
      clearReportForm();
      setTimeout(() => closeReportModal(), 1200);
    } catch (error) {
      console.error("Error submitting issue report", error);
      setSubmitError("Unable to submit report at this time.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!tree) return null;

  return (
    <aside className="absolute right-0 top-0 z-[3000] flex h-full w-[405px] flex-col bg-card px-[29px] py-9 shadow-panel max-md:bottom-0 max-md:top-auto max-md:h-[76%] max-md:w-full max-md:rounded-t-[24px] max-md:px-5">
      <div className="mb-7 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-serif text-[30px] font-normal leading-none text-text">ECOSLO #{tree.id}</h2>
            <Badge variant={statusBadgeVariant(tree.status)} size="sm">
              {displayStatus(tree.status)}
            </Badge>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          className={appButtonClassName({ iconOnly: true, variant: "ghost" })}
        >
          <X aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-[19px] overflow-y-auto pr-1">
        <InfoBlock label="Species">
          <p>{displayValue(tree.species_name)}</p>
          <p className="mt-1 text-[12px] text-text-muted">{displayValue(tree.common_name)}</p>
        </InfoBlock>
        <InfoBlock label="Location">
          <p>{displayValue(tree.address)}</p>
          <p className="mt-1 text-[12px] text-text-muted">
            {tree.latitude}, {tree.longitude}
          </p>
        </InfoBlock>
        <InfoBlock label="Tree Keeper">
          <p>{tree.member ? `${tree.member.firstname} ${tree.member.lastname}` : "Not assigned"}</p>
        </InfoBlock>
        <InfoBlock label="Visibility">
          <p>{tree.is_public ? "Public" : "Private"}</p>
        </InfoBlock>
        <InfoBlock label="Notes">
          <p>{displayValue(tree.notes)}</p>
        </InfoBlock>
      </div>

      <div className="mt-7 border-t border-border pt-[22px]">
        <AppButton type="button" className="mb-3 w-full" icon={Flag} onClick={openReportModal}>
          Report an Issue
        </AppButton>
        <AppButton type="button" onClick={onClose} className="w-full" variant="secondary">
          Close
        </AppButton>
      </div>
      {isReporting ? (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center bg-text/45 px-4">
          <div className="w-full max-w-xl overflow-hidden rounded-[24px] bg-card p-8 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-[28px] font-normal leading-none text-text">Report an Issue</h2>
              </div>
              <button
                type="button"
                onClick={closeReportModal}
                aria-label="Close report form"
                className={appButtonClassName({ iconOnly: true, variant: "ghost" })}
              >
                <X aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
            <div className="space-y-4">
              <label className="block">
                <span className="font-mulish text-sm font-bold">Message</span>
                <TextAreaField
                  id="report-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={5}
                  className="mt-2 resize-none bg-off-white-2"
                  placeholder="Let us know what's wrong with this tree"
                />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="font-mulish text-sm font-bold">Your Name (optional)</span>
                  <TextField
                    type="text"
                    value={reporterName}
                    onChange={(event) => setReporterName(event.target.value)}
                    className="mt-2 bg-off-white-2"
                    placeholder="Enter your name"
                  />
                </label>
                <label className="block">
                  <span className="font-mulish text-sm font-bold">Phone (optional)</span>
                  <TextField
                    type="tel"
                    value={reporterPhone}
                    onChange={(event) => setReporterPhone(event.target.value)}
                    className="mt-2 bg-off-white-2"
                    placeholder="Phone number"
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="font-mulish text-sm font-bold">Email (optional)</span>
                  <TextField
                    type="email"
                    value={reporterEmail}
                    onChange={(event) => setReporterEmail(event.target.value)}
                    className="mt-2 bg-off-white-2"
                    placeholder="Email address"
                  />
                </label>
              </div>
              {submitError ? <p className="font-mulish text-sm text-danger">{submitError}</p> : null}
              {submitSuccess ? <p className="font-mulish text-sm text-success">{submitSuccess}</p> : null}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <AppButton type="button" onClick={closeReportModal} variant="secondary">
                  Cancel
                </AppButton>
                <AppButton type="button" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit"}
                </AppButton>
              </div>
              <p className="font-mulish text-xs text-text-muted">
                This report will create a task for the ECOSLO admin team.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
