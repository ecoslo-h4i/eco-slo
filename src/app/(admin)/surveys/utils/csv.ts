import { dataToCSV, downloadCSV } from "@/lib/csv";

export { dataToCSV };

export function downloadSurveyCSV(csv: string) {
  downloadCSV(csv, "surveys_export");
}
