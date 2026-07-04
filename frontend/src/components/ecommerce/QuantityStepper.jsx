import React, { useCallback, memo, useState, useEffect, useRef } from'react';
import { Minus, Plus } from'lucide-react';
import { motion, AnimatePresence } from'framer-motion';

const QuantityStepper = memo(({ 
 quantity, 
 setQuantity, 
 min = 1, 
 max = 99, 
 disabled = false,
 className ='' 
}) => {
 const [internalQ, setInternalQ] = useState(quantity);
 const externalQ = useRef(quantity);

 // Sync internal state with external quantity only if external quantity explicitly changes from elsewhere (e.g. server sync)
 useEffect(() => {
 if (externalQ.current !== quantity) {
 setInternalQ(quantity);
 externalQ.current = quantity;
 }
 }, [quantity]);

 const handleDecrease = useCallback((e) => {
 if (e) e.preventDefault();
 setInternalQ((prev) => {
 const next = Math.max(min, prev - 1);
 if (next !== prev) {
 externalQ.current = next;
 setQuantity(next);
 }
 return next;
 });
 }, [min, setQuantity]);

 const handleIncrease = useCallback((e) => {
 if (e) e.preventDefault();
 setInternalQ((prev) => {
 const next = Math.min(max, prev + 1);
 if (next !== prev) {
 externalQ.current = next;
 setQuantity(next);
 }
 return next;
 });
 }, [max, setQuantity]);

 const handleKeyDown = useCallback((e) => {
 if (e.key ==='ArrowLeft' || e.key ==='ArrowDown') {
 e.preventDefault();
 handleDecrease();
 } else if (e.key ==='ArrowRight' || e.key ==='ArrowUp') {
 e.preventDefault();
 handleIncrease();
 }
 }, [handleDecrease, handleIncrease]);

 return (
 <div 
 className={`inline-flex items-center justify-between bg-white border border-border rounded-full p-1 shadow-sm h-12 min-w-[120px] transition-shadow ${disabled ?'opacity-50 cursor-not-allowed pointer-events-none' :'hover:shadow'} ${className}`}
 onKeyDown={disabled ? undefined : handleKeyDown}
 tabIndex={disabled ? -1 : 0}
 role="spinbutton"
 aria-valuenow={quantity}
 aria-valuemin={min}
 aria-valuemax={max}
 aria-label="Quantity"
 aria-disabled={disabled}
 >
 <motion.button
 type="button"
 onClick={handleDecrease}
 disabled={disabled || internalQ <= min}
 whileTap={{ scale: (disabled || internalQ <= min) ? 1 : 0.9 }}
 className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-50 text-brand-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 shrink-0"
 aria-label="Decrease quantity"
 >
 <Minus className="w-4 h-4" strokeWidth={2.5} />
 </motion.button>

 <div className="flex-1 flex justify-center items-center overflow-hidden min-w-[32px] select-none">
 <AnimatePresence mode="popLayout" initial={false}>
 <motion.span
 key={internalQ}
 initial={{ y: -20, opacity: 0 }}
 animate={{ y: 0, opacity: 1 }}
 exit={{ y: 20, opacity: 0 }}
 transition={{ type:"spring", stiffness: 300, damping: 25 }}
 className={`text-lg font-bold ${disabled ?'text-text-muted' :'text-text-primary'} tabular-nums`}
 >
 {internalQ}
 </motion.span>
 </AnimatePresence>
 </div>

 <motion.button
 type="button"
 onClick={handleIncrease}
 disabled={disabled || internalQ >= max}
 whileTap={{ scale: (disabled || internalQ >= max) ? 1 : 0.9 }}
 className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-50 text-brand-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 shrink-0"
 aria-label="Increase quantity"
 >
 <Plus className="w-4 h-4" strokeWidth={2.5} />
 </motion.button>
 </div>
 );
});

QuantityStepper.displayName ='QuantityStepper';

export default QuantityStepper;
