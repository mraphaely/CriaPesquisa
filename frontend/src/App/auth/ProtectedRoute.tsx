import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth.js";

export function ProtectedRoute({
  papeis,
  /** Só a própria tela de troca de senha usa isto — senão o redirecionamento vira laço. */
  permitirSenhaProvisoria = false,
}: {
  papeis?: string[];
  permitirSenhaProvisoria?: boolean;
}) {
  const { autenticado, usuario } = useAuth();
  if (!autenticado) return <Navigate to="/login" replace />;

  // Enquanto a senha for a provisória — definida por um admin ou pelo seed —, a
  // conta não identifica quem está agindo: outra pessoa conhece a credencial.
  // Por isso a troca vem antes de qualquer tela, e não como um lembrete.
  if (usuario?.precisaTrocarSenha && !permitirSenhaProvisoria) return <Navigate to="/trocar-senha" replace />;

  if (papeis && usuario && !papeis.includes(usuario.papel)) return <Navigate to="/" replace />;
  return <Outlet />;
}
