import React from "react";

const SkeletonLoader = ({ className = "", type = "rect", ...props }) => {
  const baseClass = "animate-pulse bg-slate-200";

  const types = {
    rect: "rounded-md",
    circle: "rounded-full",
    text: "rounded",
  };

  return (
    <div className={`${baseClass} ${types[type]} ${className}`} {...props} />
  );
};
export const ProductCardSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="aspect-[4/5] bg-slate-200 rounded-[22px] w-full" />
    <div className="h-4 bg-slate-200 rounded w-2/3" />
    <div className="h-4 bg-slate-200 rounded w-1/2" />
    <div className="h-8 bg-slate-200 rounded-full w-full" />
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-8 max-w-[1400px] mx-auto animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white rounded-2xl shadow-sm border border-border p-6 flex items-center gap-4"
        >
          <SkeletonLoader className="w-14 h-14 rounded-xl" />
          <div className="space-y-2 flex-1">
            <SkeletonLoader className="h-4 w-1/2" />
            <SkeletonLoader className="h-6 w-3/4" />
          </div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-border p-6 h-[380px]">
        <SkeletonLoader className="w-1/3 h-6 mb-6" />
        <SkeletonLoader className="w-full h-[280px] rounded-xl" />
      </div>
      <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-border p-6 h-[380px]">
        <SkeletonLoader className="w-1/2 h-6 mb-6" />
        <div className="flex justify-center items-center h-[280px]">
          <SkeletonLoader type="circle" className="w-48 h-48" />
        </div>
      </div>
    </div>
  </div>
);

export const PageSkeleton = () => (
  <div className="w-full min-h-[70vh] p-6 md:p-8 space-y-8 animate-pulse max-w-[1440px] mx-auto">
    <div className="flex justify-between items-center">
      <SkeletonLoader className="h-8 w-48 bg-slate-200" />
      <SkeletonLoader className="h-10 w-32 bg-slate-200" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 space-y-4">
        <SkeletonLoader className="h-32 w-full rounded-2xl bg-slate-200" />
        <SkeletonLoader className="h-48 w-full rounded-2xl bg-slate-200" />
      </div>
      <div className="md:col-span-2 space-y-6">
        <SkeletonLoader className="h-[200px] w-full rounded-2xl bg-slate-200" />
        <div className="grid grid-cols-2 gap-4">
          <SkeletonLoader className="h-28 w-full rounded-xl bg-slate-200" />
          <SkeletonLoader className="h-28 w-full rounded-xl bg-slate-200" />
        </div>
      </div>
    </div>
  </div>
);

export default SkeletonLoader;
