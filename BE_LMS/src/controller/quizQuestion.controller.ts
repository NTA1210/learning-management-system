import { CREATED, NOT_FOUND, OK } from "@/constants/http";
import {
  createQuizQuestion,
  deleteImage,
  deleteMultipleQuizQuestions,
  deleteQuizQuestion,
  exportXMLFile,
  getAllQuizQuestions,
  getRandomQuestions,
  importXMLFile,
  updateQuizQuestion,
  uploadImages,
} from "@/services/quizQuestion.service";
import appAssert from "@/utils/appAssert";
import { catchErrors } from "@/utils/asyncHandler";
import { parseFormData } from "@/utils/parseFormData";
import {
  createQuizQuestionSchema,
  deleteImagesSchema,
  importQuizQuestionParamsSchema,
  listQuizQuestionSchema,
  multiQuizQuestionIdSchema,
  quizQuestionIdSchema,
  randomQuizQuestionSchema,
  subjectIdSchema,
  updateQuizQuestionSchema,
  uploadImagesSchema,
} from "@/validators/quizQuestion.schemas";

// POST /quiz-questions/import - Import questions from XML file
export const importXMLFileHandler = catchErrors(async (req, res) => {
  const xmlFile = req.file;
  const { subjectId } = req.body;
  appAssert(
    xmlFile && ["application/xml", "text/xml"].includes(xmlFile.mimetype), // check file type
    NOT_FOUND,
    "XML file is required"
  );
  importQuizQuestionParamsSchema.parse({ xmlFile, subjectId });

  const { data, total, importedTypes } = await importXMLFile(
    xmlFile.buffer,
    subjectId
  );

  return res.success(OK, {
    data,
    total,
    importedTypes,
    message: "Questions imported successfully",
  });
});

// GET /quiz-questions/export - Export questions from XML file
export const exportXMLFileHandler = catchErrors(async (req, res) => {
  const { subjectId } = req.params;
  subjectIdSchema.parse(subjectId);

  const { xmlString, total, exportedTypes } = await exportXMLFile(subjectId);

  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Content-Disposition", `attachment; filename="abc.xml"`);
  /**Content-Type: application/xml → cho biết đây là dữ liệu XML.
  Content-Disposition: attachment; filename="..." → ép trình duyệt mở hộp thoại tải file. */

  res.status(OK).send(xmlString);
  // res.success(OK, {
  //   xmlString,
  //   total,
  //   exportedTypes,
  //   message: "Questions exported successfully",
  // });
});

// GET /quiz-questions/ - Get all questions
export const getAllQuizQuestionsHandler = catchErrors(async (req, res) => {
  const filters = listQuizQuestionSchema.parse(req.query);
  const { data, pagination } = await getAllQuizQuestions(filters);

  return res.success(OK, {
    data,
    pagination,
    message: "Questions retrieved successfully",
  });
});

// POST /quiz-questions/ - Create a new question
export const createQuizQuestionHandler = catchErrors(async (req, res) => {
  const files = req.files;
  const input = createQuizQuestionSchema.parse(
    parseFormData({
      ...req.body,
      images: files,
    })
  );
  const data = await createQuizQuestion(input);

  res.success(CREATED, {
    data,
    message: "Question created successfully",
  });
});

//PUT /quiz-questions/:quizQuestionId - Update a question
export const updateQuizQuestionByIdHandler = catchErrors(async (req, res) => {
  const files = req.files;
  const input = updateQuizQuestionSchema.parse(
    parseFormData({
      ...req.body,
      images: files,
      quizQuestionId: req.params.quizQuestionId,
    })
  );

  const data = await updateQuizQuestion(input);

  res.success(CREATED, {
    data,
    message: "Question updated successfully",
  });
});

//DELETE /quiz-questions/:quizQuestionId - Delete a question
export const deleteQuizQuestionByIdHandler = catchErrors(async (req, res) => {
  const quizQuestionId = quizQuestionIdSchema.parse(req.params.quizQuestionId);

  const data = await deleteQuizQuestion(quizQuestionId);

  return res.success(OK, {
    data,
    message: "Question deleted successfully",
  });
});

//DELETE /quiz-questions - Delete multiple questions
export const deleteMultiQuizQuestionByIdHandler = catchErrors(
  async (req, res) => {
    const ids = multiQuizQuestionIdSchema.parse(req.body.ids);
    const data = await deleteMultipleQuizQuestions(ids);
    return res.success(OK, {
      data,
      message: "Question deleted successfully",
    });
  }
);

// GET /quiz-questions/random - Get random questions
export const getRandomQuestionsHandler = catchErrors(async (req, res) => {
  const input = randomQuizQuestionSchema.parse(req.query);
  const { data, total, questionTypes } = await getRandomQuestions(input);
  return res.success(OK, {
    data,
    total,
    questionTypes,
    message: "Questions retrieved successfully",
  });
});

// POST /images - Upload images
export const uploadImagesHandler = catchErrors(async (req, res) => {
  const files = req.files;

  const input = uploadImagesSchema.parse(
    parseFormData({
      ...req.body,
      images: files,
    })
  );

  const data = await uploadImages(input);
  return res.success(OK, {
    data,
    message: "Images uploaded successfully",
  });
});

//DELETE /images - Delete multiple questions
export const deleteImageHandler = catchErrors(async (req, res) => {
  const input = deleteImagesSchema.parse(req.query.url);
  await deleteImage(input);

  return res.success(OK, {
    message: "Image deleted successfully",
  });
});
