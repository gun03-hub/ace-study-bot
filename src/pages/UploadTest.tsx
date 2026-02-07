import React, { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PdfUploader from "@/components/PdfUploader";
import QuizSetup from "@/components/QuizSetup";
import QuizPlayer from "@/components/QuizPlayer";
import QuizResults from "@/components/QuizResults";
import type { QuizQuestion } from "@/types/quiz";

type Phase = "upload" | "quiz" | "results";

const UploadTest: React.FC = () => {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("upload");
  const [pdfText, setPdfText] = useState("");
  const [fileName, setFileName] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [completedQuestions, setCompletedQuestions] = useState<QuizQuestion[]>([]);
  const [generating, setGenerating] = useState(false);

  const handleTextExtracted = (text: string, name: string) => {
    setPdfText(text);
    setFileName(name);
  };

  const handleGenerateTest = async (count: number, types: string[]) => {
    if (!pdfText) {
      toast.error("Please upload a PDF first");
      return;
    }

    setGenerating(true);
    try {
      const response = await supabase.functions.invoke("generate-questions", {
        body: { text: pdfText, questionCount: count, questionTypes: types },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to generate questions");
      }

      const data = response.data;
      if (data.error) {
        throw new Error(data.error);
      }

      const generatedQuestions: QuizQuestion[] = data.questions.map(
        (q: any, i: number) => ({
          ...q,
          question_number: i + 1,
        })
      );

      setQuestions(generatedQuestions);
      setPhase("quiz");
      toast.success(`Generated ${generatedQuestions.length} questions!`);
    } catch (err: any) {
      console.error("Generation error:", err);
      toast.error(err.message || "Failed to generate questions. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleQuizComplete = async (answered: QuizQuestion[]) => {
    setCompletedQuestions(answered);
    setPhase("results");

    // Save to database
    if (user) {
      try {
        const correct = answered.filter((q) => q.is_correct).length;
        const score = Math.round((correct / answered.length) * 100);
        const topic = fileName.replace(".pdf", "");

        const { data: resultData, error: resultError } = await supabase
          .from("test_results")
          .insert({
            user_id: user.id,
            topic,
            total_questions: answered.length,
            correct_answers: correct,
            score,
            question_types: [...new Set(answered.map((q) => q.question_type))],
          })
          .select()
          .single();

        if (resultError) throw resultError;

        const questionsToInsert = answered.map((q) => ({
          test_result_id: resultData.id,
          user_id: user.id,
          question_type: q.question_type,
          question: q.question,
          options: q.options as any,
          correct_answer: q.correct_answer,
          user_answer: q.user_answer || null,
          is_correct: q.is_correct || false,
          question_number: q.question_number,
        }));

        const { error: qError } = await supabase
          .from("test_questions")
          .insert(questionsToInsert);

        if (qError) throw qError;

        toast.success("Results saved!");
      } catch (err) {
        console.error("Save error:", err);
        toast.error("Failed to save results to database");
      }
    }
  };

  const handleRetake = () => {
    setPhase("upload");
    setQuestions([]);
    setCompletedQuestions([]);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold mb-1">Upload & Test</h1>
        <p className="text-muted-foreground text-sm">
          Upload a PDF and generate AI-powered practice questions
        </p>
      </motion.div>

      {phase === "upload" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <PdfUploader onTextExtracted={handleTextExtracted} disabled={generating} />
          {pdfText && (
            <QuizSetup
              onStart={handleGenerateTest}
              loading={generating}
              hasText={!!pdfText}
            />
          )}
        </motion.div>
      )}

      {phase === "quiz" && (
        <QuizPlayer questions={questions} onComplete={handleQuizComplete} />
      )}

      {phase === "results" && (
        <QuizResults questions={completedQuestions} onRetake={handleRetake} />
      )}
    </div>
  );
};

export default UploadTest;
