import { 
  getLessonMaterials, 
  getLessonMaterialsByLesson, 
  getLessonMaterialById,
  createLessonMaterial,
  updateLessonMaterial,
  deleteLessonMaterial,
  uploadLessonMaterial,
  getMaterialForDownload
} from "../services/lessonMaterial.service";
import { catchErrors } from "../utils/asyncHandler";
import { 
  LessonMaterialQuerySchema, 
  LessonMaterialsByLessonSchema, 
  LessonMaterialByIdSchema,
  CreateLessonMaterialSchema,
  UpdateLessonMaterialSchema,
  UploadMaterialSchema
  
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

// Create lesson material
export const createLessonMaterialController = catchErrors(async (req, res) => {
  const data = CreateLessonMaterialSchema.parse(req.body);
  
  // Get user info from authentication middleware
  const userId = req.userId?.toString();
  const userRole = req.role;

  const material = await createLessonMaterial(data, userId, userRole);

  return res
    .success(OK, material, "Create lesson material successfully");
});

// Update lesson material
export const updateLessonMaterialController = catchErrors(async (req, res) => {
  const { id } = req.params;
  const validatedParams = LessonMaterialByIdSchema.parse({ id });
  const data = UpdateLessonMaterialSchema.parse(req.body);
  
  // Get user info from authentication middleware
  const userId = req.userId?.toString();
  const userRole = req.role;

  const result = await updateLessonMaterial(validatedParams.id, data, userId, userRole);

  return res
    .success(OK, result, "Update lesson material successfully");
});

// Delete lesson material
export const deleteLessonMaterialController = catchErrors(async (req, res) => {
  const { id } = req.params;
  const validatedParams = LessonMaterialByIdSchema.parse({ id });
  
  // Get user info from authentication middleware
  const userId = req.userId?.toString();
  const userRole = req.role;

  const material = await deleteLessonMaterial(validatedParams.id, userId, userRole);

  return res
    .success(OK, material, "Delete lesson material successfully");
});

// Upload lesson material with file
export const uploadLessonMaterialController = catchErrors(async (req: any, res) => {
  const file = req.file;
  
  if (!file) {
    return res
      .status(400)
      .json({
        success: false,
        message: "No file uploaded"
      });
  }

  // Parse form data
  const formData = UploadMaterialSchema.parse({
    lessonId: req.body.lessonId,
    title: req.body.title,
    description: req.body.description,
    type: req.body.type,
    isPublic: req.body.isPublic === 'true',
    tags: req.body.tags ? JSON.parse(req.body.tags) : undefined,
    order: req.body.order ? parseInt(req.body.order) : undefined,
  });
  
  // Get user info from authentication middleware
  const userId = req.userId?.toString();
  const userRole = req.role;

  const material = await uploadLessonMaterial(formData, file, userId, userRole);

  return res
    .success(OK, material, "Upload lesson material successfully");
});

// Download lesson material
export const downloadLessonMaterialController = catchErrors(async (req, res) => {
  const { id } = req.params;
  const validatedParams = LessonMaterialByIdSchema.parse({ id });
  
  // Get user info from authentication middleware
  const userId = req.userId?.toString();
  const userRole = req.role;

  // First check if user has access to the material
  const material = await getLessonMaterialById(validatedParams.id, userId, userRole);
  
  if (!material.hasAccess) {
    return res
      .status(403)
      .json({
        success: false,
        message: "You don't have permission to download this material"
      });
  }

  // Get material for download
  const downloadMaterial = await getMaterialForDownload(validatedParams.id);

  return res
    .success(OK, downloadMaterial, "Material ready for download");
});
