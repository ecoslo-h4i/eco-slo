import { dataToCSV, downloadCSV } from "@/lib/csv";

export { dataToCSV };

export function downloadTreeCSV(csv: string) {
  downloadCSV(csv, "trees_export");
}
