import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../api";
import { useAuth } from "../../context/AuthContext";

// Live order board (tables, room service, online orders). Refreshes every few seconds.
export default function useBoard(intervalMs = 8000, enabled = true) {
  const { logout } = useAuth();
  const [board, setBoard] = useState(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    try {
      setBoard(await apiFetch("/api/admin/orders/board"));
      setError("");
    } catch (e) {
      if (e.status === 401) logout();
      else setError(e.message);
    }
  }, [logout]);

  useEffect(() => {
    if (!enabled) return undefined;
    load();
    const t = setInterval(load, intervalMs);
    return () => clearInterval(t);
  }, [load, intervalMs, enabled]);

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(""), 3500); };

  // run(orderId, "accept" | "ready" | "send-to-billing" | "paid" | "cancel", message shown on success, body?) -> true if it worked
  const run = async (id, action, okText, body) => {
    try {
      await apiFetch(`/api/admin/orders/${id}/${action}`, { method: "POST", ...(body ? { body: JSON.stringify(body) } : {}) });
      flash(okText);
      await load();
      return true;
    } catch (e) {
      flash("⚠️ " + e.message);
      return false;
    }
  };

  return { board, error, msg, run, reload: load };
}
