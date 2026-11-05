import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const UndoSnackbar = ({ item, onUndo, onConfirmRemoval }) => {
  const [timeLeft, setTimeLeft] = useState(5);

  useEffect(() => {
    if (!item) return;

    setTimeLeft(5);

    const timerInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          onConfirmRemoval(item);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [item, onConfirmRemoval]);

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-6 min-w-[320px] max-w-md w-[90%]"
        >
          <div className="flex-1 flex flex-col gap-1">
            <span className="text-sm line-clamp-1">
              Removed {item.product?.name || "Item"}
            </span>
            <span className="text-xs text-gray-400">
              Permanently deleting in {timeLeft}s...
            </span>
          </div>

          <button
            onClick={() => onUndo(item)}
            className="text-brand-400 font-bold text-sm uppercase tracking-wider hover:text-brand-300 transition-colors"
          >
            Undo
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UndoSnackbar;
