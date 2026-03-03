import React, { createContext, useContext, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AttendanceCode {
  code: string;
  teacher_id: string;
  teacher_name: string;
  created_at: string;
  expires_at: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  student_name: string;
  code: string;
  submitted_at: string;
}

interface AttendanceContextType {
  generateCode: (teacherId: string, teacherName: string) => Promise<string>;
  submitAttendance: (studentId: string, studentName: string, code: string) => Promise<{ success: boolean; error?: string }>;
  getActiveCodes: (teacherId?: string) => Promise<AttendanceCode[]>;
  getStudentRecords: (studentId: string) => Promise<AttendanceRecord[]>;
  getTeacherRecords: (teacherId: string) => Promise<AttendanceRecord[]>;
}

const AttendanceContext = createContext<AttendanceContextType | null>(null);

const CODE_VALIDITY_MINUTES = 5;

export const AttendanceProvider = ({ children }: { children: ReactNode }) => {
  const generateCode = useCallback(async (teacherId: string, teacherName: string) => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const now = new Date();
    const expiresAt = new Date(now.getTime() + CODE_VALIDITY_MINUTES * 60 * 1000);

    await supabase.from("attendance_codes").insert({
      code,
      teacher_id: teacherId,
      teacher_name: teacherName,
      expires_at: expiresAt.toISOString(),
    });

    return code;
  }, []);

  const getActiveCodes = useCallback(async (teacherId?: string) => {
    let query = supabase
      .from("attendance_codes")
      .select("*")
      .gt("expires_at", new Date().toISOString());

    if (teacherId) query = query.eq("teacher_id", teacherId);

    const { data } = await query.order("created_at", { ascending: false });
    return (data ?? []) as AttendanceCode[];
  }, []);

  const submitAttendance = useCallback(async (studentId: string, studentName: string, code: string) => {
    // Check code is active
    const { data: activeCode } = await supabase
      .from("attendance_codes")
      .select("*")
      .eq("code", code)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (!activeCode) return { success: false, error: "Invalid or expired code" };

    // Check duplicate
    const { data: existing } = await supabase
      .from("attendance_records")
      .select("id")
      .eq("student_id", studentId)
      .eq("code", code)
      .maybeSingle();

    if (existing) return { success: false, error: "You already submitted attendance for this code" };

    const { error } = await supabase.from("attendance_records").insert({
      student_id: studentId,
      student_name: studentName,
      code,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  }, []);

  const getStudentRecords = useCallback(async (studentId: string) => {
    const { data } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("student_id", studentId)
      .order("submitted_at", { ascending: false });
    return (data ?? []) as AttendanceRecord[];
  }, []);

  const getTeacherRecords = useCallback(async (teacherId: string) => {
    // Get teacher's codes first, then records matching those codes
    const { data: codes } = await supabase
      .from("attendance_codes")
      .select("code")
      .eq("teacher_id", teacherId);

    if (!codes || codes.length === 0) return [];

    const codeValues = codes.map((c) => c.code);
    const { data } = await supabase
      .from("attendance_records")
      .select("*")
      .in("code", codeValues)
      .order("submitted_at", { ascending: false });

    return (data ?? []) as AttendanceRecord[];
  }, []);

  return (
    <AttendanceContext.Provider value={{ generateCode, submitAttendance, getActiveCodes, getStudentRecords, getTeacherRecords }}>
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const ctx = useContext(AttendanceContext);
  if (!ctx) throw new Error("useAttendance must be used within AttendanceProvider");
  return ctx;
};
