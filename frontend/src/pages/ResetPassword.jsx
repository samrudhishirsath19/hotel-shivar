import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiFetch } from "../api";

const inputCls = "w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#1F3B2D] outline-none";
const btnCls = "w-full bg-[#1F3B2D] text-white font-semibold py-3.5 rounded-xl hover:bg-black disabled:opacity-50";

// Two new-password boxes (must match, at least 8 characters)
function NewPassword({ value, onChange }) {
  return (
    <>
      <input type="password" value={value.pw} onChange={(e) => onChange({ ...value, pw: e.target.value })} autoComplete="new-password"
        aria-label="New password" placeholder="New password (at least 8 characters)" className={inputCls} />
      <input type="password" value={value.again} onChange={(e) => onChange({ ...value, again: e.target.value })} autoComplete="new-password"
        aria-label="Repeat new password" placeholder="Repeat new password" className={inputCls} />
    </>
  );
}
const pwProblem = (v) => (v.pw.length < 8 ? "Password must be at least 8 characters" : v.pw !== v.again ? "The two passwords are not the same" : "");

/**
 * Customer forgot password. Without ?token: email -> 6-digit code from the email + new password.
 * With ?token= (the link in the email): just the new password.
 */
export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [step, setStep] = useState(token ? "checking" : "email"); // email | otp | link | invalid | done
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [pw, setPw] = useState({ pw: "", again: "" });
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiFetch("/api/customer/password/reset-link/check", { method: "POST", body: JSON.stringify({ token }) })
      .then((r) => setStep(r.valid ? "link" : "invalid"))
      .catch(() => setStep("invalid"));
  }, [token]);

  const run = async (fn) => {
    setError("");
    setBusy(true);
    try { await fn(); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const ask = (e) => {
    e?.preventDefault();
    run(async () => {
      const r = await apiFetch("/api/customer/password/forgot", { method: "POST", body: JSON.stringify({ email: email.trim() }) });
      setInfo(r.message);
      setOtp("");
      setStep("otp");
    });
  };

  const withOtp = (e) => {
    e.preventDefault();
    const p = pwProblem(pw);
    if (p) { setError(p); return; }
    run(async () => {
      await apiFetch("/api/customer/password/reset", { method: "POST", body: JSON.stringify({ email: email.trim(), otp, newPassword: pw.pw }) });
      setStep("done");
    });
  };

  const withLink = (e) => {
    e.preventDefault();
    const p = pwProblem(pw);
    if (p) { setError(p); return; }
    run(async () => {
      await apiFetch("/api/customer/password/reset-link", { method: "POST", body: JSON.stringify({ token, newPassword: pw.pw }) });
      setStep("done");
    });
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-28 pb-16">
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h1 className="font-serif text-2xl text-[#1F3B2D] mb-1">Reset your password</h1>
        <p className="text-sm text-gray-500 mb-5">For your Hotel Shivar guest account.</p>
        {error && <p role="alert" className="mb-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">{error}</p>}

        {step === "checking" && <p className="text-sm text-gray-500">Checking your link...</p>}

        {step === "email" && (
          <form onSubmit={ask} className="space-y-3">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoFocus
              aria-label="Email" placeholder="Email of your account" className={inputCls} />
            <button disabled={busy || !email.trim()} className={btnCls}>{busy ? "Sending..." : "Email me a reset code"}</button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={withOtp} className="space-y-3">
            <p className="text-sm bg-green-50 border border-green-200 text-green-800 rounded-lg px-3 py-2">{info}</p>
            <p className="text-xs text-gray-500">The code is valid for 10 minutes. You can also just tap the link in the email.</p>
            <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code"
              aria-label="6-digit code" placeholder="••••••"
              className="w-full border rounded-xl px-4 py-3 text-center text-2xl font-bold font-mono tracking-[0.6em] focus:ring-2 focus:ring-[#1F3B2D] outline-none" />
            <NewPassword value={pw} onChange={setPw} />
            <button disabled={busy || otp.length !== 6} className={btnCls}>{busy ? "Please wait..." : "Change password"}</button>
            <button type="button" onClick={ask} disabled={busy} className="w-full text-xs text-[#B8893C] font-semibold">Send a new code</button>
          </form>
        )}

        {step === "link" && (
          <form onSubmit={withLink} className="space-y-3">
            <NewPassword value={pw} onChange={setPw} />
            <button disabled={busy} className={btnCls}>{busy ? "Please wait..." : "Change password"}</button>
          </form>
        )}

        {step === "invalid" && (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">This reset link is not valid any more - it was already used, a newer email was sent, or it expired.</p>
            <Link to="/reset-password" className="block text-center bg-[#1F3B2D] text-white font-semibold py-3 rounded-xl">Ask for a new one</Link>
          </div>
        )}

        {step === "done" && (
          <div className="space-y-3">
            <p className="text-sm bg-green-50 border border-green-200 text-green-800 rounded-lg px-3 py-2">✅ Password changed. You can now log in with your new password.</p>
            <Link to="/account" className="block text-center bg-[#1F3B2D] text-white font-semibold py-3 rounded-xl">Log in</Link>
          </div>
        )}
      </div>
    </div>
  );
}
