/**
 * parsePaginationParams
 *
 * Safely parse and clamp pagination query parameters.
 * Always returns valid, positive integers regardless of what was sent.
 *
 * @param {object} query - Express req.query object (or equivalent)
 * @param {number} defaultLimit - default page size
 * @param {number} maxLimit - maximum allowed page size
 * @returns {{ page: number, limit: number, skip: number, take: number }}
 */
export function parsePaginationParams(query = {}, defaultLimit = 15, maxLimit = 50000) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  // Guard: NaN, 0, negative
  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(limit) || limit < 1) limit = defaultLimit;

  // Guard: excessive limit
  if (limit > maxLimit) limit = maxLimit;

  const skip = (page - 1) * limit;
  const take = limit;

  return { page, limit, skip, take };
}

/**
 * buildPaginationMeta
 *
 * Build a standardized pagination metadata object.
 *
 * @param {object} opts
 * @param {number} opts.page        - current page (1-based)
 * @param {number} opts.take        - items per page (page size)
 * @param {number} opts.totalItems  - total unfiltered count
 * @param {number} opts.filteredItems - count after applying current filters
 * @param {object} [opts.extra]     - additional metadata (e.g. inventoryCounts)
 * @returns {object}
 */
export function buildPaginationMeta({ page, take, totalItems, filteredItems, extra = {} }) {
  const totalPages = Math.max(1, Math.ceil(filteredItems / take));
  const safePage = Math.min(Math.max(page, 1), totalPages);

  return {
    currentPage: safePage,
    pageSize: take,
    itemsPerPage: take,
    totalItems,
    filteredItems,
    totalPages,
    ...extra,
  };
}
