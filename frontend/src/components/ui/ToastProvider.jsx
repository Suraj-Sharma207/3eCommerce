import React from "react";
import { Toaster, resolveValue } from "react-hot-toast";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Loader2,
} from "lucide-react";

const ToastProvider = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        className:
          "!p-0 !bg-transparent !shadow-none !rounded-none !max-w-none",
        success: { duration: 3500 },
        error: { duration: 4500 },
        loading: { duration: Infinity },
      }}
    >
      {(t) => {
        const isMobile =
          typeof window !== "undefined" && window.innerWidth < 640;

        let Icon = Info;
        let iconColor = "text-blue-600";
        let iconBg = "bg-blue-100";

        if (t.type === "success") {
          Icon = CheckCircle2;
          iconColor = "text-emerald-600";
          iconBg = "bg-emerald-100";
        } else if (t.type === "error") {
          Icon = XCircle;
          iconColor = "text-red-600";
          iconBg = "bg-red-100";
        } else if (t.type === "loading") {
          Icon = Loader2;
          iconColor = "text-blue-600";
          iconBg = "bg-blue-100";
        } else if (t.icon === "⚠️" || t.type === "warning") {
          Icon = AlertTriangle;
          iconColor = "text-amber-600";
          iconBg = "bg-amber-100";
        }

        return (
          <div
            className={`
 flex items-center gap-3 p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100/50 
 bg-white/95 backdrop-blur-md pointer-events-auto
 transition-all duration-300 ease-out
 ${t.visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 scale-95 translate-y-2"}
 ${isMobile ? "w-[calc(100vw-32px)] sm:w-auto mt-4" : "min-w-[300px] max-w-md"}
`}
          >
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}
            >
              <Icon
                className={`w-5 h-5 ${iconColor} ${t.type === "loading" ? "animate-spin" : ""}`}
              />
            </div>
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-sm text-slate-800 leading-snug break-words">
                {resolveValue(t.message, t)}
              </p>
            </div>
          </div>
        );
      }}
    </Toaster>
  );
};

export default ToastProvider;
