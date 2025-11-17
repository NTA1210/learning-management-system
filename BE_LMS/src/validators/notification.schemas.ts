import z from "zod";
import { ObjectId } from "mongoose";
import { datePreprocess } from "./helpers/date.schema";

// Schema for creating a notification
export const createNotificationSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200, "Title too long"),
    message: z.string().min(1, "Message is required").max(1000, "Message too long"),
    recipientType: z.enum(["user", "course", "all"]).default("user"),
    recipientUser: z.string().length(24, "Invalid user ID").optional(),
    recipientCourse: z.string().length(24, "Invalid course ID").optional(),
  })
  .refine(
    (data) => {
      if (data.recipientType === "user" && !data.recipientUser) {
        return false;
      }
      if (data.recipientType === "course" && !data.recipientCourse) {
        return false;
      }
      return true;
    },
    {
      message: "Recipient ID is required based on recipient type",
    }
  );

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

// Schema for listing notifications
export const listNotificationsSchema = z
  .object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .refine((val) => val > 0, { message: "Page must be greater than 0" }),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10))
      .refine((val) => val > 0 && val <= 100, {
        message: "Limit must be between 1 and 100",
      }),
    isRead: z
      .string()
      .optional()
      .transform((val) => {
        if (val === "true") return true;
        if (val === "false") return false;
        return undefined;
      }),
    from: datePreprocess,
    to: datePreprocess,
  })
  .refine(
    (val) => {
      if (val.from && val.to) {
        return val.from.getTime() <= val.to.getTime();
      }
      return true;
    },
    {
      message: "From date must be less than or equal to To date",
      path: ["to"],
    }
  );

export type ListNotificationsQuery = z.infer<typeof listNotificationsSchema>;

// Schema for notification ID
export const notificationIdSchema = z
  .string()
  .length(24, "Invalid notification ID");

// Schema for marking notification as read
export const markReadNotificationSchema = z.object({
  notificationIds: z
    .array(z.string().length(24, "Invalid notification ID"))
    .min(1, "At least one notification ID is required"),
});

export type MarkReadNotificationInput = z.infer<
  typeof markReadNotificationSchema
>;

