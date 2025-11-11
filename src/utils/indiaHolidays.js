export const INDIA_HOLIDAYS = [
  "2025-01-26",
  "2025-08-15",
  "2025-10-02",
  "2025-10-20",
  "2025-12-25",
  "2026-01-26",
  "2026-08-15",
  "2026-10-02",
  "2026-11-08",
  "2026-12-25",
];

export function isHoliday(dateStr) {
  return INDIA_HOLIDAYS.includes(dateStr);
}
