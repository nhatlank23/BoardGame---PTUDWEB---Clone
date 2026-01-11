import { Outlet } from "react-router-dom";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

export function Layout({ isAdmin = false }) {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex">
        <Sidebar isAdmin={isAdmin} />
        <main className="flex-1 ml-64 mt-16 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
