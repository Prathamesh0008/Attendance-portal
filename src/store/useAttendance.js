import { useEffect, useState } from "react";

const KEY = "attendance-portal:v1";

export default function useAttendance() {
  const [state, setState] = useState(() => {
    const raw = localStorage.getItem(KEY);
    return raw
      ? JSON.parse(raw)
      : {
          org: "Nova TechSciences",
          employees: {},
          days: {},
          leaves: [],
        };
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  const upsertEmployee = (empId, name) => {
    setState((p) => ({
      ...p,
      employees: { ...p.employees, [empId]: { name } },
    }));
  };

  const dateKey = (d = new Date()) => d.toISOString().slice(0, 10);

  const getDay = (dateStr, init = true) => {
    if (!state.days[dateStr] && init)
      setState((p) => ({ ...p, days: { ...p.days, [dateStr]: {} } }));
    return state.days[dateStr] || {};
  };

  const clockIn = (dateStr, empId) => {
    const now = new Date().toLocaleTimeString("en-IN", { hour12: false });
    updateDay(dateStr, empId, (rec) => (rec.clockIn = now));
  };

  const clockOut = (dateStr, empId) => {
    const now = new Date().toLocaleTimeString("en-IN", { hour12: false });
    updateDay(dateStr, empId, (rec) => {
      rec.clockOut = now;
      rec.totalHours = calcTotal(rec.clockIn, now);
    });
  };

  const addBreak = (dateStr, empId, type, min) => {
    updateDay(dateStr, empId, (rec) => {
      rec.breaks[type] = (rec.breaks[type] || 0) + min;
    });
  };

  const addBreatherOverrun = (dateStr, empId) => {
    updateDay(dateStr, empId, (rec) => {
      rec.breatherOverruns = (rec.breatherOverruns || 0) + 1;
    });
  };

  const addNote = (dateStr, empId, note) => {
    updateDay(dateStr, empId, (rec) => (rec.notes = note));
  };

  const requestLeave = (empId, from, to, reason) => {
    const emp = state.employees[empId] || { name: "" };
    setState((p) => ({
      ...p,
      leaves: [
        ...p.leaves,
        { empId, empName: emp.name, from, to, reason, status: "PENDING" },
      ],
    }));
  };

  function updateDay(dateStr, empId, cb) {
    setState((p) => {
      const day = p.days[dateStr] || {};
      const rec = day[empId] || baseRecord(dateStr, empId, p.employees[empId]?.name);
      cb(rec);
      return { ...p, days: { ...p.days, [dateStr]: { ...day, [empId]: rec } } };
    });
  }

  return { state, upsertEmployee, dateKey, getDay, clockIn, clockOut, addBreak, addBreatherOverrun, addNote, requestLeave };
}

function baseRecord(date, empId, empName = "") {
  return {
    date,
    empId,
    empName,
    clockIn: "",
    clockOut: "",
    totalHours: "",
    breaks: { tea: 0, lunch: 0, evening: 0, breather: 0 },
    breatherOverruns: 0,
    notes: "",
  };
}

function calcTotal(a, b) {
  if (!a || !b) return "";
  const [ah, am, as] = a.split(":").map(Number);
  const [bh, bm, bs] = b.split(":").map(Number);
  const diff = bh * 3600 + bm * 60 + bs - (ah * 3600 + am * 60 + as);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return `${h}h ${m}m`;
}
