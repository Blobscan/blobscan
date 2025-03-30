export const SIZES = ["xs", "sm", "md", "lg", "xl", "2xl"] as const;

export const ICON_CLASSES: Record<
  (typeof SIZES)[number],
  {
    tailwindClasses: string;
    css: {
      width: number;
      height: number;
    };
  }
> = {
  xs: {
    tailwindClasses: "h-2 w-2",
    css: {
      width: 8,
      height: 8,
    },
  },
  sm: {
    tailwindClasses: "h-3 w-3",
    css: {
      width: 12,
      height: 12,
    },
  },
  md: {
    tailwindClasses: "h-4 w-4",
    css: {
      width: 16,
      height: 16,
    },
  },
  lg: {
    tailwindClasses: "h-5 w-5",
    css: {
      width: 20,
      height: 20,
    },
  },
  xl: {
    tailwindClasses: "h-6 w-6",
    css: {
      width: 24,
      height: 24,
    },
  },
  "2xl": {
    tailwindClasses: "h-7 w-7",
    css: {
      width: 28,
      height: 28,
    },
  },
};
