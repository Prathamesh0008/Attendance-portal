import functions from "firebase-functions";
import admin from "firebase-admin";
import ExcelJS from "exceljs";
import nodemailer from "nodemailer";
import moment from "moment-timezone";

admin.initializeApp();
const db = admin.firestore();

// DAILY 6 PM IST
export const sendDailyAttendanceReport = functions.pubsub
  .schedule("0 18 * * *")
  .timeZone("Asia/Kolkata")
  .onRun(async () => {
    console.log("Generating daily attendance report...");

    try {
      // Fetch attendance logs
      const attendanceSnap = await db
        .collection("attendanceLogs")
        .orderBy("createdAt", "asc")
        .get();

      const leaveSnap = await db
        .collection("leaveRequests")
        .orderBy("createdAt", "asc")
        .get();

      const attendanceData = attendanceSnap.docs.map((doc) => doc.data());
      const leaveData = leaveSnap.docs.map((doc) => doc.data());

      const workbook = new ExcelJS.Workbook();

      // Attendance sheet
      const sheet1 = workbook.addWorksheet("Attendance Logs");
      sheet1.columns = [
        { header: "Date", key: "date", width: 15 },
        { header: "Time", key: "time", width: 15 },
        { header: "Employee ID", key: "empId", width: 15 },
        { header: "Employee Name", key: "empName", width: 25 },
        { header: "Action", key: "action", width: 20 },
        { header: "Details", key: "details", width: 30 },
      ];
      attendanceData.forEach((row) => sheet1.addRow(row));

      // Leave sheet
      const sheet2 = workbook.addWorksheet("Leave Records");
      sheet2.columns = [
        { header: "Employee ID", key: "empId", width: 15 },
        { header: "Employee Name", key: "empName", width: 25 },
        { header: "From", key: "from", width: 15 },
        { header: "To", key: "to", width: 15 },
        { header: "Reason", key: "reason", width: 30 },
        { header: "Applied On", key: "appliedOn", width: 15 },
      ];
      leaveData.forEach((row) => sheet2.addRow(row));

      const buffer = await workbook.xlsx.writeBuffer();

      // Email credentials from env
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: functions.config().gmail.email,
          pass: functions.config().gmail.password,
        },
      });

      const today = moment().tz("Asia/Kolkata").format("DD-MM-YYYY");

      await transporter.sendMail({
        from: `"Nova Attendance System" <${functions.config().gmail.email}>`,
        to: "novadesigns79@gmail.com",
        subject: `Daily Attendance Report - ${today}`,
        text: "Attached is the auto-generated attendance report.",
        attachments: [
          {
            filename: `Attendance_Report_${today}.xlsx`,
            content: buffer,
          },
        ],
      });

      console.log("Email Sent Successfully!");
      return null;
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  });
