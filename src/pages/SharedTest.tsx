import React, { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import QuizPlayer from "@/components/QuizPlayer";
import QuizResults from "@/components/QuizResults";
import { Card, CardContent } from "@/components/ui/card";
import { Share2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { QuizQuestion } from "@/types/quiz";

const SharedTest: React.FC = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  const { user } = useAuth();
  const [phase, setPhase] = useState<"quiz" | "results">("quiz");
  const [completedQuestions, setCompletedQuestions] = useState<QuizQuestion[]>([]);

  const { data: sharedTest, isLoading, error } = useQuery({
    queryKey: ["shared-test", shareCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shared_tests")
        .select("*")
        .eq("share_code", shareCode!)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!shareCode && !!user,
  });

  if (!user) {
    return <Navigate to={`/auth?redirect=/shared/${shareCode}`} replace />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !sharedTest) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Test Not Found</h3>
            <p className="text-muted-foreground text-sm">
              This shared test link is invalid or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const questions: QuizQuestion[] = (sharedTest.questions as any[]).map(
    (q: any, i: number) => ({
      ...q,
      question_number: i + 1,
    })
  );

  const handleQuizComplete = async (answered: QuizQuestion[]) => {
    setCompletedQuestions(answered);
    setPhase("results");

    if (user) {
      try {
        const correct = answered.filter((q) => q.is_correct).length;
        const score = Math.round((correct / answered.length) * 100);

        const { data: resultData, error: resultError } = await supabase
          .from("test_results")
          .insert({
            user_id: user.id,
            topic: sharedTest.topic,
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
        toast.error("Failed to save results");
      }
    }
  };

  const handleRetake = () => {
    setPhase("quiz");
    setCompletedQuestions([]);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <Share2 className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Shared Test</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Topic: <span className="text-foreground font-medium">{sharedTest.topic}</span> • {sharedTest.question_count} questions
        </p>
      </motion.div>

      {phase === "quiz" && (
        <QuizPlayer questions={questions} onComplete={handleQuizComplete} />
      )}

      {phase === "results" && (
        <QuizResults questions={completedQuestions} onRetake={handleRetake} />
      )}
    </div>
  );
};

export default SharedTest;
