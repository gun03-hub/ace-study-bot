import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, RotateCcw, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import type { QuizQuestion } from "@/types/quiz";

interface QuizResultsProps {
  questions: QuizQuestion[];
  onRetake: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({ questions, onRetake }) => {
  const correct = questions.filter((q) => q.is_correct).length;
  const total = questions.length;
  const score = Math.round((correct / total) * 100);

  const getScoreColor = () => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const getScoreMessage = () => {
    if (score >= 90) return "Outstanding! 🏆";
    if (score >= 80) return "Great job! 🎉";
    if (score >= 60) return "Good effort! 💪";
    if (score >= 40) return "Keep practicing! 📚";
    return "Review the material 📖";
  };

  return (
    <div className="space-y-6">
      {/* Score Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="glass-card glow-primary overflow-hidden">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <Trophy className="h-12 w-12 text-primary" />
            </div>
            <h2 className={`text-5xl font-bold ${getScoreColor()} mb-2`}>
              {score}%
            </h2>
            <p className="text-lg text-foreground font-medium">{getScoreMessage()}</p>
            <p className="mt-2 text-muted-foreground">
              {correct} correct out of {total} questions
            </p>
            <Button onClick={onRetake} className="mt-6 gap-2">
              <RotateCcw className="h-4 w-4" />
              Take Another Test
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Detailed Review */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Detailed Review</h3>
        {questions.map((q, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className={`border ${q.is_correct ? "border-success/30" : "border-destructive/30"}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  {q.is_correct ? (
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px]">
                        {q.question_type.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">Q{q.question_number}</span>
                    </div>
                    <CardTitle className="text-sm leading-relaxed">{q.question}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pl-11 space-y-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Your Answer:</p>
                  <p className={`text-sm break-words ${q.is_correct ? "text-success" : "text-destructive"}`}>
                    {q.user_answer || "(No answer)"}
                  </p>
                </div>
                {!q.is_correct && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Correct Answer:</p>
                    <p className="text-sm text-success break-words">{q.correct_answer}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default QuizResults;
