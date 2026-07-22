import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth.js";

export function ProtectedRoute({ papeis }: { papeis?: string[] }) {
  const { autenticado, usuario } = useAuth();
  if (!autenticado) return <Navigate to="/login" replace />;
  if (papeis && usuario && !papeis.includes(usuario.papel)) return <Navigate to="/" replace />;
  return <Outlet />;
}
