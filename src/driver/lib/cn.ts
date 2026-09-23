/** Junta classes CSS ignorando valores falsos: cn("a", false && "b", "c") → "a c" */
export const cn = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");
