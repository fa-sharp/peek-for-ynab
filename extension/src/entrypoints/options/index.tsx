import React from "react";
import ReactDOM from "react-dom/client";

import "~/styles/global.css";
import "~/styles/main.scss";

import Options from "./options";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>
);
