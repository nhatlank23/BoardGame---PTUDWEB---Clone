import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import App from "./App";
import "./app/globals.css";
import { Toaster } from "@/components/ui/toaster";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider defaultTheme="dark">
        <App />
        <Toaster />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);

