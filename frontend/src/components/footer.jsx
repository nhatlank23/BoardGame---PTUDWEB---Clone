import React from "react";
import { Link } from "react-router-dom";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="ml-64 border-t bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold">Board Game</span>
          <span className="text-sm text-muted-foreground">— Play classic board games online</span>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <Link to="#" className="hover:underline">About</Link>
          <Link to="#" className="hover:underline">Privacy</Link>
          <Link to="#" className="hover:underline">Contact</Link>
          <span className="text-muted-foreground">© {year} Board Game</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
