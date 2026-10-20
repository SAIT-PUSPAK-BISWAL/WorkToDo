
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import API from "../services/api";

export default function ProtectedRoute({ children, onAuthenticated }) {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let cancelled = false;

    API.get("/auth/me")
      .then(({ data }) => {
        if (cancelled) return;
        onAuthenticated?.(data);
        setStatus("authenticated");
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem("token");
          localStorage.removeItem("username");
          localStorage.removeItem("userId");
          setStatus("unauthenticated");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [onAuthenticated]);

  if (status === "checking") {
    return (
      <main className="auth-checking" aria-live="polite">
        Checking your session…
      </main>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  return children;
}
