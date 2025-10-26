import { 
  getLessonMaterials, 
  getLessonMaterialsByLesson, 
  getLessonMaterialById
 
} from "../services/lessonMaterial.service";
import { catchErrors } from "../utils/asyncHandler";
import { 
  LessonMaterialQuerySchema, 
  LessonMaterialsByLessonSchema, 
  LessonMaterialByIdSchema
  
} from "../validators/lessonMaterial.shemas";
import { OK } from "../constants/http";
import { Role } from "../types";

// Get all lesson materials with filtering
export const listAllLessonMaterials = catchErrors(async (req, res) => {
  const queryParams = LessonMaterialQuerySchema.parse(req.query);
  
  // Get user info from authentication middleware
  const userId = req.userId?.toString();
  const userRole = req.role;
  
  const result = await getLessonMaterials(queryParams, userId, userRole);
  
  return res
    .success(OK, result, "Get all lesson materials successfully");
});

// Get lesson materials by lesson ID
export const getLessonMaterialsByLessonController = catchErrors(async (req, res) => {
  const { lessonId } = req.params;

  const validatedParams = LessonMaterialsByLessonSchema.parse({ lessonId });

  // Get user info from authentication middleware
  const userId = req.userId?.toString();
  const userRole = req.role;

  const materials = await getLessonMaterialsByLesson(validatedParams.lessonId, userId, userRole);

  return res
    .success(OK, materials, "Get lesson materials by lesson successfully");
});

// Get lesson material by ID
export const getLessonMaterialByIdController = catchErrors(async (req, res) => {
  const { id } = req.params;

  const validatedParams = LessonMaterialByIdSchema.parse({ id });

  // Get user info from authentication middleware
  const userId = req.userId?.toString();
  const userRole = req.role;

  const material = await getLessonMaterialById(validatedParams.id, userId, userRole);

  return res
    .success(OK, material, "Get lesson material by id successfully");
});