import { Outlet } from "react-router-dom";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { Footer } from "./footer";

export function Layout({ isAdmin = false }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-1 flex pt-16">
        <Sidebar isAdmin={isAdmin} />
        <main className="flex-1 p-4 ml-64">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
}
