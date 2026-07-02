"use client";

import { Flag, X } from "lucide-react";
import { type ReactNode, useState } from "react";
import { AppButton, TextField, TextAreaField, controlLabelClassName } from "@/components/ui/form-controls";
import Badge from "@/components/badge";
import type { MapTree } from "@/types/map";

type MapPopoutProps = {
  tree: MapTree | null;
  onClose: () => void;
};

function displayValue(value: string | null | undefined) {
  return value?.trim() ? value : "Not available";
}

function statusBadgeVariant(status: string) {
  return status === "Active" ? "success" : "muted";
}

function InfoBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="min-h-22 rounded-2xl bg-card border border-border px-4 py-4">
      <h3 className="mb-2 font-serif text-sm font-bold uppercase leading-none tracking-normal text-text">{label}</h3>
      <div className="font-mulish text-sm font-medium leading-snug text-text">{children}</div>
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

    try {
      const response = await fetch("/api/public/issue-reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          reporterEmail,
          reporterName,
          reporterPhone,
          treeId: tree?.id,
        }),
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
    <aside className="absolute right-0 top-0 z-20 flex h-full w-full max-w-md flex-col bg-off-white px-7 py-9 shadow-panel max-md:bottom-0 max-md:top-auto max-md:h-3/4 max-md:max-w-none max-md:rounded-t-3xl max-md:px-5 max-md:py-5">
      <div className="mb-7 flex items-start justify-between gap-4 max-md:mb-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-serif text-3xl font-medium leading-none text-text">#{tree.ecoslo_num}</h2>
            <Badge variant={statusBadgeVariant(tree.status)} size="md">
              {tree.status}
            </Badge>
          </div>
        </div>
        <AppButton type="button" onClick={onClose} aria-label="Close panel" icon={X} iconOnly variant="ghost">
          Close panel
        </AppButton>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        <InfoBlock label="Species">
          <p>{displayValue(tree.species_name)}</p>
          <p className="mt-1 text-xs text-text-muted">{displayValue(tree.common_name)}</p>
        </InfoBlock>
        <InfoBlock label="Location">
          <p>{displayValue(tree.address)}</p>
          <p className="mt-1 text-xs text-text-muted">
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

      <div className="mt-7 border-t border-border pt-6 max-md:mt-4 max-md:pt-4">
        <AppButton
          type="button"
          className="mb-3 w-full"
          icon={Flag}
          onClick={openReportModal}
          disabled={!tree.is_public}
        >
          Report an Issue
        </AppButton>
        <AppButton type="button" onClick={onClose} className="w-full" variant="secondary">
          Close
        </AppButton>
      </div>
      {isReporting ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-text/45 p-4">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-3xl bg-off-white p-5 shadow-2xl md:p-8">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-3xl font-normal leading-none text-text">Report an Issue</h2>
              </div>
              <AppButton
                type="button"
                onClick={closeReportModal}
                aria-label="Close report form"
                icon={X}
                iconOnly
                variant="ghost"
              >
                Close report form
              </AppButton>
            </div>
            <div className="space-y-4">
              <label className="block">
                <span className={controlLabelClassName}>Message</span>
                <TextAreaField
                  id="report-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={5}
                  className="mt-2 resize-none"
                  placeholder="Let us know what's wrong with this tree"
                />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className={controlLabelClassName}>Your Name (optional)</span>
                  <TextField
                    type="text"
                    value={reporterName}
                    onChange={(event) => setReporterName(event.target.value)}
                    className="mt-2"
                    placeholder="Enter your name"
                  />
                </label>
                <label className="block">
                  <span className={controlLabelClassName}>Phone (optional)</span>
                  <TextField
                    type="tel"
                    value={reporterPhone}
                    onChange={(event) => setReporterPhone(event.target.value)}
                    className="mt-2"
                    placeholder="Phone number"
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className={controlLabelClassName}>Email (optional)</span>
                  <TextField
                    type="email"
                    value={reporterEmail}
                    onChange={(event) => setReporterEmail(event.target.value)}
                    className="mt-2"
                    placeholder="Email address"
                  />
                </label>
              </div>
              {submitError ? <p className="font-mulish text-sm text-danger">{submitError}</p> : null}
              {submitSuccess ? <p className="font-mulish text-sm text-success">{submitSuccess}</p> : null}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end mt-8">
                <AppButton type="button" onClick={closeReportModal} variant="secondary" className="w-full sm:w-auto">
                  Cancel
                </AppButton>
                <AppButton type="button" onClick={handleSubmit} disabled={isSubmitting} className="w-full sm:w-auto">
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
