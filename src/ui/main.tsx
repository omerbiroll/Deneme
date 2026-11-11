import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/alegreya/500.css";
import "@fontsource/alegreya/700.css";
import "@fontsource/alegreya/500-italic.css";
import "@fontsource/alegreya-sans/400.css";
import "@fontsource/alegreya-sans/500.css";
import "@fontsource/alegreya-sans/700.css";
import "./stil.css";
import { App } from "./App";

createRoot(document.getElementById("kok")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
