import { QuizQuestionModel } from "@/models";
import { QuizQuestionType } from "@/types/quizQuestion.type";
import { parseStringPromise } from "xml2js";

/**
 * Import questions from XML file.
 * Check if file exists, parse XML, and import questions into database.
 * @param {Buffer} xmlBuffer - Buffer containing XML content.
 * @param {string} courseId - ID of course to import questions into.
 * @returns {Promise<IQuizQuestion[]>} - Promise that resolves into an array of imported questions.
 */
export const importXMLFile = async (xmlBuffer: Buffer, courseId: string) => {
  // 1️⃣ Convert buffer → string
  const xmlContent = xmlBuffer.toString("utf-8");

  // 2️⃣ Parse XML → JSON
  const result = await parseStringPromise(xmlContent, {
    explicitArray: true,
    trim: true,
  });
  const questions = result.quiz?.question || [];
  console.log(`📄 Found ${questions.length} questions`);

  const importedQuestions = [];
  const importedTypes: QuizQuestionType[] = [];

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
    if (!importedTypes.includes(type)) importedTypes.push(type);

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
      courseId,
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
