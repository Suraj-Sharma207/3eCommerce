export const normalizeAddress = (rawData) => {
  if (!rawData) return {};

  // Support for multiple providers (Nominatim, Google, Mapbox)
  let addr = {};

  if (rawData.address) {
    // Nominatim / OpenStreetMap
    addr = rawData.address;
  } else if (rawData.address_components) {
    // Google Geocoding (simplified mapping, typical structure requires array searching, but we'll adapt if passed pre-mapped or just handle gracefully)
    // We'll focus on Nominatim as the primary since it's currently used, but be defensive.
    rawData.address_components.forEach((comp) => {
      if (comp.types.includes("locality")) addr.city = comp.long_name;
      if (comp.types.includes("administrative_area_level_1"))
        addr.state = comp.long_name;
      if (comp.types.includes("country")) addr.country = comp.long_name;
      if (comp.types.includes("postal_code")) addr.postcode = comp.long_name;
      if (comp.types.includes("route")) addr.road = comp.long_name;
      if (comp.types.includes("street_number"))
        addr.house_number = comp.long_name;
      if (comp.types.includes("sublocality")) addr.suburb = comp.long_name;
      if (comp.types.includes("neighborhood"))
        addr.neighbourhood = comp.long_name;
    });
  } else if (rawData.context) {
    // Mapbox
    rawData.context.forEach((ctx) => {
      if (ctx.id.startsWith("place")) addr.city = ctx.text;
      if (ctx.id.startsWith("region")) addr.state = ctx.text;
      if (ctx.id.startsWith("country")) addr.country = ctx.text;
      if (ctx.id.startsWith("postcode")) addr.postcode = ctx.text;
      if (ctx.id.startsWith("neighborhood")) addr.neighbourhood = ctx.text;
    });
    if (rawData.text) addr.road = rawData.text; // often street name in mapbox
    if (rawData.address) addr.house_number = rawData.address;
  } else {
    // Fallback if the object is already flat
    addr = rawData;
  }

  // Helper to find first truthy value
  const getFirst = (...keys) => {
    for (const key of keys) {
      if (addr[key] && typeof addr[key] === "string") return addr[key];
    }
    return "";
  };

  // 1. Address Line 1
  let street = "";
  if (addr.house_number && addr.road)
    street = `${addr.house_number} ${addr.road}`;
  else if (addr.premise && addr.road) street = `${addr.premise} ${addr.road}`;
  else if (addr.road) street = addr.road;
  else if (addr.suburb && addr.road) street = `${addr.suburb} ${addr.road}`;
  else if (addr.neighbourhood) street = addr.neighbourhood;
  else if (rawData.display_name)
    street = rawData.display_name.split(",")[0]; // fallback to formatted address start
  else if (rawData.formatted_address)
    street = rawData.formatted_address.split(",")[0];

  // 2. Address Line 2
  const addressLine2 = getFirst(
    "apartment",
    "building",
    "block",
    "sector",
    "locality",
    "sublocality",
    "district",
  );

  // 3. Landmark
  const landmark = getFirst(
    "point_of_interest",
    "landmark",
    "establishment",
    "attraction",
    "shopping_mall",
    "school",
    "hospital",
    "building_name",
    "amenity",
  );

  // 4. City
  const city = getFirst(
    "city",
    "town",
    "municipality",
    "locality",
    "administrative_area_level_2",
  );

  // 5. State / Province
  const state = getFirst(
    "administrative_area_level_1",
    "state",
    "province",
    "region",
    "county",
  );

  // 6. Postal Code
  const zipCode = getFirst("postal_code", "zip", "postcode");

  // 7. Country
  let country = "";
  if (addr.country && typeof addr.country === "object") {
    country = addr.country.long_name || addr.country.short_name || "";
  } else {
    country = getFirst("country");
  }

  const normalized = {
    street,
    addressLine2,
    landmark,
    city,
    state,
    zipCode,
    country,
  };

  // Intelligent Fallbacks
  if (!normalized.state && normalized.city) {
    // If state is missing, sometimes city/county data has it
    normalized.state = getFirst("county", "region");
  }

  return normalized;
};
