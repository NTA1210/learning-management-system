import { CREATED, NOT_FOUND, OK } from "@/constants/http";
import { QuizQuestionModel } from "@/models";
import {
  createQuizQuestion,
  deleteQuizQuestion,
  exportXMLFile,
  getAllQuizQuestions,
  importXMLFile,
  updateQuizQuestion,
} from "@/services/quizQuestion.service";
import IQuizQuestion from "@/types/quizQuestion.type";
import appAssert from "@/utils/appAssert";
import { catchErrors } from "@/utils/asyncHandler";
import {
  createQuizQuestionSchema,
  importQuizQuestionParamsSchema,
  listQuizQuestionSchema,
  quizIdSchema,
  subjectIdSchema,
  updateQuizQuestionSchema,
} from "@/validators/quizQuestion.schemas";
import { id } from "zod/v4/locales";

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
  const quizQuestions = await QuizQuestionModel.find({
    subjectId,
  }).lean<IQuizQuestion[]>();

  appAssert(
    quizQuestions.length > 0,
    NOT_FOUND,
    "No questions found for this subject"
  );

  const { xmlString, total, exportedTypes } = await exportXMLFile(
    quizQuestions,
    subjectId
  );

  res.success(OK, {
    xmlString,
    total,
    exportedTypes,
    message: "Questions exported successfully",
  });
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
  const file = req.file;
  const input = createQuizQuestionSchema.parse({
    ...req.body,
    image: file,
  });
  const data = await createQuizQuestion(input);

  res.success(CREATED, {
    data,
    message: "Question created successfully",
  });
});

//PUT /quiz-questions/:quizId - Update a question
export const updateQuizQuestionByIdHandler = catchErrors(async (req, res) => {
  const file = req.file;
  const input = updateQuizQuestionSchema.parse({
    ...req.body,
    image: file,
    quizId: req.params.quizId,
  });
  const data = await updateQuizQuestion(input);

  res.success(CREATED, {
    data,
    message: "Question updated successfully",
  });
});

//DELETE /quiz-questions/:quizId - Delete a question
export const deleteQuizQuestionByIdHandler = catchErrors(async (req, res) => {
  const quizId = quizIdSchema.parse(req.params.quizId);

  const data = await deleteQuizQuestion(quizId);

  return res.success(OK, {
    data,
    message: "Question deleted successfully",
  });
});
