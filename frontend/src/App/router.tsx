import { createBrowserRouter } from "react-router-dom";
import { Layout } from "../Components/layout/Layout.js";
import { ProtectedRoute } from "./auth/ProtectedRoute.js";
import { Login } from "./pages/Login.js";
import { Dashboard } from "./pages/Dashboard.js";
import { Pesquisas } from "./pages/Pesquisas.js";
import { Usuarios } from "./pages/Usuarios.js";
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
          { path: "/logs", element: <Logs /> },
        ],
      },
    ],
  },
]);
