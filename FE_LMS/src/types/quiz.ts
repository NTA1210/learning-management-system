import type { QuizQuestionImage } from "../services";

export type EditFormState = {
  text: string;
  points: number | string;
  options: string[];
  correctFlags: boolean[];
  explanation: string;
  existingImages: QuizQuestionImage[];
  deletedImageUrls: string[];
  newImageFiles: File[];
  newImagePreviews: string[];
};





