// app/components/categoryColors.ts

export const CATEGORY_COLORS = [
  "bg-blue-100 text-blue-800 border-blue-300",
  "bg-purple-100 text-purple-800 border-purple-300",
  "bg-emerald-100 text-emerald-800 border-emerald-300",
  "bg-amber-100 text-amber-800 border-amber-300",
  "bg-rose-100 text-rose-800 border-rose-300",
  "bg-cyan-100 text-cyan-800 border-cyan-300",
  "bg-indigo-100 text-indigo-800 border-indigo-300",
  "bg-orange-100 text-orange-800 border-orange-300",
  "bg-pink-100 text-pink-800 border-pink-300",
  "bg-teal-100 text-teal-800 border-teal-300",
  "bg-lime-100 text-lime-800 border-lime-300",
  "bg-violet-100 text-violet-800 border-violet-300",
  "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300",
  "bg-sky-100 text-sky-800 border-sky-300",
  "bg-yellow-100 text-yellow-800 border-yellow-300",
  "bg-stone-100 text-stone-800 border-stone-300",
  "bg-slate-100 text-slate-800 border-slate-300",
  "bg-red-100 text-red-800 border-red-300",
];

export const DEFAULT_CATEGORY_STYLE =
  "bg-slate-100 text-slate-800 border-slate-300";

/**
 * Normalizes a category so that comparisons are
 * case-insensitive and whitespace-safe.
 */
export const normalizeCategory = (
  category: string
) => {
  return String(category)
    .trim()
    .toLowerCase();
};

/**
 * Creates a category -> Tailwind class map.
 *
 * The category list should be the same list used
 * by the table and drawer.
 */
export const createCategoryColorMap = (
  categories: string[]
) => {
  const map = new Map<string, string>();

  categories.forEach(
    (category, index) => {
      const normalized =
        normalizeCategory(category);

      if (!normalized) {
        return;
      }

      map.set(
        normalized,
        CATEGORY_COLORS[
          index % CATEGORY_COLORS.length
        ]
      );
    }
  );

  return map;
};

/**
 * Gets the style for a category from a
 * pre-built category color map.
 */
export const getCategoryStyle = (
  category: string,
  categoryColorMap: Map<string, string>
) => {
  return (
    categoryColorMap.get(
      normalizeCategory(category)
    ) ||
    DEFAULT_CATEGORY_STYLE
  );
};