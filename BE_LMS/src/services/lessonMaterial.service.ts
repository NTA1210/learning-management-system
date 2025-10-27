import mongoose from "mongoose";
import LessonMaterialModel from "../models/lessonMaterial.model";
import LessonModel from "../models/lesson.model";
import CourseModel from "../models/course.model";
import EnrollmentModel from "../models/enrollment.model";
import { LessonMaterialQuerySchema, CreateLessonMaterialSchema, UploadMaterialSchema } from "../validators/lessonMaterial.shemas";
import appAssert from "../utils/appAssert";
import {
  CONFLICT,
  NOT_FOUND,
  FORBIDDEN,
  BAD_REQUEST,
} from "../constants/http";
import { Role } from "../types";
import { uploadFile } from "../utils/uploadFile";

export type CreateLessonMaterialParams = {
  lessonId: string;
  title: string;
  type: "pdf" | "video" | "ppt" | "link" | "other";
   fileUrl?: string;
   fileName?: string;
   sizeBytes?: number;
};
// Get all lesson materials with filtering and access control
export const getLessonMaterials = async (query: any, userId?: string, userRole?: Role) => {
 
  const filter: any = {};
  
  // Basic filtering
  if (query.title) {
    filter.title = { $regex: query.title, $options: 'i' }; 
  }
  
  if (query.type) {
    filter.type = query.type;
  }
  
  if (query.fileUrl !== undefined) {
    filter.fileUrl = query.fileUrl;
  }
  
  if (query.fileName !== undefined) {
    filter.fileName = { $regex: query.fileName, $options: 'i' };
  }
  
  if (query.sizeBytes) {
    filter.sizeBytes = query.sizeBytes;
  }
  
  if (query.uploadedBy) {
    filter.uploadedBy = new mongoose.Types.ObjectId(query.uploadedBy);
  }

if (query.lessonId !== undefined) {
    filter.lessonId = new mongoose.Types.ObjectId(query.lessonId);
  }

  // Full-text search
  if (query.search) {
    filter.$text = { $search: query.search };
  }

  // Access control based on user role
  if (userRole === Role.STUDENT) {
    // Students can only see materials from enrolled courses
    const enrolledCourses = await EnrollmentModel.find({ 
      studentId: userId, 
      status: 'active' 
    }).select('courseId');
    
    const enrolledCourseIds = enrolledCourses.map(enrollment => enrollment.courseId);
    
    // Get lessons from enrolled courses
    const enrolledLessons = await LessonModel.find({
      courseId: { $in: enrolledCourseIds }
    }).select('_id');
    
    const enrolledLessonIds = enrolledLessons.map(lesson => lesson._id);
    
    filter.lessonId = { $in: enrolledLessonIds };
  } else if (userRole === Role.TEACHER) {
    // Teachers can see their own materials and materials from their courses
    const teacherCourses = await CourseModel.find({ 
      teachers: userId 
    }).select('_id');
    
    const teacherCourseIds = teacherCourses.map(course => course._id);
    
    // Get lessons from teacher's courses
    const teacherLessons = await LessonModel.find({
      courseId: { $in: teacherCourseIds }
    }).select('_id');
    
    const teacherLessonIds = teacherLessons.map(lesson => lesson._id);
    
    filter.$or = [
      { uploadedBy: new mongoose.Types.ObjectId(userId) }, // Own materials
      { lessonId: { $in: teacherLessonIds } } // Materials from teacher's courses
    ];
  }
  // Admin can see everything (no additional filter)

  // Pagination
  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;

  const [materials, total] = await Promise.all([
    LessonMaterialModel.find(filter)
      .populate('lessonId', 'title courseId')
      .populate('uploadedBy', 'firstName lastName email')
      .sort(query.search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    LessonMaterialModel.countDocuments(filter)
  ]);

  // Add access information for each material
  const materialsWithAccess = await Promise.all(materials.map(async (material) => {
    let hasAccess = false;
    let accessReason = '';

    if (userRole === Role.ADMIN) {
      hasAccess = true;
      accessReason = 'admin';
    } else if (userRole === Role.TEACHER) {
      // Check if teacher uploaded this material or is instructor of the lesson's course
      const isUploader = material.uploadedBy && material.uploadedBy._id.toString() === userId;
      const lesson = await LessonModel.findById(material.lessonId).populate('courseId', 'teachers');
      const isInstructor = lesson && (lesson.courseId as any).teachers.includes(new mongoose.Types.ObjectId(userId));
      
      if (isUploader || isInstructor) {
        hasAccess = true;
        accessReason = isUploader ? 'uploader' : 'instructor';
      }
    } else if (userRole === Role.STUDENT) {
      // Check if student is enrolled in the lesson's course
      const lesson = await LessonModel.findById(material.lessonId).populate('courseId', '_id');
      const enrollment = await EnrollmentModel.findOne({
        studentId: userId,
        courseId: (lesson as any).courseId._id,
        status: 'active'
      });
      
      if (enrollment) {
        hasAccess = true;
        accessReason = 'enrolled';
      }
    }

    return {
      ...material,
      hasAccess,
      accessReason
    };
  }));

    return {
    materials: materialsWithAccess,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  };
};

// Get lesson materials by lesson ID
export const getLessonMaterialsByLesson = async (lessonId: string, userId?: string, userRole?: Role) => {
  // Validate lessonId
  if (!mongoose.Types.ObjectId.isValid(lessonId)) {
    appAssert(false, NOT_FOUND, "Invalid lesson ID format");
  }

  // Check if lesson exists
  const lesson = await LessonModel.findById(lessonId).populate('courseId', 'title teachers');
  appAssert(lesson, NOT_FOUND, "Lesson not found");

  // Access control based on user role
  if (userRole === Role.STUDENT) {
    // Students must be enrolled in the course
    const enrollment = await EnrollmentModel.findOne({
      studentId: userId,
      courseId: (lesson.courseId as any)._id,
      status: 'active'
    });
    appAssert(enrollment, FORBIDDEN, "Not enrolled in this course");

    // Students can see materials from enrolled courses
    const materials = await LessonMaterialModel.find({ 
      lessonId
    })
    .populate('uploadedBy', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .lean();

    return materials.map(material => ({
      ...material,
      hasAccess: true,
      accessReason: 'enrolled'
    }));

  } else if (userRole === Role.TEACHER) {
    // Check if teacher is instructor of the course
    const isInstructor = (lesson.courseId as any).teachers.includes(new mongoose.Types.ObjectId(userId));

    if (isInstructor) {
      // Instructors can see all materials
      const materials = await LessonMaterialModel.find({ lessonId })
        .populate('uploadedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .lean();

      return materials.map(material => ({
        ...material,
        hasAccess: true,
        accessReason: 'instructor'
      }));
    } else {
      // Non-instructor teachers can only see materials they uploaded
      const materials = await LessonMaterialModel.find({ 
        lessonId,
        uploadedBy: userId
      })
      .populate('uploadedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean();

      return materials.map(material => ({
        ...material,
        hasAccess: true,
        accessReason: 'uploader'
      }));
    }

  } else if (userRole === Role.ADMIN) {
    // Admins can see all materials
    const materials = await LessonMaterialModel.find({ lessonId })
      .populate('uploadedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean();

    return materials.map(material => ({
      ...material,
      hasAccess: true,
      accessReason: 'admin'
    }));
  }

  // If no user role or invalid role, return empty array
  return [];
};

// Get lesson material by ID with access control
export const getLessonMaterialById = async (id: string, userId?: string, userRole?: Role) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    appAssert(false, NOT_FOUND, "Invalid material ID format");
  }
  
  const material = await LessonMaterialModel.findById(id)
    .populate('lessonId', 'title courseId')
    .populate('uploadedBy', 'firstName lastName email')
    .lean();
    
  appAssert(material, NOT_FOUND, "Material not found");

  // Check access permissions
  let hasAccess = false;
  let accessReason = '';

  if (userRole === Role.ADMIN) {
    hasAccess = true;
    accessReason = 'admin';
  } else if (userRole === Role.TEACHER) {
    // Check if teacher uploaded this material or is instructor of the lesson's course
    const isUploader = material.uploadedBy && material.uploadedBy._id.toString() === userId;
    const lesson = await LessonModel.findById(material.lessonId).populate('courseId', 'teachers');
    const isInstructor = lesson && (lesson.courseId as any).teachers.includes(new mongoose.Types.ObjectId(userId));
    
    if (isUploader || isInstructor) {
      hasAccess = true;
      accessReason = isUploader ? 'uploader' : 'instructor';
    }
  } else if (userRole === Role.STUDENT) {
    // Check if student is enrolled in the lesson's course
    const lesson = await LessonModel.findById(material.lessonId).populate('courseId', '_id');
    const enrollment = await EnrollmentModel.findOne({
      studentId: userId,
      courseId: (lesson as any).courseId._id,
      status: 'active'
    });
    
    if (enrollment) {
      hasAccess = true;
      accessReason = 'enrolled';
    }
  }

  // If no access, only return basic info
  if (!hasAccess) {
    return {
      ...material,
      fileUrl: undefined, // Hide file URL
      hasAccess: false,
      accessReason: 'not_enrolled',
      message: 'You need to enroll in this course to access the material'
    };
  }

  return {
    ...material,
    hasAccess: true,
    accessReason
  };
};

// Create lesson material
export const createLessonMaterial = async (data: CreateLessonMaterialParams, userId: string, userRole: Role) => {
  // Validate lesson exists
  const lesson = await LessonModel.findById(data.lessonId).populate('courseId', 'teachers');
  appAssert(lesson, NOT_FOUND, "Lesson not found");

  // Check if user has permission to add materials to this lesson
  if (userRole === Role.STUDENT) {
    appAssert(false, FORBIDDEN, "Students cannot create lesson materials");
  } else if (userRole === Role.TEACHER) {
    // Check if teacher is instructor of the course
    const isInstructor = (lesson.courseId as any).teachers.includes(new mongoose.Types.ObjectId(userId));
    appAssert(isInstructor, FORBIDDEN, "Only course instructors can add materials");
  }

  // Check if material with same title exists in the same lesson
  const existingMaterial = await LessonMaterialModel.exists({ 
    title: data.title, 
    lessonId: data.lessonId 
  });
  appAssert(!existingMaterial, CONFLICT, "Material with this title already exists in this lesson");

  const newMaterial = await LessonMaterialModel.create({
    ...data,
    lessonId: new mongoose.Types.ObjectId(data.lessonId),
    uploadedBy: new mongoose.Types.ObjectId(userId)
  });
  
  return await LessonMaterialModel.findById(newMaterial._id)
    .populate('lessonId', 'title courseId')
    .populate('uploadedBy', 'firstName lastName email')
    .lean();
};

// Update lesson material
export const updateLessonMaterial = async (id: string, data: Partial<CreateLessonMaterialParams>, userId: string, userRole: Role) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    appAssert(false, NOT_FOUND, "Invalid material ID format");
  }

  const material = await LessonMaterialModel.findById(id);
  appAssert(material, NOT_FOUND, "Material not found");

  // Check if user has permission to update this material
  if (userRole === Role.STUDENT) {
    appAssert(false, FORBIDDEN, "Students cannot update lesson materials");
  } else if (userRole === Role.TEACHER) {
    // Check if teacher uploaded this material or is instructor of the lesson's course
    const isUploader = material.uploadedBy && material.uploadedBy.toString() === userId;
    const lesson = await LessonModel.findById(material.lessonId).populate('courseId', 'teachers');
    const isInstructor = lesson && (lesson.courseId as any).teachers.includes(new mongoose.Types.ObjectId(userId));
    
    appAssert(isUploader || isInstructor, FORBIDDEN, "Not authorized to update this material");
  }

  // If updating title, check for conflicts
  if (data.title && data.title !== material.title) {
    const existingMaterial = await LessonMaterialModel.exists({ 
      title: data.title, 
      lessonId: material.lessonId,
      _id: { $ne: id }
    });
    appAssert(!existingMaterial, CONFLICT, "Material with this title already exists in this lesson");
  }

  const parsed = CreateLessonMaterialSchema.partial().parse(data);
  const updatedMaterial = await LessonMaterialModel.findByIdAndUpdate(
    id, 
    parsed, 
    { new: true }
  )
    .populate('lessonId', 'title courseId')
    .populate('uploadedBy', 'firstName lastName email')
    .lean();

  return updatedMaterial;
};

export const deleteLessonMaterial = async (id: string, userId: string, userRole: Role) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    appAssert(false, NOT_FOUND, "Invalid material ID format");
  }

  const material = await LessonMaterialModel.findById(id);
  appAssert(material, NOT_FOUND, "Material not found");

  // Check if user has permission to delete this material
  if (userRole === Role.STUDENT) {
    appAssert(false, FORBIDDEN, "Students cannot delete lesson materials");
  } else if (userRole === Role.TEACHER) {
    // Check if teacher uploaded this material or is instructor of the lesson's course
    const isUploader = material.uploadedBy && material.uploadedBy.toString() === userId;
    const lesson = await LessonModel.findById(material.lessonId).populate('courseId', 'teachers');
    const isInstructor = lesson && (lesson.courseId as any).teachers.includes(new mongoose.Types.ObjectId(userId));
    
    appAssert(isUploader || isInstructor, FORBIDDEN, "Not authorized to delete this material");
  }

  const deletedMaterial = await LessonMaterialModel.findByIdAndDelete(id);
  return deletedMaterial;
};

