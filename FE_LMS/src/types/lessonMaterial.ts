export interface LessonSummary {
  _id: string;
  title: string;
  content: string;
  order: number;
  durationMinutes: number;
  isPublished: boolean;
  publishedAt?: string;
  courseId: {
    _id: string;
    title: string;
    description?: string;
  };
  createdAt: string;
  updatedAt: string;
  hasAccess: boolean;
  accessReason: string;
}

export interface LessonMaterialUploader {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface LessonMaterial {
  _id: string;
  lessonId: {
    _id: string;
    title: string;
    courseId: string;
  };
  title: string;
  note?: string;
  originalName?: string;
  mimeType?: string;
  key?: string;
  size?: number;
  uploadedBy: LessonMaterialUploader;
  createdAt: string;
  updatedAt: string;
  signedUrl?: string;
  hasAccess: boolean;
  accessReason: string;
}

export interface MaterialFormValues {
  title: string;
  note: string;
  originalName: string;
  mimeType: string;
  size: number;
}

