import { QuizQuestionModel } from "@/models";
import IQuizQuestion, { QuizQuestionType } from "@/types/quizQuestion.type";
import { parseStringPromise } from "xml2js";
import { create } from "xmlbuilder";

/**
 * Import questions from an XML file.
 * Checks file content, parses XML, and imports questions into the database.
 *
 * @param xmlBuffer - Buffer containing the XML content.
 * @param courseId - ID of the course to import questions into.
 * @returns Promise resolving to an array of imported questions.
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

/**
 * Export questions to XML file.
 * @param quizQuestions Array of questions to export.
 * @returns Object containing XML string and total number of questions.
 */
export const exportXMLFile = (
  quizQuestions: IQuizQuestion[],
  courseCode = "FU-PRJ321"
) => {
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
    .txt(`$course$/top/Default for ${courseCode}`);
  categoryQuestion
    .ele("info", { format: "moodle_auto_format" })
    .ele("text")
    .txt(
      `The default category for questions shared in context '${courseCode}'.`
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
