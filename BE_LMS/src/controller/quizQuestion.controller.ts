import { NOT_FOUND, OK } from "@/constants/http";
import { importXMLFile } from "@/services/quizQuestion.service";
import appAssert from "@/utils/appAssert";
import { catchErrors } from "@/utils/asyncHandler";
import { importQuizQuestionParamsSchema } from "@/validators/quizQuestion.chemas";

// POST /quiz-questions/import - Import questions from XML file
export const importXMLFileHandler = catchErrors(async (req, res) => {
  const xmlFile = req.file;
  const { courseId } = req.body;
  appAssert(xmlFile, NOT_FOUND, "XML file is required");
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
