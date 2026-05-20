import SurveyForm from "@/components/survey/SurveyForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Survey",
  description: "Submit a stewardship survey.",
};

export default function SurveyPage() {
  return (
    <div className="flex min-h-0 flex-grow flex-col bg-background">
      <main className="flex flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <header className="pt-2 sm:pt-5">
            <h1 className="font-serif text-4xl font-semibold leading-tight text-text sm:text-[52px]">
              Survey
            </h1>
          </header>

          <SurveyForm />
        </div>
      </main>
    </div>
  );
}
