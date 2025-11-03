import { NOT_FOUND, OK } from "@/constants/http";
import { QuizQuestionModel } from "@/models";
import { exportXMLFile, importXMLFile } from "@/services/quizQuestion.service";
import IQuizQuestion from "@/types/quizQuestion.type";
import appAssert from "@/utils/appAssert";
import { catchErrors } from "@/utils/asyncHandler";
import { courseIdSchema } from "@/validators";
import { importQuizQuestionParamsSchema } from "@/validators/quizQuestion.chemas";

// POST /quiz-questions/import - Import questions from XML file
export const importXMLFileHandler = catchErrors(async (req, res) => {
  const xmlFile = req.file;
  const { courseId } = req.body;
  appAssert(
    xmlFile && ["application/xml", "text/xml"].includes(xmlFile.mimetype), // check file type
    NOT_FOUND,
    "XML file is required"
  );
  importQuizQuestionParamsSchema.parse({ xmlFile, courseId });

  const { data, total, importedTypes } = await importXMLFile(
    xmlFile.buffer,
    courseId
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
  const { courseId } = req.params;
  courseIdSchema.parse(courseId);
  const quizQuestions = await QuizQuestionModel.find({
    courseId,
  }).lean<IQuizQuestion[]>();

  appAssert(
    quizQuestions.length > 0,
    NOT_FOUND,
    "No questions found for this course"
  );

  const { xmlString, total, exportedTypes } = exportXMLFile(quizQuestions);

  res.success(OK, {
    xmlString,
    total,
    exportedTypes,
    message: "Questions exported successfully",
  });
});
