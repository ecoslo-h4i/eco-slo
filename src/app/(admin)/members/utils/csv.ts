import { dataToCSV, downloadCSV } from "@/lib/csv";

export { dataToCSV };

export function downloadMemberCSV(csv: string) {
  downloadCSV(csv, "members_export");
}
