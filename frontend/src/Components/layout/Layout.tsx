import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar.js";
import { Topbar } from "./Topbar.js";

export function Layout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ flex: 1 }}>
        <Topbar />
        <div style={{ padding: 24 }}><Outlet /></div>
      </div>
    </div>
  );
}
