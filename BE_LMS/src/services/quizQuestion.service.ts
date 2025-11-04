import { NOT_FOUND } from "@/constants/http";
import { QuizQuestionModel, SubjectModel } from "@/models";
import { ListParams } from "@/types/dto";
import IQuizQuestion, { QuizQuestionType } from "@/types/quizQuestion.type";
import appAssert from "@/utils/appAssert";
import { FilterQuery } from "mongoose";
import { parseStringPromise } from "xml2js";
import { create } from "xmlbuilder";

/**
 * Import questions from an XML file.
 * Checks file content, parses XML, and imports questions into the database.
 *
 * @param xmlBuffer - Buffer containing the XML content.
 * @param subjectId - ID of the subject to import questions into.
 * @returns Promise resolving to an array of imported questions.
 */
export const importXMLFile = async (xmlBuffer: Buffer, subjectId: string) => {
  // 1️⃣ Convert buffer → string
  const xmlContent = xmlBuffer.toString("utf-8");

  // 2️⃣ Parse XML → JSON
  const result = await parseStringPromise(xmlContent, {
    explicitArray: true,
    trim: true,
  });
  const questions = result.quiz?.question || [];

  const importedQuestions = [];
  const importedTypes = new Set<QuizQuestionType>();

  // 3️⃣ Duyệt từng câu hỏi
  for (const q of questions) {
    const typeAttr = q.$?.type || "mcq";
    if (typeAttr === "category") continue;

    // Tên và text câu hỏi
    const questionName = q.name?.[0]?.text?.[0] || "Unnamed question";
    const questionText = q.questiontext?.[0]?.text?.[0] || "";

    // Loại câu hỏi
    let type = QuizQuestionType.MCQ;
    if (typeAttr === "truefalse") type = QuizQuestionType.TRUE_FALSE;
    else if (typeAttr === "multichoice")
      type = QuizQuestionType.MULTIPLE_CHOICE;
    else if (typeAttr === "shortanswer") type = QuizQuestionType.FILL_BLANK;

    // Kiem tra loai cau hoi
    importedTypes.add(type);

    // Đáp án
    const answers = q.answer || [];
    const options: string[] = [];
    const correctOptions: number[] = [];

    answers.forEach((ans: any) => {
      const text = ans.text?.[0] || "";
      const fraction = parseFloat(ans.$?.fraction || "0");
      options.push(text);
      if (fraction > 0) correctOptions.push(1);
      else correctOptions.push(0);
    });

    // Tạo object câu hỏi
    const newQuestion = new QuizQuestionModel({
      subjectId,
      text: questionText || questionName,
      type,
      options,
      correctOptions,
      points: parseFloat(q.defaultgrade?.[0] || "1"),
      explanation: "",
    });

    await newQuestion.save();
    importedQuestions.push(newQuestion);
  }
  return {
    data: importedQuestions,
    total: importedQuestions.length,
    importedTypes: importedTypes,
  };
};

/**
 * Export questions to XML file.
 * @param quizQuestions Array of questions to export.
 * @returns Object containing XML string and total number of questions.
 */
