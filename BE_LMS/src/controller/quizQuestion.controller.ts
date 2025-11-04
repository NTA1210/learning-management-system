import { NOT_FOUND, OK } from "@/constants/http";
import { QuizQuestionModel } from "@/models";
import {
  exportXMLFile,
  getAllQuizQuestions,
  importXMLFile,
} from "@/services/quizQuestion.service";
import IQuizQuestion from "@/types/quizQuestion.type";
import appAssert from "@/utils/appAssert";
import { catchErrors } from "@/utils/asyncHandler";
import {
  importQuizQuestionParamsSchema,
  listQuizQuestionSchema,
  subjectIdSchema,
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

// GET /quiz-questions/:subjectId - Get all questions
export const getAllQuizQuestionsHandler = catchErrors(async (req, res) => {
  const filters = listQuizQuestionSchema.parse(req.query);
  const { data, pagination } = await getAllQuizQuestions(filters);

  return res.success(OK, {
    data,
    pagination,
    message: "Questions retrieved successfully",
  });
});
