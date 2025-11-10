import { BAD_REQUEST, NOT_FOUND } from "@/constants/http";
import { QuizModel, QuizQuestionModel, SubjectModel } from "@/models";
import { ListParams } from "@/types/dto";
import IQuizQuestion, { QuizQuestionType } from "@/types/quizQuestion.type";
import appAssert from "@/utils/appAssert";
import { prefixQuizQuestionImage } from "@/utils/filePrefix";
import { removeFile, uploadFile } from "@/utils/uploadFile";
import {
  ICreateQuizQuestionParams,
  IGetRandomQuestionsParams,
  IUpdateQuizQuestionParams,
} from "@/validators/quizQuestion.schemas";
import mongoose, { FilterQuery } from "mongoose";
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
  const subject = await SubjectModel.findById(subjectId);
  appAssert(subject, NOT_FOUND, "Subject not found");

  const xmlContent = xmlBuffer.toString("utf-8");

  const result = await parseStringPromise(xmlContent, {
    explicitArray: true,
    trim: true,
  });

  const questions = result.quiz?.question || [];
  const importedTypes = new Set<QuizQuestionType>();
  const typeMap: Record<string, QuizQuestionType> = {
    truefalse: QuizQuestionType.TRUE_FALSE,
    multichoice: QuizQuestionType.MULTIPLE_CHOICE,
    shortanswer: QuizQuestionType.FILL_BLANK,
  };

  for (const q of questions) {
    const typeAttr = q.$?.type || "mcq";
    if (typeAttr === "category") continue;

    const questionName = q.name?.[0]?.text?.[0] || "Unnamed question";
    const questionText = q.questiontext?.[0]?.text?.[0] || "";

    // Loại câu hỏi
    const type = typeMap[typeAttr] || QuizQuestionType.MCQ;

    importedTypes.add(type);

    const answers = q.answer || [];
    const options: string[] = [];
    const correctOptions: number[] = [];

    answers.forEach((ans: any) => {
      const text = ans.text?.[0] || "";
      const fraction = parseFloat(ans.$?.fraction || "0");
      options.push(text);
      correctOptions.push(fraction > 0 ? 1 : 0);
    });

    // Tạo object câu hỏi
    const newQuestion = {
      subjectId,
      text: questionText || questionName,
      type,
      options,
      correctOptions,
      points: parseFloat(q.defaultgrade?.[0] || "1"),
      explanation: "",
    };
    importedQuestions.push(newQuestion);
  }
  const quizzes = await QuizQuestionModel.insertMany(importedQuestions);
  return {
    data: quizzes,
    total: importedQuestions.length,
    importedTypes,
  };
};

/**
 * Export questions to XML file.
 * @param quizQuestions Array of questions to export.
 * @returns Object containing XML string and total number of questions.
 */
