const SOLID_CATEGORY_COLORS = [
  "border-[#D5A632] bg-[#F2C14E] text-[#171719]",
  "border-[#D9877E] bg-[#EFA39A] text-[#171719]",
  "border-[#8EAEDF] bg-[#AFCBFF] text-[#171719]",
  "border-[#A797D2] bg-[#C7B8EA] text-[#171719]",
  "border-[#7CB8A7] bg-[#9FD4C5] text-[#171719]",
  "border-[#D994B3] bg-[#F3B6D2] text-[#171719]",
  "border-[#C29F64] bg-[#E2C28D] text-[#171719]",
  "border-[#8FAAB1] bg-[#AFC6CC] text-[#171719]",
  "border-[#A7BB70] bg-[#C8D992] text-[#171719]",
  "border-[#BD9181] bg-[#D9B5A7] text-[#171719]",
  "border-[#95A4CE] bg-[#B8C4E6] text-[#171719]",
  "border-[#D58A55] bg-[#F0A76E] text-[#171719]",
] as const;

function normalizeCategory(category: string) {
  return category.trim().toLowerCase();
}

function getStableCategoryColor(
  category: string
) {
  const normalizedCategory =
    normalizeCategory(category);

  // FNV-1a creates a stable numeric value from the
  // category name. The result does not depend on the
  // categories present on the current page or their order.
  let hash = 2166136261;

  for (
    let index = 0;
    index < normalizedCategory.length;
    index += 1
  ) {
    hash ^= normalizedCategory.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  const colorIndex =
    (hash >>> 0) % SOLID_CATEGORY_COLORS.length;

  return SOLID_CATEGORY_COLORS[colorIndex];
}

export function createCategoryColorMap(
  categories: string[]
) {
  return categories.reduce<Record<string, string>>(
    (colorMap, category) => {
      const cleanedCategory = category.trim();

      if (!cleanedCategory) {
        return colorMap;
      }

      colorMap[cleanedCategory] =
        getStableCategoryColor(cleanedCategory);

      return colorMap;
    },
    {}
  );
}

export function getCategoryStyle(
  category: string,
  categoryColorMap: Record<string, string>
) {
  const normalizedCategory =
    normalizeCategory(category);

  const matchingCategory = Object.keys(
    categoryColorMap
  ).find(
    (key) =>
      normalizeCategory(key) ===
      normalizedCategory
  );

  // The deterministic fallback is important for realtime
  // records and saved legacy categories that were not part
  // of the array used to build the current page's map.
  return matchingCategory
    ? categoryColorMap[matchingCategory]
    : getStableCategoryColor(category);
}