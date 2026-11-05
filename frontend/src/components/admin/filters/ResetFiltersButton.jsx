import React from "react";
import { RotateCcw } from "lucide-react";

const ResetFiltersButton = ({ onReset }) => {
  return (
    <button
      onClick={onReset}
      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-text-muted hover:text-text-primary bg-surface-background hover:bg-surface-hover rounded-lg border border-border transition-colors ml-auto"
      title="Reset Filters"
    >
      <RotateCcw className="w-4 h-4" />
      <span className="hidden sm:inline">Reset</span>
    </button>
  );
};

export default ResetFiltersButton;