export const exportXMLFile = async (subjectId: string) => {
  const subject = await SubjectModel.findById(subjectId);
  appAssert(subject, NOT_FOUND, "Subject not found");

  const quizQuestions = await QuizQuestionModel.find({
    subjectId,
  }).lean<IQuizQuestion[]>();

  appAssert(
    quizQuestions.length > 0,
    NOT_FOUND,
    "No questions found for this subject"
  );

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
  const projection: any = {};

  if (subjectId) {
    const subject = await SubjectModel.findById(subjectId);
    appAssert(subject, NOT_FOUND, "Subject not found");
    query.subjectId = subjectId;
  }

  if (type) query.type = type;

  // Nếu có search => dùng $text
  if (search) {
    query.$text = { $search: search };
    projection.score = { $meta: "textScore" };
  }

  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = from;
    if (to) query.createdAt.$lte = to;
  }

  const _page = Math.max(1, page);
  const _limit = Math.min(Math.max(1, limit), 100);
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  // Nếu có search, sort theo score trước, sau đó mới sort theo createdAt nếu muốn
  let sortObj: any = { createdAt: sortDirection };
  if (search) sortObj = { score: { $meta: "textScore" } };

  const [data, total] = await Promise.all([
    QuizQuestionModel.find(query, projection)
      .sort(sortObj)
      .skip((_page - 1) * _limit)
      .limit(_limit),
    QuizQuestionModel.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / _limit);

  return {
    data, // mỗi document sẽ có thêm field "score" nếu search
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

/**
 * Create a new quiz question.
 *
 * @param  subjectId - Subject ID
 * @param  text - Question text
 * @param  Express.Multer.File image - Question image
 * @param  type - Question type
 * @param  options - Question options
 * @param  correctOptions - Correct option indices
 * @param  points - Question points
 * @param  explanation - Question explanation
 * @returns  - Created quiz question
 */
export const createQuizQuestion = async ({
  subjectId,
  text,
  image,
  type,
  options,
  correctOptions,
  points = 1,
  explanation,
}: ICreateQuizQuestionParams) => {
  const subject = await SubjectModel.findById(subjectId);
  appAssert(subject, NOT_FOUND, "Subject not found");

  // 1️⃣ Tạo question trước
  const newQuizQuestion = await QuizQuestionModel.create({
    subjectId,
    text,
    type,
    options,
    correctOptions,
    points,
    explanation,
  });

  // 2️⃣ Nếu có ảnh, upload và cập nhật sau
  if (image) {
    try {
      const questionPrefix = prefixQuizQuestionImage(
        subjectId,
        newQuizQuestion.id
      );
      const { publicUrl, key } = await uploadFile(image, questionPrefix);
      await QuizQuestionModel.findByIdAndUpdate(newQuizQuestion._id, {
        image: publicUrl,
        key,
      });
      newQuizQuestion.image = publicUrl;
      newQuizQuestion.key = key;
    } catch (error) {
      await QuizQuestionModel.findByIdAndDelete(newQuizQuestion._id);
      throw error;
    }
  }
  return newQuizQuestion;
};

/**
 * Update an existing quiz question.
 * Allow admin to update a question.
 * @param  params - Parameters to update a quiz question.
 * @param  params.quizQuestionId - ID of the quiz question to update.
 * @param  params.subjectId - ID of the subject to update the question for.
 * @param  params.text - Updated text of the question.
 * @param  params.image - Updated image of the question.
 * @param  params.type - Updated type of the question.
 * @param  params.options - Updated options of the question.
 * @param  params.correctOptions - Updated correct option indices of the question.
 * @param  params.points= 1 - Updated points of the question.
 * @param  params.explanation - Updated explanation of the question.
 * @returns  Updated quiz question.
 */
export const updateQuizQuestion = async ({
  quizQuestionId,
  subjectId,
  text,
  image,
  type,
  options,
  correctOptions,
  points = 1,
  explanation,
}: IUpdateQuizQuestionParams) => {
  const quizQuestion = await QuizQuestionModel.findById(quizQuestionId);
  appAssert(quizQuestion, NOT_FOUND, "Question not found");

  const subject = await SubjectModel.findById(subjectId);
  appAssert(subject, NOT_FOUND, "Subject not found");

  let publicUrl = quizQuestion.image;
  let key = quizQuestion.key;
  // 2️⃣ Nếu có ảnh, upload và cập nhật sau 1
  if (image) {
    if (quizQuestion.image) {
      if (quizQuestion.key) await removeFile(quizQuestion.key);
    }
    const questionPrefix = prefixQuizQuestionImage(subjectId, quizQuestionId);
    const result = await uploadFile(image, questionPrefix);
    publicUrl = result.publicUrl;
    key = result.key;
  }

  const updatedQuizQuestion = await QuizQuestionModel.findByIdAndUpdate(
    quizQuestionId,
    {
      subjectId,
      text,
      type,
      options,
      correctOptions,
      points,
      explanation,
      image: publicUrl,
      key,
    },
    { new: true }
  );

  appAssert(updatedQuizQuestion, NOT_FOUND, "Question not found");

  return updatedQuizQuestion;
};

/**
 * Delete a question.
 * @param  quizQuestionId - ID of the question to delete.
 * @returns  - Deleted question.
 * @throws  - If the question is in an active quiz.
 */
export const deleteQuizQuestion = async (quizQuestionId: string) => {
  const question = await QuizQuestionModel.findById(quizQuestionId);
  appAssert(question, NOT_FOUND, "Question not found");

  const isInActiveQuiz = await QuizModel.exists({
    isCompleted: false,
    questionIds: { $in: [new mongoose.Types.ObjectId(quizQuestionId)] }, // ✅ dùng $in cho rõ
  });

  appAssert(
    !isInActiveQuiz,
    BAD_REQUEST,
    "Can't delete question in active quiz"
  );

  await QuizQuestionModel.findByIdAndDelete(quizQuestionId);
  if (question.image) {
    if (question.key) await removeFile(question.key);
  }

  return question;
};

/**
 * Delete multiple questions.
 * @param  ids - Array of question IDs to delete.
 * @throws  - If no question IDs are provided.
 * @throws  - If some questions are in active quizzes.
 * @returns  - A success message.
 */
export const deleteMultipleQuizQuestions = async (ids: string[]) => {
  appAssert(ids.length > 0, BAD_REQUEST, "No question IDs provided");

  // Kiem tra xem cac ID cua cau hoi co ton tai khong
  const questions = await QuizQuestionModel.find({
    _id: { $in: ids },
  });
  appAssert(
    questions.length === ids.length,
    BAD_REQUEST,
    "Some question IDs are invalid"
  );

  // Kiểm tra xem có câu hỏi nào đang được sử dụng trong quiz chưa hoàn tất không
  const activeQuizzes = await QuizModel.find({
    questionIds: { $in: ids },
    isCompleted: false,
  });

  appAssert(
    activeQuizzes.length === 0,
    BAD_REQUEST,
    "Some questions are in active quizzes"
  );

  // Xóa thật (hoặc soft delete)
  await QuizQuestionModel.deleteMany({ _id: { $in: ids } });

  for (const question of questions) {
    if (question.image) {
      if (question.key) await removeFile(question.key);
    }
  }

  return { message: "Deleted successfully" };
};

export const getRandomQuestions = async ({
  count = 10,
  subjectId,
}: IGetRandomQuestionsParams) => {
  const subject = await SubjectModel.findById(subjectId);
  appAssert(subject, NOT_FOUND, "Subject not found");

  const questions = await QuizQuestionModel.aggregate([
    { $match: { subjectId } },
    { $sample: { size: count } },
  ]);

  return questions;
};
