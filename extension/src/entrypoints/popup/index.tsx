import React from "react";
import ReactDOM from "react-dom/client";

import "~/styles/global.css";
import "~/styles/main.scss";

import Popup from "./popup";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
