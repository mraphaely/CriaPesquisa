import { createBrowserRouter } from "react-router-dom";
import { Layout } from "../Components/layout/Layout.js";
import { ProtectedRoute } from "./auth/ProtectedRoute.js";
import { Login } from "./pages/Login.js";
import { Dashboard } from "./pages/Dashboard.js";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    element: <ProtectedRoute />,
    children: [
      { element: <Layout />, children: [{ path: "/", element: <Dashboard /> }] },
    ],
  },
]);
