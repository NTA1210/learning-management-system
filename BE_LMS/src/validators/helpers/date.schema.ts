import { isDateInFuture } from "@/utils/date";
import z from "zod";

export const datePreprocess = z
  .preprocess((val) => {
    if (typeof val === "string" || typeof val === "number") {
      const date = new Date(val);
      if (!isNaN(date.getTime())) return date; // valid date
    }
    return undefined;
  }, z.date())
  .refine(
    (val) => {
      if (!val) return true;
      return !isDateInFuture(val);
    },
    {
      message: "Date cannot be in the future",
    }
  );
