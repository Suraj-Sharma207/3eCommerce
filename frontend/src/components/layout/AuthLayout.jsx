import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useBrandingStore } from "../../store/brandingStore";
import {
  ShieldCheck,
  Sofa,
  Truck,
  HeadphonesIcon,
  Award,
  RefreshCcw,
  Star,
} from "lucide-react";
import { motion } from "framer-motion";

import AuthTransition from "./AuthTransition";

const features = [
  { icon: ShieldCheck, title: "Secure Checkout" },
  { icon: Sofa, title: "Premium Furniture" },
  { icon: Truck, title: "Fast Delivery" },
  { icon: HeadphonesIcon, title: "24×7 Support" },
  { icon: Award, title: "Best Quality" },
  { icon: RefreshCcw, title: "Easy Returns" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const AuthLayout = () => {
  const [imageError, setImageError] = useState(false);
  const { branding } = useBrandingStore();
  const location = useLocation();
  const isRegister = location.pathname === "/register";

  return (
    <div className="min-h-screen min-h-[100dvh] w-full flex flex-col lg:flex-row bg-gradient-to-tr from-[#FAF9F6] to-[#F4F2EE] font-sans lg:h-screen lg:overflow-hidden">
      {/* Left side - Form Area (50% on desktop) */}
      <div className="w-full lg:w-1/2 flex flex-col relative z-10 overflow-y-auto px-4 py-8 sm:px-6 md:px-8 lg:px-10 lg:py-6 lg:h-full shrink-0">
        <div className="w-full my-auto flex flex-col items-center">
          {/* Centered Logo above the card */}
          <div className="mb-4 sm:mb-6 flex flex-col items-center shrink-0">
            <Link
              to="/"
              className="tracking-tight flex items-center justify-center transition-transform hover:scale-105 duration-200"
            >
              {branding?.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt={branding?.platformName || "Logo"}
                  className="h-10 sm:h-12 md:h-14 w-auto object-contain"
                />
              ) : (
                <span className="font-serif italic text-2xl sm:text-3xl text-[#0F2343]">
                  {branding?.platformName || "Priyal"}
                </span>
              )}
            </Link>
          </div>

          {/* Floating Card */}
          <div
            className={`w-full bg-white rounded-[20px] sm:rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-gray-100/80 p-5 sm:p-8 md:p-9 flex flex-col relative animate-in fade-in slide-in-from-bottom-6 duration-500 ease-out ${
              isRegister
                ? "max-w-[580px] xl:max-w-[620px]"
                : "max-w-[460px] sm:max-w-[480px]"
            }`}
          >
            <AuthTransition />
          </div>
        </div>
      </div>

      {/* Right side - Premium Hero Panel (50% on desktop) */}
      <div className="hidden lg:flex flex-col relative lg:w-1/2 h-full overflow-hidden bg-[#0F2343]">
        {/* Background Image - Absolute positioned, full cover */}
        {!imageError && (
          <motion.div
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute inset-0 pointer-events-none"
          >
            <img
              className="absolute inset-0 h-full w-full object-cover object-right"
              src="/images/auth/auth-bg-premium.png"
              alt="Premium Living"
              onError={() => setImageError(true)}
            />
            {/* Subtle gradient overlay to ensure text readability on the left side */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0F2343]/85 via-[#1B3158]/50 to-[#0F2343]/30" />
            <div className="absolute inset-0 bg-black/15" />
          </motion.div>
        )}

        <div className="relative z-10 flex flex-col h-full justify-between p-8 xl:p-14 2xl:p-16 overflow-y-auto">
          <div className="my-auto max-w-lg w-full">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.h2
                variants={itemVariants}
                className="text-3xl xl:text-[44px] 2xl:text-[52px] font-extrabold leading-[1.12] tracking-tight text-white mb-3 xl:mb-5"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Elevate Your Living,
                <br />
                <span className="text-[#F2B84B]">Every Single Day.</span>
              </motion.h2>

              <motion.p
                variants={itemVariants}
                className="text-sm xl:text-base 2xl:text-[17px] text-[#D8E2F1] leading-relaxed mb-6 xl:mb-8 max-w-md"
              >
                Premium home furniture and appliances designed to bring comfort,
                style, and innovation to your home.
              </motion.p>

              {/* Feature Cards Grid */}
              <motion.div
                variants={containerVariants}
                className="grid grid-cols-2 gap-2.5 xl:gap-3.5 max-w-[480px]"
              >
                {features.map((feature, i) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={i}
                      variants={itemVariants}
                      whileHover={{
                        y: -3,
                        backgroundColor: "rgba(255,255,255,0.14)",
                        borderColor: "rgba(255,255,255,0.25)",
                      }}
                      className="flex items-center gap-3 bg-white/[0.08] backdrop-blur-md border border-white/[0.12] rounded-xl p-3 xl:p-3.5 transition-all duration-300 shadow-sm cursor-default"
                    >
                      <div className="w-8 h-8 xl:w-9 xl:h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-[#F2B84B]" />
                      </div>
                      <span className="text-xs xl:text-sm text-white tracking-wide font-medium">
                        {feature.title}
                      </span>
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>
          </div>

          {/* Trust Badge - Flowing at bottom, no overlap */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
            className="mt-6 shrink-0 w-fit flex flex-wrap items-center gap-2.5 sm:gap-3 bg-white/10 backdrop-blur-md border border-white/20 px-4 sm:px-5 py-2.5 rounded-full shadow-lg"
          >
            <div className="flex items-center justify-center rounded-full shrink-0">
              <ShieldCheck className="w-4 h-4 text-[#F2B84B]" />
            </div>
            <span className="text-white text-xs sm:text-sm font-medium">
              Trusted by 10,000+ Happy Customers
            </span>
            <div className="flex items-center ml-1 space-x-0.5">
              {[...Array(5)].map((_, idx) => (
                <Star
                  key={idx}
                  className="w-3.5 h-3.5 text-[#F2B84B] fill-[#F2B84B]"
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
