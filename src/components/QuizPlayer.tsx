import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { QuizQuestion } from "@/types/quiz";

interface QuizPlayerProps {
  questions: QuizQuestion[];
  onComplete: (answers: QuizQuestion[]) => void;
}

const typeLabels: Record<string, string> = {
  mcq: "Multiple Choice",
  vsa: "Very Short Answer",
  lsa: "Long Answer",
};

const typeBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
  mcq: "default",
  vsa: "secondary",
  lsa: "outline",
};

const QuizPlayer: React.FC<QuizPlayerProps> = ({ questions, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const currentQ = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isLast = currentIndex === questions.length - 1;

  const setAnswer = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: value }));
  };

  const handleNext = () => {
    if (isLast) {
      const completedQuestions = questions.map((q, i) => ({
        ...q,
        user_answer: answers[i] || "",
        is_correct: checkAnswer(q, answers[i] || ""),
      }));
      onComplete(completedQuestions);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const checkAnswer = (q: QuizQuestion, answer: string): boolean => {
    if (q.question_type === "mcq") {
      return answer.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
    }
    // For VSA/LSA, we do a simple keyword match (at least 50% of key words)
    const correctWords = q.correct_answer.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const answerWords = answer.toLowerCase().split(/\s+/);
    const matchCount = correctWords.filter((w) => answerWords.some((aw) => aw.includes(w))).length;
    return matchCount >= Math.ceil(correctWords.length * 0.3);
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground font-mono">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-primary font-mono font-medium">
            {Math.round(progress)}%
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="glass-card">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <Badge variant={typeBadgeVariant[currentQ.question_type]}>
                  {typeLabels[currentQ.question_type]}
                </Badge>
                <span className="text-xs font-mono text-muted-foreground">
                  Q{currentQ.question_number}
                </span>
              </div>
              <CardTitle className="text-lg leading-relaxed mt-3">
                {currentQ.question}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentQ.question_type === "mcq" && currentQ.options ? (
                <RadioGroup
                  value={answers[currentIndex] || ""}
                  onValueChange={setAnswer}
                  className="space-y-3"
                >
                  {currentQ.options.map((option, idx) => (
                    <label
                      key={idx}
                      className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-all ${
                        answers[currentIndex] === option
                          ? "border-primary bg-primary/5 glow-primary"
                          : "border-border hover:border-primary/30 hover:bg-muted/20"
                      }`}
                    >
                      <RadioGroupItem value={option} className="mt-0.5 shrink-0" />
                      <span className="text-sm leading-relaxed break-words whitespace-normal">
                        {String.fromCharCode(65 + idx)}. {option}
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              ) : (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    {currentQ.question_type === "vsa"
                      ? "Write a brief answer (1-3 sentences)"
                      : "Write a detailed answer (3-6 sentences)"}
                  </Label>
                  <Textarea
                    value={answers[currentIndex] || ""}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    rows={currentQ.question_type === "lsa" ? 6 : 3}
                    className="resize-none"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <Button
          onClick={handleNext}
          disabled={!answers[currentIndex]}
          className={isLast ? "gradient-primary gap-2" : "gap-2"}
        >
          {isLast ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Submit Test
            </>
          ) : (
            <>
              Next
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default QuizPlayer;
