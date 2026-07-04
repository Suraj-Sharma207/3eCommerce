import React from'react';
import HomeSection from'../../../components/layout/HomeSection';

const Stats = () => {
 const stats = [
 { number:"50K+", label:"Happy Customers" },
 { number:"10+", label:"Years Experience" },
 { number:"100%", label:"Quality Guarantee" },
 { number:"24/7", label:"Customer Support" }
 ];

 return (
 <div className="bg-brand-600 py-16">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/20">
 {stats.map((stat, index) => (
 <div key={index} className="text-center px-4">
 <div className="text-4xl md:text-5xl text-white mb-2">{stat.number}</div>
 <div className="text-brand-100">{stat.label}</div>
 </div>
 ))}
 </div>
 </div>
 </div>
 );
};

export default Stats;
