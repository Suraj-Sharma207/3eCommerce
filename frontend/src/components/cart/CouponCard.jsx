import React, { useState } from "react";
import { Tag, CheckCircle2, AlertCircle } from "lucide-react";
import Button from "../ui/Button";

const CouponCard = ({ onApplyCoupon }) => {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("idle"); //'idle' |'loading' |'success' |'error'
  const [message, setMessage] = useState("");

  const handleApply = async () => {
    if (!code.trim()) return;
    setStatus("loading");
    setMessage("");
    // Simulate API call since no coupon API exists yet
    setTimeout(() => {
      if (code.toUpperCase() === "WELCOME10") {
        setStatus("success");
        setMessage("Coupon applied successfully!");
        if (onApplyCoupon) onApplyCoupon(10);
      } else {
        setStatus("error");
        setMessage("Invalid or expired referral code.");
      }
    }, 800);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-5 shadow-sm">
      <h3 className="font-bold text-[#1B2340] text-sm mb-4">
        Have a referral code?
      </h3>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
            <Tag className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (status !== "idle") {
                setStatus("idle");
                setMessage("");
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleApply();
            }}
            placeholder="Enter code"
            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2340] focus:border-[#1B2340] transition-colors placeholder:text-slate-400 uppercase placeholder:normal-case"
            disabled={status === "loading" || status === "success"}
          />
        </div>
        <Button
          variant="primary"
          onClick={handleApply}
          disabled={
            !code.trim() || status === "loading" || status === "success"
          }
          isLoading={status === "loading"}
          className="px-5 rounded-xl bg-[#1B2340] hover:bg-[#252f52] border-none text-white shrink-0"
        >
          Apply
        </Button>
      </div>

      {status === "success" && (
        <div className="flex items-center gap-2 mt-3 text-sm text-emerald-600">
          <CheckCircle2 className="w-4 h-4" />
          {message}
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-2 mt-3 text-sm text-red-500">
          <AlertCircle className="w-4 h-4" />
          {message}
        </div>
      )}
    </div>
  );
};

export default CouponCard;
