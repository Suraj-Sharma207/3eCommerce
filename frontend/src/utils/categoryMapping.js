export const categorySlugToName = {
  "living-room": "Living Room",
  bedroom: "Bedroom",
  "dining-room": "Dining Room",
  office: "Office",
  decor: "Decor",
  outdoor: "Outdoor",
  storage: "Storage",
  lighting: "Lighting",
};

export const categoryNameToSlug = Object.fromEntries(
  Object.entries(categorySlugToName).map(([slug, name]) => [name, slug]),
);

export const getCategoryNameFromSlug = (slug) => {
  if (!slug) return slug;
  return categorySlugToName[slug.toLowerCase().trim()] || slug;
};

export const getSlugFromCategoryName = (name) => {
  if (!name) return name;
  return categoryNameToSlug[name] || name.toLowerCase().replace(/\s+/g, "-");
};

export const parseCategoryParam = (categoryParam) => {
  if (!categoryParam) return [];
  return categoryParam.split(",").map((c) => getCategoryNameFromSlug(c));
};
