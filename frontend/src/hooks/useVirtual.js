import { useState, useEffect, useMemo } from "react";

/**
 * Custom hook for lightweight virtualization/windowing of lists/table rows.
 * Only triggers virtualization if the dataset is sufficiently large (>= 50 rows).
 *
 * @param {Array} items - List of items to render
 * @param {number} rowHeight - Estimated height of each row in pixels
 * @param {React.RefObject} containerRef - Scrollable viewport container element ref
 * @param {number} overscan - Number of rows to render outside visible bounds
 */
export function useVirtual({
  items = [],
  rowHeight = 72,
  containerRef,
  overscan = 5,
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const shouldVirtualize = items.length >= 250;

  useEffect(() => {
    if (!shouldVirtualize) return;

    const container = containerRef?.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    container.addEventListener("scroll", handleScroll, { passive: true });

    // Initial calculation
    setScrollTop(container.scrollTop);
    setContainerHeight(container.clientHeight || 500);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
    };
  }, [containerRef, shouldVirtualize]);

  const totalHeight = shouldVirtualize ? items.length * rowHeight : 0;

  const { virtualItems, startOffset } = useMemo(() => {
    // If list is small, do not virtualize. Render all items natively.
    if (!shouldVirtualize) {
      return {
        virtualItems: items.map((item, index) => ({
          item,
          index,
          offsetTop: index * rowHeight,
        })),
        startOffset: 0,
      };
    }

    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / rowHeight) - overscan,
    );
    const endIndex = Math.min(
      items.length - 1,
      Math.floor((scrollTop + containerHeight) / rowHeight) + overscan,
    );

    const virtualItems = [];
    for (let i = startIndex; i <= endIndex; i++) {
      virtualItems.push({
        item: items[i],
        index: i,
        offsetTop: i * rowHeight,
      });
    }

    const startOffset = startIndex * rowHeight;

    return { virtualItems, startOffset };
  }, [
    items,
    rowHeight,
    scrollTop,
    containerHeight,
    overscan,
    shouldVirtualize,
  ]);

  return {
    virtualItems,
    totalHeight,
    startOffset,
    shouldVirtualize,
  };
}
export default useVirtual;
