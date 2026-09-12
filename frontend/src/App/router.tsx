import { createBrowserRouter } from "react-router-dom";
import { Layout } from "../Components/layout/Layout.js";
import { ProtectedRoute } from "./auth/ProtectedRoute.js";
import { Login } from "./pages/Login.js";
import { Dashboard } from "./pages/Dashboard.js";
import { Pesquisas } from "./pages/Pesquisas.js";
import { NovaPesquisa } from "./pages/NovaPesquisa.js";
import { ResultadosPesquisa } from "./pages/ResultadosPesquisa.js";
import { DetalhePesquisa } from "./pages/DetalhePesquisa.js";
import { Usuarios } from "./pages/Usuarios.js";
import { NovoUsuario } from "./pages/NovoUsuario.js";
import { Logs } from "./pages/Logs.js";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: "/", element: <Dashboard /> },
          { path: "/pesquisas", element: <Pesquisas /> },
          { path: "/pesquisas/:id", element: <ResultadosPesquisa /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute papeis={["ADMIN", "GESTOR"]} />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: "/pesquisas/nova", element: <NovaPesquisa /> },
          { path: "/pesquisas/:id/editar", element: <NovaPesquisa /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute papeis={["ADMIN", "GESTOR", "COLETADOR"]} />,
    children: [
      {
        element: <Layout />,
        children: [{ path: "/pesquisas/:id/responder", element: <DetalhePesquisa /> }],
      },
    ],
  },
  {
    element: <ProtectedRoute papeis={["ADMIN"]} />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: "/usuarios", element: <Usuarios /> },
          { path: "/usuarios/novo", element: <NovoUsuario /> },
          { path: "/usuarios/:id/editar", element: <NovoUsuario /> },
          { path: "/logs", element: <Logs /> },
        ],
      },
    ],
  },
]);
