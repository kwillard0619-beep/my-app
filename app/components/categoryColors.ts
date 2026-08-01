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
];

export function createCategoryColorMap(
  categories: string[]
) {
  return categories.reduce<
    Record<string, string>
  >((colorMap, category, index) => {
    colorMap[category] =
      SOLID_CATEGORY_COLORS[
        index %
          SOLID_CATEGORY_COLORS.length
      ];

    return colorMap;
  }, {});
}

export function getCategoryStyle(
  category: string,
  categoryColorMap: Record<
    string,
    string
  >
) {
  const normalizedCategory = category
    .trim()
    .toLowerCase();

  const matchingCategory = Object.keys(
    categoryColorMap
  ).find(
    (key) =>
      key.trim().toLowerCase() ===
      normalizedCategory
  );

  return matchingCategory
    ? categoryColorMap[matchingCategory]
    : "border-[#9EA4A8] bg-[#BCC1C4] text-[#171719]";
}