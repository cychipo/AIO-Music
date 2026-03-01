import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider } from "antd";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import antdThemeConfig from "./lib/antdThemeConfig";
import { useAuthStore } from "./store/authStore";
import "./styles/globals.css";

// Nếu có token trong store → validate với server ngay khi app khởi động
const { token, fetchMe } = useAuthStore.getState();
if (token) {
  fetchMe();
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider theme={antdThemeConfig}>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>,
);
