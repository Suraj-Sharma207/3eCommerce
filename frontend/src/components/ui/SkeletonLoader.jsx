import React from 'react';

const SkeletonLoader = ({ className = '', type = 'rect', ...props }) => {
  const baseClass = 'animate-pulse bg-slate-200';
  
  const types = {
    rect: 'rounded-md',
    circle: 'rounded-full',
    text: 'rounded',
  };

  return (
    <div 
      className={`${baseClass} ${types[type]} ${className}`} 
      {...props} 
    />
  );
};
export const ProductCardSkeleton = () => (
  <div className="space-y-4 animate-pulse font-normal">
    <div className="aspect-[4/5] bg-slate-200 rounded-[22px] w-full font-normal" />
    <div className="h-4 bg-slate-200 rounded w-2/3 font-normal" />
    <div className="h-4 bg-slate-200 rounded w-1/2 font-normal" />
    <div className="h-8 bg-slate-200 rounded-full w-full font-normal" />
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-8 max-w-[1400px] mx-auto animate-pulse font-normal">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-normal">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white rounded-2xl shadow-sm border border-border p-6 flex items-center gap-4 font-normal">
          <SkeletonLoader className="w-14 h-14 rounded-xl font-normal" />
          <div className="space-y-2 flex-1 font-normal">
            <SkeletonLoader className="h-4 w-1/2 font-normal" />
            <SkeletonLoader className="h-6 w-3/4 font-normal" />
          </div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 font-normal">
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-border p-6 h-[380px] font-normal">
        <SkeletonLoader className="w-1/3 h-6 mb-6 font-normal" />
        <SkeletonLoader className="w-full h-[280px] rounded-xl font-normal" />
      </div>
      <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-border p-6 h-[380px] font-normal">
        <SkeletonLoader className="w-1/2 h-6 mb-6 font-normal" />
        <div className="flex justify-center items-center h-[280px] font-normal">
          <SkeletonLoader type="circle" className="w-48 h-48 font-normal" />
        </div>
      </div>
    </div>
  </div>
);

export default SkeletonLoader;
