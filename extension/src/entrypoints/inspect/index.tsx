import React from "react";
import ReactDOM from "react-dom/client";

import Devtools from "./devtools";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Devtools />
  </React.StrictMode>
);
