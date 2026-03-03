import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import TeacherDashboard from "./TeacherDashboard";
import StudentDashboard from "./StudentDashboard";

const Dashboard = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return user.role === "teacher" ? <TeacherDashboard /> : <StudentDashboard />;
};

export default Dashboard;
