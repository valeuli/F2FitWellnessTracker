import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import faviconImage from "@/assets/FaviconF2Fit.png";
import "./styles.css";

document.title = "F2Fit | Bienestar integral";

const faviconId = "f2fit-favicon";
const existingFavicon = document.getElementById(faviconId) as HTMLLinkElement | null;

if (existingFavicon) {
  existingFavicon.href = faviconImage;
} else {
  const favicon = document.createElement("link");
  favicon.id = faviconId;
  favicon.rel = "icon";
  favicon.type = "image/png";
  favicon.href = faviconImage;
  document.head.appendChild(favicon);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
