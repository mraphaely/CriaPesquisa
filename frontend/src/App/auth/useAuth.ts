import { useContext } from "react";
import { AuthCtx } from "./AuthContext.js";

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth fora do AuthProvider");
  return ctx;
}
