import * as XLSX from "xlsx";

export function exportDailyExcel({ dateStr, orgName, rows }) {
  const header = [
    "Date",
    "Employee ID",
    "Name",
    "Clock In",
    "Clock Out",
    "Total Hours",
    "Tea Break",
    "Lunch Break",
    "Evening Break",
    "Breather",
    "Breather Overruns",
    "Notes",
  ];

  const wsData = [header];
  rows.forEach((r) => {
    wsData.push([
      r.date,
      r.empId,
      r.empName,
      r.clockIn || "",
      r.clockOut || "",
      r.totalHours || "",
      r.breaks.tea || 0,
      r.breaks.lunch || 0,
      r.breaks.evening || 0,
      r.breaks.breather || 0,
      r.breatherOverruns || 0,
      r.notes || "",
    ]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "Attendance");
  XLSX.writeFile(wb, `${orgName}_Attendance_${dateStr}.xlsx`);
}