export const exportXMLFile = async (
  quizQuestions: IQuizQuestion[],
  subjectId: string
) => {
  const subject = await SubjectModel.findById(subjectId);
  appAssert(subject, NOT_FOUND, "Subject not found");
  const subjectCode = subject.code;

  const root = create({ version: "1.0", encoding: "UTF-8" }).ele("quiz");

  // --------------------
  // 1️⃣ Add category question
  // --------------------
  const categoryQuestion = root
    .com(`question: 0`)
    .up()
    .ele("question", { type: "category" });
  categoryQuestion
    .ele("category")
    .ele("text")
    .txt(`$subject$/top/Default for ${subjectCode}`);
  categoryQuestion
    .ele("info", { format: "moodle_auto_format" })
    .ele("text")
    .txt(
      `The default category for questions shared in context '${subjectCode}'.`
    );
  categoryQuestion.ele("idnumber").txt("");

  // --------------------
  // 2️⃣ Loop all quiz questions
  // --------------------
  const exportedTypes = new Set<QuizQuestionType>();

  quizQuestions.forEach((q, idx) => {
    //Add types
    exportedTypes.add(q.type);

    // Add comment for question number
    root.com(`question: ${idx + 1}`).up();

    // Create <question> element
    const question = root.ele("question", { type: q.type || "multichoice" });

    // <name>
    question.ele("name").ele("text").txt(q.text.substring(0, 50)); // truncate name if too long

    // <questiontext>
    const questionText = question.ele("questiontext", { format: "html" });
    questionText.ele("text").dat(`<p>${q.text}</p>`);

    // <generalfeedback>
    question.ele("generalfeedback", { format: "html" }).ele("text").txt("");

    // Moodle grading info
    question.ele("defaultgrade").txt("1.0000000");
    question.ele("penalty").txt("0.3333333");
    question.ele("hidden").txt("0");
    question.ele("idnumber").txt("");

    // Extra fields (specific to multichoice)
    question.ele("single").txt("true");
    question.ele("shuffleanswers").txt("true");
    question.ele("answernumbering").txt("abc");
    question.ele("showstandardinstruction").txt("1");

    // Feedback blocks
    question.ele("correctfeedback", { format: "html" }).ele("text").txt("");
    question
      .ele("partiallycorrectfeedback", { format: "html" })
      .ele("text")
      .txt("");
    question.ele("incorrectfeedback", { format: "html" }).ele("text").txt("");

    // <answer> blocks
    if (q.options && q.options.length > 0) {
      q.options.forEach((opt: string, index: number) => {
        const fraction = q.correctOptions?.includes(index) ? "100" : "0";
        const ans = question.ele("answer", { fraction, format: "html" });
        ans.ele("text").dat(`<p>${opt}</p>`);
        ans.ele("feedback", { format: "html" }).ele("text").txt("");
      });
    }
  });

  // --------------------
  // 3️⃣ Convert to string (pretty)
  // --------------------
  const xmlString = root.end({ format: "xml", prettyPrint: true } as any);
  return { xmlString, total: quizQuestions.length, exportedTypes };
};

interface IListQuizQuestionParams extends ListParams {
  subjectId?: string;
  type?: QuizQuestionType;
  from: Date;
  to: Date;
}
/**
 * Get all quiz questions with pagination and filtering.
 * @param  params - Parameters for filtering and pagination.
 * @param  page - Page number to retrieve.
 * @param  limit - Number of items to retrieve per page.
 * @param  search - Search query for questions' text.
 * @param  from - Date range for questions' created date.
 * @param  to - Date range for questions' created date.
 * @param  sortBy - Field to sort questions by.
 * @param  sortOrder - Sort order for questions.
 * @param subjectId - Subject ID to filter by.
 * @param  type - Type of questions to filter by.
 * @returns - Promise resolving to an array of quiz questions.
 */
export const getAllQuizQuestions = async ({
  page = 1,
  limit = 10,
  search,
  from,
  to,
  sortOrder = "desc",
  subjectId,
  type,
}: Partial<IListQuizQuestionParams>) => {
  const query: FilterQuery<IQuizQuestion> = {};

  if (subjectId) query.subjectId = subjectId;
  if (type) query.type = type;
  if (search) query.$text = { $search: search };

  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = from;
    if (to) query.createdAt.$lte = to;
  }

  // validate & limit input
  const _page = Math.max(1, page);
  const _limit = Math.min(Math.max(1, limit), 100);
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  const [data, total] = await Promise.all([
    QuizQuestionModel.find(query)
      .sort({ createdAt: sortDirection })
      .skip((_page - 1) * _limit)
      .limit(_limit),
    QuizQuestionModel.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / _limit);

  return {
    data,
    pagination: {
      totalItems: total,
      currentPage: _page,
      limit: _limit,
      totalPages,
      hasNext: _page < totalPages,
      hasPrev: _page > 1,
    },
  };
};
