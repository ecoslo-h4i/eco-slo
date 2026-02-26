import { Database } from "../../../database/database.types";

type Tree = Database["public"]["Tables"]["trees"]["Row"];

/**
 * Converts an array of objects to a CSV string.
 * @param data The array of objects to convert
 * @param headers Optional array of header strings. If not provided, object keys will be used as headers.
 *                Headers must be valid object keys.
 * @returns The CSV string representation of the data
 */
export function dataToCSV(data: any[], headers?: string[]): string {
  if (data.length === 0) return headers ? headers.join(",") : "";
  const keys = headers || Object.keys(data[0]);
  const csvRows = data.map((val) => keys.map((key) => JSON.stringify(val[key] ?? "")).join(","));
  return [keys.join(","), ...csvRows].join("\n");
}

/**
 * Converts an array of Tree objects to a CSV string.
 * @param trees The array of Tree objects to convert to CSV
 * @returns The CSV string representation of the tree data
 */
export function treesToCSV(trees: Tree[]): string {
  return dataToCSV(trees);
}

/**
 * Downloads CSV file containing all tree data
 */
export async function downloadTreeCSV() {
  // Get tree data
  const response = await fetch("/api/public/trees");
  if (!response.ok) {
    console.error("Failed to fetch tree data for CSV export: ", response.statusText);
    return;
  }
  const trees: Tree[] = (await response.json()).message as Tree[];
  // Write to csv file
  const csv = treesToCSV(trees);
  const date = new Date().toISOString().split("T")[0];
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  // Create temporary link to trigger download
  const a = document.createElement("a");
  a.href = url;
  a.download = `trees_export_${date}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
