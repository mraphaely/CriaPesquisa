import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useLogin } from "../api/useLogin.js";
import { useAuth } from "../auth/useAuth.js";

export function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const { mutateAsync, isPending } = useLogin();
  const { entrar } = useAuth();
  const navigate = useNavigate();
  const [erro, setErro] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro("");
    try {
      const { token, usuario } = await mutateAsync({ email, senha });
      entrar(token, usuario);
      navigate("/");
    } catch {
      setErro("E-mail ou senha inválidos");
    }
  }

  return (
    <form onSubmit={onSubmit} aria-label="login">
      <h1>Entrar</h1>
      <label>E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label>Senha<input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} /></label>
      {erro && <p role="alert">{erro}</p>}
      <button type="submit" disabled={isPending}>{isPending ? "Entrando…" : "Entrar"}</button>
    </form>
  );
}
