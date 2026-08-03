const ANTICIPATED_DEADLINE_COLORS: Record<
  string,
  string
> = {
  january:
    "border-[#7E9BC8] bg-[#AFCBFF] text-[#171719]",
  february:
    "border-[#9A88C8] bg-[#C7B8EA] text-[#171719]",
  march:
    "border-[#62A08E] bg-[#9FD4C5] text-[#171719]",
  april:
    "border-[#D5A632] bg-[#F2C14E] text-[#171719]",
  may:
    "border-[#D986AB] bg-[#F3B6D2] text-[#171719]",
  june:
    "border-[#789BA4] bg-[#AFC6CC] text-[#171719]",
  july:
    "border-[#C29F64] bg-[#E2C28D] text-[#171719]",
  august:
    "border-[#8092C2] bg-[#B8C4E6] text-[#171719]",
  september:
    "border-[#96AD58] bg-[#C8D992] text-[#171719]",
  october:
    "border-[#D17B43] bg-[#F0A76E] text-[#171719]",
  november:
    "border-[#7F878C] bg-[#BCC1C4] text-[#171719]",
  december:
    "border-[#AD7765] bg-[#D9B5A7] text-[#171719]",

  rolling:
    "border-[#5F666A] bg-[#949A9E] text-[#111214]",
};

const FALLBACK_ANTICIPATED_STYLE =
  "border-[#9EA4A8] bg-[#BCC1C4] text-[#171719]";

export function getAnticipatedDeadlineStyle(
  anticipatedDeadline: string
) {
  const normalizedValue = anticipatedDeadline
    .trim()
    .toLowerCase();

  return (
    ANTICIPATED_DEADLINE_COLORS[
      normalizedValue
    ] ?? FALLBACK_ANTICIPATED_STYLE
  );
}