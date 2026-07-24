import { createBrowserRouter } from "react-router-dom";
import { Layout } from "../Components/layout/Layout.js";
import { ProtectedRoute } from "./auth/ProtectedRoute.js";
import { Login } from "./pages/Login.js";
import { Dashboard } from "./pages/Dashboard.js";
import { Pesquisas } from "./pages/Pesquisas.js";
import { NovaPesquisa } from "./pages/NovaPesquisa.js";
import { DetalhePesquisa } from "./pages/DetalhePesquisa.js";
import { ResponderPesquisa } from "./pages/ResponderPesquisa.js";
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
          { path: "/pesquisas/nova", element: <NovaPesquisa /> },
          { path: "/pesquisas/:id", element: <DetalhePesquisa /> },
          { path: "/pesquisas/:id/responder", element: <ResponderPesquisa /> },
        ],
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
          { path: "/logs", element: <Logs /> },
        ],
      },
    ],
  },
]);
