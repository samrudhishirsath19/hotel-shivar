import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCustomer } from "../context/CustomerContext";
import { digits10, cleanName, isFullName, NAME_ERROR, NAME_MAX } from "../roles";

const inputCls = "w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#1F3B2D] outline-none";

// The 6-digit OTP: one field (works with typing, paste and SMS autofill), shown as spaced digits
function OtpInput({ value, onChange, disabled }) {
  return (
    <input value={value} disabled={disabled} autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6}
      aria-label="6-digit OTP" placeholder="••••••"
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
      className="w-full border rounded-xl px-4 py-3 text-center text-2xl font-bold font-mono tracking-[0.6em] focus:ring-2 focus:ring-[#1F3B2D] outline-none" />
  );
}

/**
 * Customer login like Swiggy / Zomato: mobile number -> OTP. A new number also gives a name and email
 * (that creates the account). "Use password instead" for accounts that have one.
 */
export default function CustomerLoginForm({ onDone }) {
  const { sendOtp, verifyOtp, login } = useCustomer();
  const [step, setStep] = useState("phone"); // phone | otp | password
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newUser, setNewUser] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [wait, setWait] = useState(0);
  const [pw, setPw] = useState({ login: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // resend countdown
  useEffect(() => {
    if (wait <= 0) return undefined;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const phoneOk = /^[6-9]\d{9}$/.test(phone);

  const send = async (e) => {
    e?.preventDefault();
    setError("");
    if (!phoneOk) { setError("Enter a valid 10-digit mobile number"); return; }
    setBusy(true);
    try {
      const r = await sendOtp(phone);
      setNewUser(!!r.newUser);
      setDemoOtp(r.demoOtp || "");
      setWait(r.resendIn || 30);
      setOtp("");
      setStep("otp");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e) => {
    e?.preventDefault();
    setError("");
    if (otp.length !== 6) { setError("Enter the 6-digit OTP"); return; }
    if (newUser) {
      if (!isFullName(name)) { setError(NAME_ERROR); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Enter a valid email"); return; }
    }
    setBusy(true);
    try {
      await verifyOtp({ phone, otp, ...(newUser ? { name: cleanName(name), email: email.trim() } : {}) });
      onDone?.();
    } catch (err) {
      setError(err.message);
      if (/expired|new OTP/i.test(err.message)) setOtp("");
    } finally {
      setBusy(false);
    }
  };

  const passwordLogin = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(pw.login.trim(), pw.password);
      onDone?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {error && <p role="alert" className="mb-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">{error}</p>}

      {step === "phone" && (
        <form onSubmit={send} className="space-y-3">
          <label className="text-sm font-medium" htmlFor="cl-phone">Mobile number</label>
          <div className="flex items-center border rounded-xl focus-within:ring-2 focus-within:ring-[#1F3B2D]">
            <span className="pl-4 pr-2 text-sm text-gray-500 border-r">+91</span>
            <input id="cl-phone" value={phone} onChange={(e) => setPhone(digits10(e.target.value))} inputMode="numeric" autoComplete="tel-national"
              autoFocus placeholder="10-digit mobile number" className="flex-1 px-3 py-3 text-sm outline-none rounded-r-xl" />
          </div>
          <button disabled={busy || !phoneOk} className="w-full bg-[#1F3B2D] text-white font-semibold py-3.5 rounded-xl hover:bg-black disabled:opacity-50">
            {busy ? "Sending OTP..." : "Continue"}
          </button>
          <p className="text-xs text-gray-500 text-center">We'll send a 6-digit OTP to verify your number.</p>
          <button type="button" onClick={() => { setStep("password"); setError(""); }} className="w-full text-xs text-[#B8893C] font-semibold">
            Use email & password instead
          </button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={verify} className="space-y-3">
          <p className="text-sm text-gray-700">
            Enter the OTP sent to <b>+91 {phone}</b>{" "}
            <button type="button" onClick={() => { setStep("phone"); setError(""); }} className="text-[#B8893C] font-semibold text-xs">Change</button>
          </p>
          {demoOtp && (
            <p className="text-xs bg-amber-50 border border-amber-200 text-amber-900 rounded-lg px-3 py-2">
              Demo mode (no SMS gateway yet): your OTP is <b className="font-mono tracking-widest">{demoOtp}</b>
            </p>
          )}
          <OtpInput value={otp} onChange={setOtp} disabled={busy} />
          {newUser && (
            <div className="space-y-2 pt-1">
              <p className="text-xs text-gray-500">New here? Tell us a little about you to create your account.</p>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={NAME_MAX} autoComplete="name"
                aria-label="Full name" placeholder="Full name" className={inputCls} />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email"
                aria-label="Email" placeholder="Email" className={inputCls} />
            </div>
          )}
          <button disabled={busy || otp.length !== 6} className="w-full bg-[#1F3B2D] text-white font-semibold py-3.5 rounded-xl hover:bg-black disabled:opacity-50">
            {busy ? "Verifying..." : newUser ? "Verify & create account" : "Verify & continue"}
          </button>
          <p className="text-xs text-center text-gray-500">
            Didn't get it?{" "}
            {wait > 0 ? <span>Resend in {wait}s</span> : <button type="button" onClick={send} className="text-[#B8893C] font-semibold">Resend OTP</button>}
          </p>
        </form>
      )}

      {step === "password" && (
        <form onSubmit={passwordLogin} className="space-y-3">
          <input value={pw.login} onChange={(e) => setPw({ ...pw, login: e.target.value })} autoComplete="username"
            aria-label="Email or mobile number" placeholder="Email or mobile number" className={inputCls} />
          <input type="password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} autoComplete="current-password"
            aria-label="Password" placeholder="Password" className={inputCls} />
          <button disabled={busy} className="w-full bg-[#1F3B2D] text-white font-semibold py-3.5 rounded-xl hover:bg-black disabled:opacity-50">
            {busy ? "Please wait..." : "Log in"}
          </button>
          <Link to="/reset-password" onClick={() => onDone?.()} className="block text-center text-xs text-gray-500 underline">
            Forgot password?
          </Link>
          <button type="button" onClick={() => { setStep("phone"); setError(""); }} className="w-full text-xs text-[#B8893C] font-semibold">
            Log in with mobile OTP instead
          </button>
        </form>
      )}

      <p className="text-[11px] text-gray-400 text-center mt-4">By continuing you agree to Hotel Shivar's terms and privacy policy.</p>
    </div>
  );
}
