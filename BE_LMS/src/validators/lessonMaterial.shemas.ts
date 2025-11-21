import z from "zod";
import ListParams from "@/types/dto/listParams.dto";
import { datePreprocess } from "./helpers/date.schema";
import { listParamsSchema } from "./listParams.schema";

// Material types enum (only original types)
const MaterialTypeEnum = z.enum(["pdf", "video", "ppt", "link", "other"]);

type LessonMaterialQueryFilters = ListParams & {
  title?: string;
  type?: z.infer<typeof MaterialTypeEnum>;
  size?: number;
  uploadedBy?: string;
  lessonId?: string;
  from?: Date;
  to?: Date;
};

// Query schema for filtering materials
export const LessonMaterialQuerySchema = (listParamsSchema
  .extend({
    title: z.string().optional(),
    type: MaterialTypeEnum.optional(),
    size: z.coerce.number().int().positive().optional(),
    uploadedBy: z.string().optional(),
    lessonId: z.string().min(1).optional(),
    createdAt: datePreprocess.optional(),
    updatedAt: datePreprocess.optional(),
    from: datePreprocess.optional(),
    to: datePreprocess.optional(),
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
  )) satisfies z.ZodType<LessonMaterialQueryFilters>;

// Schema for creating lesson material
// Note: uploadedBy is automatically set from auth, type is only for filtering
export const CreateLessonMaterialSchema = z.object({
  lessonId: z.string().min(1, "Lesson ID is required"),
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  note: z.string().optional(),
  // Optional fields for full material creation
  originalName: z.string().optional(),
  mimeType: z.string().optional(),
  size: z.coerce.number().int().nonnegative().optional(),
  key: z.string().optional(), // If not provided, will auto-generate manual-materials/{lessonId}/{uuid}
}).passthrough(); // Allow unknown fields but ignore them

// Schema for updating lesson material
export const UpdateLessonMaterialSchema = CreateLessonMaterialSchema.partial().omit({ lessonId: true });

// Schema for getting material by ID
export const LessonMaterialByIdSchema = z.object({
  id: z.string().min(1, "Material ID is required"),
});

// Schema for getting materials by lesson
export const LessonMaterialsByLessonSchema = z.object({
  lessonId: z.string().min(1, "Lesson ID is required"),
});

// Schema for file upload
export const UploadMaterialSchema = z.object({
  lessonId: z.string().min(1, "Lesson ID is required"),
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  type: MaterialTypeEnum.default("other"),
});



// Export types
export type LessonMaterialQueryParams = z.infer<typeof LessonMaterialQuerySchema>;
export type CreateLessonMaterialParams = z.infer<typeof CreateLessonMaterialSchema>;
export type UpdateLessonMaterialParams = z.infer<typeof UpdateLessonMaterialSchema>;
export type LessonMaterialByIdParams = z.infer<typeof LessonMaterialByIdSchema>;
export type LessonMaterialsByLessonParams = z.infer<typeof LessonMaterialsByLessonSchema>;
export type UploadMaterialParams = z.infer<typeof UploadMaterialSchema>;
