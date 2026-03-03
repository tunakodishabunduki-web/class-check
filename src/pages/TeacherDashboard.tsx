import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAttendance, AttendanceCode, AttendanceRecord } from "@/contexts/AttendanceContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { KeyRound, LogOut, Clock, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const formatTime = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const { generateCode, getActiveCodes, getTeacherRecords } = useAttendance();
  const navigate = useNavigate();
  const [activeCodes, setActiveCodes] = useState<AttendanceCode[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [, setTick] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) return;
    const [codes, recs] = await Promise.all([
      getActiveCodes(user.id),
      getTeacherRecords(user.id),
    ]);
    setActiveCodes(codes);
    setRecords(recs);
  }, [user, getActiveCodes, getTeacherRecords]);

  useEffect(() => {
    refresh();
    const interval = setInterval(() => {
      refresh();
      setTick((t) => t + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  // Tick every second for countdown display
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleGenerate = async () => {
    if (user) {
      await generateCode(user.id, user.name);
      refresh();
    }
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
            <p className="text-sm text-muted-foreground">Teacher Dashboard</p>
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
              <KeyRound className="h-5 w-5 text-primary" /> Generate Attendance Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGenerate} size="lg">Generate New Code</Button>
          </CardContent>
        </Card>

        {activeCodes.length > 0 && (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" /> Active Codes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activeCodes.map((c) => {
                  const remaining = new Date(c.expires_at).getTime() - Date.now();
                  return (
                    <div key={c.code} className="flex flex-col items-center rounded-xl border bg-muted/50 p-6">
                      <span className="text-4xl font-bold tracking-widest text-primary">{c.code}</span>
                      <Badge variant={remaining < 60000 ? "destructive" : "secondary"} className="mt-3">
                        {formatTime(remaining)} remaining
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Attendance Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <p className="text-muted-foreground text-sm">No submissions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.student_name}</TableCell>
                        <TableCell><code className="rounded bg-muted px-2 py-0.5 text-sm">{r.code}</code></TableCell>
                        <TableCell className="text-muted-foreground">{new Date(r.submitted_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
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

export default TeacherDashboard;
