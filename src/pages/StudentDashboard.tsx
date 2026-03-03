import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAttendance, AttendanceRecord } from "@/contexts/AttendanceContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LogOut, Send, History, CheckCircle2, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const { submitAttendance, getStudentRecords } = useAttendance();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    const recs = await getStudentRecords(user.id);
    setRecords(recs);
  }, [user, getStudentRecords]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || code.length !== 6) {
      setFeedback({ type: "error", message: "Please enter a valid 6-digit code" });
      return;
    }
    setSubmitting(true);
    const result = await submitAttendance(user.id, user.name, code);
    if (result.success) {
      setFeedback({ type: "success", message: "Attendance recorded successfully!" });
      setCode("");
      refresh();
    } else {
      setFeedback({ type: "error", message: result.error || "Submission failed" });
    }
    setSubmitting(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex items-center justify-between py-4">
          <div>
            <h1 className="text-xl font-bold">Welcome, {user?.name}</h1>
            <p className="text-sm text-muted-foreground">Student Dashboard</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </header>

      <main className="container py-8 space-y-6">
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" /> Submit Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="code">Attendance Code</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setFeedback(null); }}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="text-lg tracking-widest"
                />
              </div>
              <Button type="submit" size="lg" disabled={submitting}>{submitting ? "Submitting..." : "Submit"}</Button>
            </form>

            {feedback && (
              <div className={`mt-4 flex items-center gap-2 rounded-lg p-3 text-sm font-medium ${
                feedback.type === "success" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
              }`}>
                {feedback.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {feedback.message}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" /> Attendance History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <p className="text-muted-foreground text-sm">No attendance records yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((r) => {
                      const d = new Date(r.submitted_at);
                      return (
                        <TableRow key={r.id}>
                          <TableCell>{d.toLocaleDateString()}</TableCell>
                          <TableCell className="text-muted-foreground">{d.toLocaleTimeString()}</TableCell>
                          <TableCell><Badge className="bg-success text-success-foreground">Present</Badge></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StudentDashboard;
