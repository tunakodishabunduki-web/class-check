import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import TeacherDashboard from "./TeacherDashboard";
import StudentDashboard from "./StudentDashboard";

const Dashboard = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-muted-foreground">Loading...</p></div>;
  if (!user) return <Navigate to="/" replace />;
  return user.role === "teacher" ? <TeacherDashboard /> : <StudentDashboard />;
};

export default Dashboard;
