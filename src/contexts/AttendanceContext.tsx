import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface AttendanceCode {
  code: string;
  teacherId: string;
  teacherName: string;
  createdAt: number;
  expiresAt: number;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  code: string;
  timestamp: number;
}

interface AttendanceContextType {
  codes: AttendanceCode[];
  records: AttendanceRecord[];
  generateCode: (teacherId: string, teacherName: string) => string;
  submitAttendance: (studentId: string, studentName: string, code: string) => { success: boolean; error?: string };
  getActiveCodes: () => AttendanceCode[];
  getStudentRecords: (studentId: string) => AttendanceRecord[];
  getTeacherRecords: (teacherId: string) => AttendanceRecord[];
}

const AttendanceContext = createContext<AttendanceContextType | null>(null);

const CODE_VALIDITY_MS = 5 * 60 * 1000; // 5 minutes

export const AttendanceProvider = ({ children }: { children: ReactNode }) => {
  const [codes, setCodes] = useState<AttendanceCode[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  const generateCode = useCallback((teacherId: string, teacherName: string) => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const now = Date.now();
    setCodes((prev) => [
      ...prev,
      { code, teacherId, teacherName, createdAt: now, expiresAt: now + CODE_VALIDITY_MS },
    ]);
    return code;
  }, []);

  const getActiveCodes = useCallback(() => {
    const now = Date.now();
    return codes.filter((c) => c.expiresAt > now);
  }, [codes]);

  const submitAttendance = useCallback(
    (studentId: string, studentName: string, code: string) => {
      const now = Date.now();
      const activeCode = codes.find((c) => c.code === code && c.expiresAt > now);
      if (!activeCode) return { success: false, error: "Invalid or expired code" };

      const alreadySubmitted = records.find((r) => r.studentId === studentId && r.code === code);
      if (alreadySubmitted) return { success: false, error: "You already submitted attendance for this code" };

      setRecords((prev) => [
        ...prev,
        { id: crypto.randomUUID(), studentId, studentName, code, timestamp: now },
      ]);
      return { success: true };
    },
    [codes, records]
  );

  const getStudentRecords = useCallback(
    (studentId: string) => records.filter((r) => r.studentId === studentId),
    [records]
  );

  const getTeacherRecords = useCallback(
    (teacherId: string) => {
      const teacherCodes = codes.filter((c) => c.teacherId === teacherId).map((c) => c.code);
      return records.filter((r) => teacherCodes.includes(r.code));
    },
    [codes, records]
  );

  return (
    <AttendanceContext.Provider
      value={{ codes, records, generateCode, submitAttendance, getActiveCodes, getStudentRecords, getTeacherRecords }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const ctx = useContext(AttendanceContext);
  if (!ctx) throw new Error("useAttendance must be used within AttendanceProvider");
  return ctx;
};
