function csvEscapeValue(value: unknown): string {
  if (value == null) return "";
  const str = Array.isArray(value) ? value.join(", ") : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function dataToCSV(data: Record<string, unknown>[], headers?: string[]): string {
  if (data.length === 0) return headers ? headers.join(",") : "";
  const keys = headers || Object.keys(data[0]);
  const csvRows = data.map((val) => keys.map((key) => csvEscapeValue(val[key])).join(","));
  return [keys.join(","), ...csvRows].join("\n");
}

function localeISOString(date: Date): string {
  const tzOffset = date.getTimezoneOffset() * 60000;
  const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, -5);
  return localISOTime;
}

export function downloadCSV(csv: string, filenamePrefix: string) {
  const date = localeISOString(new Date());
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenamePrefix}_${date}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