// Upload lesson material with file
export const uploadLessonMaterial = async (data: any, file: Express.Multer.File, userId: string, userRole: Role) => {
  // Validate form data
  const validatedData = UploadMaterialSchema.parse(data);
  
  // Validate lesson exists
  const lesson = await LessonModel.findById(validatedData.lessonId).populate('courseId', 'teachers');
  appAssert(lesson, NOT_FOUND, "Lesson not found");

  // Check if user has permission to add materials to this lesson
  if (userRole === Role.STUDENT) {
    appAssert(false, FORBIDDEN, "Students cannot upload lesson materials");
  } else if (userRole === Role.TEACHER) {
    // Check if teacher is instructor of the course
    const isInstructor = (lesson.courseId as any).teachers.includes(new mongoose.Types.ObjectId(userId));
    appAssert(isInstructor, FORBIDDEN, "Only course instructors can upload materials");
  }

  // Check if material with same title exists in the same lesson
  const existingMaterial = await LessonMaterialModel.exists({ 
    title: validatedData.title, 
    lessonId: validatedData.lessonId 
  });
  appAssert(!existingMaterial, CONFLICT, "Material with this title already exists in this lesson");

  // Determine file type based on MIME type (matching multer config)
  const getFileType = (mimetype: string): "pdf" | "video" | "ppt" | "link" | "other" => {
    if (mimetype.includes('pdf')) return 'pdf';
    if (mimetype.includes('video')) return 'video';
    if (mimetype.includes('powerpoint') || mimetype.includes('presentation')) return 'ppt';
    if (mimetype.includes('image')) return 'other'; // Map image to other since not in original enum
    if (mimetype.includes('audio')) return 'other'; // Map audio to other since not in original enum
    if (mimetype.includes('text') || mimetype.includes('document') || mimetype.includes('excel') || mimetype.includes('zip') || mimetype.includes('rar')) return 'other';
    return 'other';
  };

  // Upload file
  const uploadResult = await uploadFile(file);

  // Create material with file information
  const newMaterial = await LessonMaterialModel.create({
    lessonId: new mongoose.Types.ObjectId(validatedData.lessonId),
    title: validatedData.title,
    type: validatedData.type || getFileType(file.mimetype),
    fileUrl: uploadResult.url,
    fileName: uploadResult.fileName,
    sizeBytes: file.size,
    uploadedBy: new mongoose.Types.ObjectId(userId)
  });
  
  return await LessonMaterialModel.findById(newMaterial._id)
    .populate('lessonId', 'title courseId')
    .populate('uploadedBy', 'firstName lastName email')
    .lean();
};

// Get material for download (no download count tracking in original model)
export const getMaterialForDownload = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    appAssert(false, NOT_FOUND, "Invalid material ID format");
  }

  const material = await LessonMaterialModel.findById(id)
    .populate('lessonId', 'title courseId')
    .populate('uploadedBy', 'firstName lastName email')
    .lean();
  
  appAssert(material, NOT_FOUND, "Material not found");
  return material;
};