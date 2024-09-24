import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const isStrictlyNumber = (input: string | number): boolean =>
  typeof input === "number" || /^-?\d+(\.\d+)?$/.test(input);

const customTwMerge = extendTailwindMerge({
  cacheSize: 700,
  extend: {
    classGroups: {
      "font-size": [
        { text: [(value: string | number) => isStrictlyNumber(value)] },
      ],
      "font-weight": [
        { font: [(value: string | number) => isStrictlyNumber(value)] },
      ],
    },
  },
});

export const cn = (...inputs: ClassValue[]) => {
  return customTwMerge(clsx(inputs));
};
