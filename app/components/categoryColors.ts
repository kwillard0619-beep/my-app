const CATEGORY_COLORS: Record<string, string> = {
  animals:
    "border-[#D5A632] bg-[#F2C14E] text-[#171719]",
  arts:
    "border-[#D9877E] bg-[#EFA39A] text-[#171719]",
  "community development":
    "border-[#8EAEDF] bg-[#AFCBFF] text-[#171719]",
  education:
    "border-[#A797D2] bg-[#C7B8EA] text-[#171719]",
  environment:
    "border-[#7CB8A7] bg-[#9FD4C5] text-[#171719]",
  health:
    "border-[#D994B3] bg-[#F3B6D2] text-[#171719]",
  housing:
    "border-[#C29F64] bg-[#E2C28D] text-[#171719]",
  research:
    "border-[#8FAAB1] bg-[#AFC6CC] text-[#171719]",
  youth:
    "border-[#A7BB70] bg-[#C8D992] text-[#171719]",
};

const FALLBACK_CATEGORY_COLORS = [
  "border-[#BD9181] bg-[#D9B5A7] text-[#171719]",
  "border-[#95A4CE] bg-[#B8C4E6] text-[#171719]",
  "border-[#D58A55] bg-[#F0A76E] text-[#171719]",
  "border-[#8D9A70] bg-[#B9C59C] text-[#171719]",
] as const;

function normalizeCategory(category: string) {
  return category.trim().toLowerCase();
}

function getFallbackCategoryColor(
  category: string
) {
  const normalizedCategory =
    normalizeCategory(category);
  let hash = 2166136261;

  for (
    let index = 0;
    index < normalizedCategory.length;
    index += 1
  ) {
    hash ^= normalizedCategory.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return FALLBACK_CATEGORY_COLORS[
    (hash >>> 0) %
      FALLBACK_CATEGORY_COLORS.length
  ];
}

function resolveCategoryColor(category: string) {
  const normalizedCategory =
    normalizeCategory(category);

  return (
    CATEGORY_COLORS[normalizedCategory] ??
    getFallbackCategoryColor(normalizedCategory)
  );
}

export function createCategoryColorMap(
  categories: string[]
) {
  return categories.reduce<Record<string, string>>(
    (colorMap, category) => {
      const cleanedCategory = category.trim();

      if (cleanedCategory) {
        colorMap[cleanedCategory] =
          resolveCategoryColor(cleanedCategory);
      }

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

  return matchingCategory
    ? categoryColorMap[matchingCategory]
    : resolveCategoryColor(category);
}