import React, { useEffect } from "react";
import LoadingSpinner from "./LoadingSpinner";

const TableLoadingOverlay = ({ text = "Loading...", isLoading = false }) => {
  useEffect(() => {
    if (!isLoading) return;

    const handleKeyDown = (e) => {
      // Prevent scrolling keys: Space, PageUp, PageDown, End, Home, Arrows
      if (
        [
          "Space",
          "PageUp",
          "PageDown",
          "End",
          "Home",
          "ArrowUp",
          "ArrowDown",
        ].includes(e.code)
      ) {
        e.preventDefault();
      }
    };

    // Attach to window to block any keyboard scrolling while loading
    window.addEventListener("keydown", handleKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div
      className="absolute inset-0 z-50 bg-white/95 flex flex-col items-center justify-center cursor-wait"
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{ touchAction: "none" }}
    >
      <LoadingSpinner size="lg" />
      {text && (
        <p className="mt-4 text-text-muted text-sm font-medium">{text}</p>
      )}
    </div>
  );
};

export default TableLoadingOverlay;
