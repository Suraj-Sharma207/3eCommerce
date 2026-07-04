import React, { useState } from'react';
import { Outlet, Link, useLocation } from'react-router-dom';
import { useBrandingStore } from'../../store/brandingStore';
import { ShieldCheck, Sofa, Truck, HeadphonesIcon, Award, RefreshCcw, Star } from'lucide-react';
import { motion } from'framer-motion';

import AuthTransition from'./AuthTransition';

const features = [
 { icon: ShieldCheck, title:'Secure Checkout' },
 { icon: Sofa, title:'Premium Furniture' },
 { icon: Truck, title:'Fast Delivery' },
 { icon: HeadphonesIcon, title:'24×7 Support' },
 { icon: Award, title:'Best Quality' },
 { icon: RefreshCcw, title:'Easy Returns' },
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
 visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease:'easeOut' } },
};

const AuthLayout = () => {
 const [imageError, setImageError] = useState(false);
 const { branding } = useBrandingStore();
 const location = useLocation();
 const isRegister = location.pathname ==='/register';

 return (
 <div className="flex flex-col lg:flex-row w-full h-[100dvh] overflow-hidden bg-gradient-to-tr from-[#FAF9F6] to-[#F4F2EE] font-sans">

 {/* Left side - Form Area */}
 <div className={`flex-1 flex flex-col relative z-10 overflow-y-auto shrink-0 items-center justify-center p-6 md:p-8 ${isRegister ?'lg:w-[48%] xl:w-[45%]' :'lg:w-[42%] xl:w-[38%]'}`}>
 
 {/* Centered Logo above the card */}
 <div className="mb-8 flex flex-col items-center shrink-0">
 <Link to="/" className="text-3xl tracking-tight flex items-center justify-center">
 {branding?.logoUrl ? (
 <img src={branding.logoUrl} alt={branding?.platformName} className="h-16 md:h-[72px] w-auto object-contain" />
 ) : (
 <span className="font-serif italic text-[32px] text-[#0F2343]">{branding?.platformName ||'Priyal'}</span>
 )}
 </Link>
 </div>

 {/* Floating Card */}
 <div className={`w-full bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 p-8 md:p-10 flex flex-col relative animate-in fade-in slide-in-from-bottom-8 duration-500 ease-out ${isRegister ?'max-w-[720px] min-h-[700px]' :'max-w-[540px]'}`}>
 <AuthTransition />
 </div>

 </div>

 {/* Right side - Premium Hero Panel */}
 <div className="hidden lg:flex flex-col relative flex-1 overflow-hidden bg-[#0F2343]">
 
 {/* Background Image - Absolute positioned, full cover */}
 {!imageError && (
 <motion.div 
 initial={{ opacity: 0, scale: 1.05 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ duration: 1.2, ease:'easeOut' }}
 className="absolute inset-0 pointer-events-none"
 >
 <img
 className="absolute inset-0 h-full w-full object-cover object-right"
 src="/images/auth/auth-bg-premium.png"
 alt="Premium Living"
 onError={() => setImageError(true)}
 />
 {/* Subtle gradient overlay to ensure text readability on the left side */}
 <div className="absolute inset-0 bg-gradient-to-r from-[#0F2343]/70 via-[#1B3158]/30 to-transparent" />
 <div className="absolute inset-0 bg-black/10" />
 </motion.div>
 )}

 <div className="relative z-10 flex flex-col h-full justify-center p-12 xl:p-20">
 
 <motion.div 
 variants={containerVariants}
 initial="hidden"
 animate="visible"
 className="max-w-xl w-full"
 >
 <motion.h2 
 variants={itemVariants}
 className="text-[48px] xl:text-[64px] font-[800] leading-[110%] tracking-tight text-white mb-6"
 style={{ fontFamily:"'Plus Jakarta Sans', sans-serif" }}
 >
 Elevate Your Living,<br />
 <span className="text-[#F2B84B]">Every Single Day.</span>
 </motion.h2>

 <motion.p 
 variants={itemVariants}
 className="text-[18px] text-[#D8E2F1] leading-relaxed mb-12 max-w-md"
 >
 Premium home furniture and appliances designed to bring comfort, style, and innovation to your home.
 </motion.p>

 {/* Feature Cards Grid */}
 <motion.div 
 variants={containerVariants}
 className="grid grid-cols-2 gap-4 max-w-[500px]"
 >
 {features.map((feature, i) => {
 const Icon = feature.icon;
 return (
 <motion.div 
 key={i} 
 variants={itemVariants}
 whileHover={{ y: -4, backgroundColor:'rgba(255,255,255,0.12)', borderColor:'rgba(255,255,255,0.2)' }}
 className="flex items-center gap-4 bg-white/[0.08] backdrop-blur-md border border-white/[0.12] rounded-2xl p-4 transition-all duration-300 shadow-sm hover:shadow-lg cursor-default"
 >
 <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
 <Icon className="w-5 h-5 text-[#F2B84B]" />
 </div>
 <span className="text-sm text-white tracking-wide">{feature.title}</span>
 </motion.div>
 );
 })}
 </motion.div>
 </motion.div>

 {/* Trust Badge - Absolute Bottom */}
 <motion.div 
 initial={{ opacity: 0, y: 30 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 1, duration: 0.6, ease:"easeOut" }}
 className="absolute bottom-12 xl:bottom-16 w-fit flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-full shadow-xl"
 >
 <div className="flex items-center justify-center rounded-full shrink-0">
 <ShieldCheck className="w-5 h-5 text-[#F2B84B]" />
 </div>
 <span className="text-white text-sm">Trusted by 10,000+ Happy Customers</span>
 <div className="flex items-center ml-2 space-x-1">
 {[...Array(5)].map((_, idx) => (
 <Star key={idx} className="w-4 h-4 text-[#F2B84B] fill-[#F2B84B]" />
 ))}
 </div>
 </motion.div>

 </div>
 </div>

 </div>
 );
};

export default AuthLayout;
