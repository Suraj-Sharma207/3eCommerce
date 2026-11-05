import { useEffect, useRef } from "react";

const useIntersectionObserver = (targetRef, callback, options = {}) => {
  const observerRef = useRef(null);

  useEffect(() => {
    const target = targetRef?.current;
    if (!target) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new IntersectionObserver((entries) => {
      // Typically only one entry for a single target
      const [entry] = entries;
      callback(entry);
    }, options);

    observer.observe(target);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [targetRef, callback, options.rootMargin, options.threshold]);

  return observerRef.current;
};

export default useIntersectionObserver;
