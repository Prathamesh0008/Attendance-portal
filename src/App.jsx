import { useEffect, useMemo, useState } from "react";
import {
  Coffee,
  Sandwich,
  Moon,
  Wind,
  CalendarDays,
  Download,
  FileDown,
  Clock,
  LogOut,
  User,
  Play,
  StopCircle,
} from "lucide-react";
import useAttendance from "./store/useAttendance.js";
import * as XLSX from "xlsx";
import { isHoliday } from "./utils/indiaHolidays.js";
import Modal from "./components/Modal.jsx";
import TimerBar from "./components/TimerBar.jsx";

// 🔹 Employee master list
const employees = [
  { id: "NTS-001", name: "Prathamesh Shinde", shift: "10:00 AM - 7:00 PM" },
  { id: "NTS-002", name: "Adarsh Singh", shift: "10:00 AM - 7:00 PM" },
  { id: "NTS-003", name: "Payal Nalavade", shift: "9:00 AM - 6:00 PM" },
  { id: "NTS-004", name: "Vaishnavi GHODVINDE", shift: "9:00 AM - 6:00 PM" },
  { id: "NTS-005", name: "RUSHIKESH ANDHALE,", shift: "9:00 AM - 6:00 PM" },
  { id: "NTS-006", name: "Upasana Patil", shift: "9:00 AM - 6:00 PM" },
  { id: "NTS-007", name: "Prajakta Dhande", shift: "9:00 AM - 6:00 PM" },
  { id: "NTS-008", name: "Chotelal Singh", shift: "9:00 AM - 6:00 PM" },

];

export default function App() {
  const {
    // upsertEmployee,
    dateKey,
    clockIn,
    clockOut,
    addBreak,
    // addBreatherOverrun,
    requestLeave,
  } = useAttendance();

  const today = dateKey();
  const [selectedDate, setSelectedDate] = useState(today);
  const [empId, setEmpId] = useState("");
  const [empName, setEmpName] = useState("");
  const [shiftStarted, setShiftStarted] = useState(false);
  const [shiftStartTime, setShiftStartTime] = useState(null);
  const [shiftEndTime, setShiftEndTime] = useState(null);
  const [activeBreak, setActiveBreak] = useState(null);
  const [totalBreakTime, setTotalBreakTime] = useState(0);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveFrom, setLeaveFrom] = useState(today);
  const [leaveTo, setLeaveTo] = useState(today);
  const [leaves, setLeaves] = useState(() =>
    JSON.parse(localStorage.getItem("leaves") || "[]")
  );
  const [logs, setLogs] = useState(() =>
    JSON.parse(localStorage.getItem("attendanceLogs") || "[]")
  );
