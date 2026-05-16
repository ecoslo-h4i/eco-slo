"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

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
    <aside className="absolute right-0 top-0 z-[3000] h-full w-[400px] overflow-y-auto flex-col bg-[#FFFCF5] px-8 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-[22px] leading-none text-black">ECOSLO #{tree.id}</h2>
          <span className="rounded-full bg-[#EEEAE4] px-3 py-1 text-[11px] text-black/50">{tree.status}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          className="flex h-6 w-6 items-center justify-center text-[12px] leading-none text-black/70 cursor-pointer font-semibold transition-all duration-200 hover:text-black/60"
        >
          ✕
        </button>
      </div>
      <div className="space-y-5">
        <div className="px-4 py-3 rounded-2xl bg-[#EEEAE4]">
          <p className="mb-1 text-[12px] font-semibold text-black">Species</p>
          <p className="text-[14px] text-black font-semibold">{tree.species_name}</p>
          <p className="text-[12px] mt-1 text-black/70 font-semibold">{tree.common_name}</p>
        </div>
        <div className="px-4 py-3 rounded-2xl bg-[#EEEAE4]">
          <p className="mb-1 text-[12px] font-semibold text-black">Location</p>
          <p className="text-[14px] text-black font-semibold">{tree.address}</p>
          <p className="text-[12px] mt-1 text-black/70 font-semibold">
            {tree.latitude}, {tree.longitude}
          </p>
        </div>
        <div className="px-4 py-3 rounded-2xl bg-[#EEEAE4]">
          <p className="mb-1 text-[12px] font-semibold text-black">Tree Keeper</p>
          <p className="text-[14px] text-black font-semibold">
            {tree.member?.firstname} {tree.member?.lastname}
          </p>
        </div>
        <div className="px-4 py-3 rounded-2xl bg-[#EEEAE4]">
          <p className="mb-1 text-[12px] font-semibold text-black">Visibility</p>
          <p className="text-[14px] text-black font-semibold">{tree.is_public ? "Public" : "Private"}</p>
        </div>
        <div className="px-4 py-3 rounded-2xl bg-[#EEEAE4]">
          <p className="mb-1 text-[12px] font-semibold text-black">Notes</p>
          <p className="text-[14px] text-black font-semibold">{tree.notes}</p>
        </div>
      </div>
      <div className="mt-8 border-t border-[#F5EADD] pt-6">
        <button
          type="button"
          className="w-[337px] flex items-center justify-center gap-3 rounded-full bg-[#758656] px-6 py-2 mb-4 text-white cursor-pointer transition-all duration-200 hover:bg-[#6c7d4c]"
          onClick={openReportModal}
        >
          <Image src="/icons/report.svg" alt="" width={20} height={20} className="h-5 w-5" />
          <span>Report an Issue</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-[337px] flex items-center justify-center gap-3 rounded-full bg-[#EDE6DB] px-6 py-2 text-black font-semibold cursor-pointer border border-black/10 transition-all duration-200 hover:bg-[#DED6C6]"
        >
          <span>Close</span>
        </button>
      </div>
      {isReporting ? (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl overflow-hidden rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[24px] font-semibold">Report an Issue</h2>
                <p className="mt-1 text-sm text-slate-600">Tell us what&apos;s wrong with this tree.</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold" htmlFor="report-message">
                    Message
                  </label>
                  <button
                    type="button"
                    onClick={closeReportModal}
                    aria-label="Close report form"
                    className="flex h-6 w-6 items-center justify-center text-[16px] leading-none text-black/70 cursor-pointer font-semibold transition-all duration-200 hover:text-black/60"
                  >
                    ✕
                  </button>
                </div>
                <textarea
                  id="report-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={5}
                  className="mt-2 w-full resize-none rounded-2xl border border-slate-300 bg-slate-50 p-4 text-sm shadow-sm outline-none transition focus:border-[#758656] focus:ring-2 focus:ring-[#758656]/20"
                  placeholder="Let us know what's wrong with this tree"
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-semibold">Your Name (optional)</span>
                    <input
                      type="text"
                      value={reporterName}
                      onChange={(event) => setReporterName(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 text-sm shadow-sm outline-none transition focus:border-[#758656] focus:ring-2 focus:ring-[#758656]/20 cursor-text"
                      placeholder="Enter your name"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold">Phone (optional)</span>
                    <input
                      type="tel"
                      value={reporterPhone}
                      onChange={(event) => setReporterPhone(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 text-sm shadow-sm outline-none transition focus:border-[#758656] focus:ring-2 focus:ring-[#758656]/20"
                      placeholder="Phone number"
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="text-sm font-semibold">Email (optional)</span>
                    <input
                      type="email"
                      value={reporterEmail}
                      onChange={(event) => setReporterEmail(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 text-sm shadow-sm outline-none transition focus:border-[#758656] focus:ring-2 focus:ring-[#758656]/20"
                      placeholder="Email address"
                    />
                  </label>
                </div>
                {submitError ? <p className="text-sm text-red-700">{submitError}</p> : null}
                {submitSuccess ? <p className="text-sm text-green-700">{submitSuccess}</p> : null}
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeReportModal}
                    className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="rounded-full bg-[#758656] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#6c7d4c] disabled:cursor-not-allowed disabled:bg-slate-300 cursor-pointer"
                  >
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </button>
                </div>
                <p className="text-xs text-slate-500">This report will create a task for the ECOSLO admin team.</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
