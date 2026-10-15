import { useEffect } from "react";
import CustomerLoginForm from "./CustomerLoginForm";

// Login pop-up (bottom sheet on phones, dialog on larger screens) shown when booking / ordering needs a login.
export default function CustomerLoginSheet({ reason, onDone, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="cls-title">
      <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white w-full md:max-w-md rounded-t-[24px] md:rounded-2xl shadow-2xl p-6 md:p-8 max-h-[92vh] overflow-y-auto">
        <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">✕</button>
        <h2 id="cls-title" className="font-serif text-2xl text-[#1F3B2D]">Login or sign up</h2>
        <p className="text-sm text-gray-500 mt-1 mb-5">{reason || "Log in to book rooms, order food and track them live."}</p>
        <CustomerLoginForm onDone={onDone} />
      </div>
    </div>
  );
}