const ADMIN_PASSWORD = "Sky@2204"; // change to your own strong password

  // --- Save attendance actions ---
  const saveLog = (action, details = "") => {
    const newLog = {
      date: new Date().toLocaleDateString("en-IN"),
      time: new Date().toLocaleTimeString("en-IN"),
      empId,
      empName,
      action,
      details,
    };
    const updated = [...logs, newLog];
    setLogs(updated);
    localStorage.setItem("attendanceLogs", JSON.stringify(updated));
  };

  // --- Save leaves ---
  const saveLeave = (from, to, reason) => {
    const newLeave = {
      empId,
      empName,
      from,
      to,
      reason,
      appliedOn: new Date().toLocaleDateString("en-IN"),
    };
    const updated = [...leaves, newLeave];
    setLeaves(updated);
    localStorage.setItem("leaves", JSON.stringify(updated));
  };

  const startShift = () => {
    if (!empId || !empName) return alert("Select employee first.");
    setShiftStarted(true);
    const now = new Date();
    setShiftStartTime(now);
    saveLog("SHIFT_START");
  };

  const endShift = () => {
    if (!shiftStarted) return;
    const now = new Date();
    setShiftEndTime(now);
    setShiftStarted(false);
    saveLog("SHIFT_END");
  };

  const handleClockIn = () => {
    if (!shiftStarted) return alert("Start your shift first!");
    clockIn(selectedDate, empId);
    saveLog("CLOCK_IN");
  };

  const handleClockOut = () => {
    clockOut(selectedDate, empId);
    saveLog("CLOCK_OUT");
  };

  const startBreak = (type, min) => {
    if (!shiftStarted) return alert("Start shift before breaks!");
    if (activeBreak) return;
    const endTime = Date.now() + min * 60 * 1000;
    setActiveBreak({ type, endsAt: endTime, minutes: min });
    saveLog("BREAK_START", type);
  };

  const endBreak = () => {
    if (!activeBreak) return;
    const elapsed = Math.ceil(
      (activeBreak.minutes * 60 * 1000 - (activeBreak.endsAt - Date.now())) /
        60000
    );
    addBreak(selectedDate, empId, activeBreak.type, elapsed);
    setTotalBreakTime((p) => p + elapsed);
    saveLog("BREAK_END", `${activeBreak.type} - ${elapsed}min`);
    setActiveBreak(null);
  };

  // ✅ Export Excel with two tabs (Attendance + Leave)
  const downloadExcel = () => {
  const pass = prompt("Enter Admin Password:");

  if (pass !== ADMIN_PASSWORD) {
    alert("❌ Incorrect password. Access denied.");
    return;
  }

  const allLogs = JSON.parse(localStorage.getItem("attendanceLogs") || "[]");
  const allLeaves = JSON.parse(localStorage.getItem("leaves") || "[]");

  if (!allLogs.length && !allLeaves.length) {
    alert("No data found to export.");
    return;
  }

  // ---- Attendance Sheet (All employees consolidated) ----
  const attendanceSheet = allLogs.map((l) => ({
    Date: l.date,
    Time: l.time,
    "Employee ID": l.empId,
    "Employee Name": l.empName,
    Action: l.action,
    Details: l.details || "",
  }));

  // ---- Leaves Sheet (All employees) ----
  const leaveSheet = allLeaves.length
    ? allLeaves.map((lv) => ({
        "Employee ID": lv.empId,
        "Employee Name": lv.empName,
        "From": lv.from,
        "To": lv.to,
        "Reason": lv.reason,
        "Applied On": lv.appliedOn,
      }))
    : [{ Note: "No Leaves Recorded" }];

  const wb = XLSX.utils.book_new();

  const ws1 = XLSX.utils.json_to_sheet(attendanceSheet);
  const ws2 = XLSX.utils.json_to_sheet(leaveSheet);

  XLSX.utils.book_append_sheet(wb, ws1, "All Attendance Logs");
  XLSX.utils.book_append_sheet(wb, ws2, "All Leave Records");

  XLSX.writeFile(wb, `NTS_Attendance_Report_All_${today}.xlsx`);
};


  const downloadJSON = () => {
    const combined = { attendance: logs, leaves };
    const blob = new Blob([JSON.stringify(combined, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `attendance_data_${empId}_${today}.json`;
    link.click();
  };

  const handleLeaveSubmit = () => {
    saveLeave(leaveFrom, leaveTo, leaveReason);
    requestLeave(empId, leaveFrom, leaveTo, leaveReason);
    saveLog("LEAVE_APPLIED", leaveReason);
    setLeaveOpen(false);
    alert("✅ Leave submitted successfully");
  };

  const isWeekend = useMemo(() => {
    const d = new Date(selectedDate).getDay();
    return d === 0 || d === 6;
  }, [selectedDate]);
  const isDayOff = isWeekend || isHoliday(selectedDate);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 font-sans">
      {/* ---- Header ---- */}
      <header className="bg-gradient-to-r from-[#18487d] to-[#34a0a4] text-white rounded-2xl p-5 shadow-md flex flex-col md:flex-row justify-between items-center gap-3">
        <div>
          <h1 className="text-xl font-bold">Nova TechSciences Attendance Portal</h1>
          <p className="text-sm opacity-90">Precision | Purity | Progress</p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays size={18} />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-slate-800 rounded-md px-2 py-1 text-sm"
          />
        </div>
      </header>

      <main className="max-w-4xl mx-auto mt-6 space-y-6">
        {/* Employee selector */}
        <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col w-full sm:w-1/2">
            <label className="text-sm font-medium text-slate-600 mb-1">
              Select Employee
            </label>
            <select
              value={empId}
              onChange={(e) => {
                if (shiftStarted) return alert("Shift in progress. Cannot change employee.");
                const id = e.target.value;
                const emp = employees.find((x) => x.id === id);
                setEmpId(id);
                setEmpName(emp ? emp.name : "");
              }}
              disabled={shiftStarted}
              className="border rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
            >
              <option value="">-- Choose Employee --</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.id} – {e.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            {!shiftStarted ? (
              <button
                onClick={startShift}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Play size={16} /> Start Shift
              </button>
            ) : (
              <button
                onClick={endShift}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <StopCircle size={16} /> End Shift
              </button>
            )}
          </div>
        </div>

        {/* Shift Summary */}
        {shiftStarted && (
          <div className="bg-white p-4 rounded-xl shadow-sm grid grid-cols-2 sm:grid-cols-4 text-center text-slate-700">
            <div>
              <p className="text-xs uppercase text-slate-400">Shift Window</p>
              <p className="font-semibold">9:00 AM – 6:00 PM</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-400">Shift Start</p>
              <p className="font-semibold">
                {shiftStartTime ? shiftStartTime.toLocaleTimeString() : "--"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-400">Shift End</p>
              <p className="font-semibold">
                {shiftEndTime ? shiftEndTime.toLocaleTimeString() : "--"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-400">Total Break</p>
              <p className="font-semibold">{totalBreakTime} min</p>
            </div>
          </div>
        )}

        {/* Attendance Actions */}
        {!isDayOff && (
          <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-700 text-center">Attendance Actions</h3>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={handleClockIn}
                className="bg-[#18487d] text-white px-4 py-2 rounded-lg hover:bg-[#11345c] flex items-center gap-2"
              >
                <Clock size={16} /> Clock In
              </button>
              <button
                onClick={handleClockOut}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center gap-2"
              >
                <LogOut size={16} /> Clock Out
              </button>
              <button
                onClick={() => setLeaveOpen(true)}
                className="border border-[#18487d] text-[#18487d] px-4 py-2 rounded-lg hover:bg-blue-50"
              >
                Apply Leave
              </button>
            </div>
          </div>
        )}

        {/* Breaks */}
        {shiftStarted && (
          <div className="bg-white p-4 rounded-xl shadow-sm space-y-3">
            <h3 className="font-semibold text-slate-700 text-center">Break Options</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => startBreak("Tea", 15)}
                className="bg-amber-200 text-amber-800 rounded-lg px-3 py-2 flex items-center justify-center gap-2"
              >
                <Coffee size={16} /> Tea
              </button>
              <button
                onClick={() => startBreak("Lunch", 30)}
                className="bg-green-200 text-green-800 rounded-lg px-3 py-2 flex items-center justify-center gap-2"
              >
                <Sandwich size={16} /> Lunch
              </button>
              <button
                onClick={() => startBreak("Evening", 15)}
                className="bg-orange-200 text-orange-800 rounded-lg px-3 py-2 flex items-center justify-center gap-2"
              >
                <Moon size={16} /> Evening
              </button>
              <button
                onClick={() => startBreak("Breather", 5)}
                className="bg-sky-200 text-sky-800 rounded-lg px-3 py-2 flex items-center justify-center gap-2"
              >
                <Wind size={16} /> Breather
              </button>
            </div>

            {activeBreak && (
              <div className="mt-3 text-center">
                <p className="text-sm text-slate-700">
                  🕒 On Break: <b>{activeBreak.type}</b> ({activeBreak.minutes} min)
                </p>
                <TimerBar
                  seconds={activeBreak.minutes * 60}
                  onComplete={() => {
                    alert("⏰ Break time ended!");
                    endBreak();
                  }}
                />
                <button
                  onClick={endBreak}
                  className="mt-3 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                >
                  Stop Break
                </button>
              </div>
            )}
          </div>
        )}

        {/* Reports */}
        <div className="bg-white p-4 rounded-xl shadow-sm flex flex-wrap justify-center gap-3">
          <button
            onClick={downloadExcel}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Download size={16} /> Download Excel
          </button>
          
        </div>
      </main>

      {/* Leave Modal */}
      <Modal open={leaveOpen} title="Apply for Leave" onClose={() => setLeaveOpen(false)}>
        <div className="flex flex-col gap-3">
          <label className="text-sm">From Date:</label>
          <input
            type="date"
            value={leaveFrom}
            onChange={(e) => setLeaveFrom(e.target.value)}
            className="border rounded-lg px-2 py-1 text-sm"
          />
          <label className="text-sm">To Date:</label>
          <input
            type="date"
            value={leaveTo}
            onChange={(e) => setLeaveTo(e.target.value)}
            className="border rounded-lg px-2 py-1 text-sm"
          />
          <label className="text-sm">Reason:</label>
          <textarea
            value={leaveReason}
            onChange={(e) => setLeaveReason(e.target.value)}
            rows={3}
            className="border rounded-lg p-2 text-sm"
          ></textarea>
          <button
            onClick={handleLeaveSubmit}
            className="bg-[#18487d] text-white px-4 py-2 rounded-lg hover:bg-[#11345c]"
          >
            Submit Leave
          </button>
        </div>
      </Modal>
    </div>
  );
}
