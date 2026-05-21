import { AdminPageShell } from "@/components/admin-page-shell";
import SurveyForm from "@/components/survey/SurveyForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Survey",
  description: "Submit a stewardship survey.",
};

export default function SurveyPage() {
  return (
    <AdminPageShell title="Survey">
      <SurveyForm />
    </AdminPageShell>
  );
}
