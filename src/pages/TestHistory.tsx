import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, Clock, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

const TestHistory: React.FC = () => {
  const { user } = useAuth();
  const [expandedTest, setExpandedTest] = useState<string | null>(null);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["test-history", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_results")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: questionsMap = {} } = useQuery({
    queryKey: ["test-questions", expandedTest],
    queryFn: async () => {
      if (!expandedTest) return {};
      const { data, error } = await supabase
        .from("test_questions")
        .select("*")
        .eq("test_result_id", expandedTest)
        .order("question_number", { ascending: true });

      if (error) throw error;
      return { [expandedTest]: data };
    },
    enabled: !!expandedTest,
  });

  const toggleExpand = (id: string) => {
    setExpandedTest((prev) => (prev === id ? null : id));
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 70) return "default";
    if (score >= 50) return "secondary";
    return "destructive";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading history...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1">Test History</h1>
        <p className="text-muted-foreground text-sm">Review past quizzes and identify areas for improvement</p>
      </motion.div>

      {results.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No test history</h3>
            <p className="text-muted-foreground text-sm">
              Complete a test to see your history here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {results.map((result, i) => {
            const isExpanded = expandedTest === result.id;
            const questions = questionsMap[result.id] || [];

            return (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="glass-card overflow-hidden">
                  <button
                    onClick={() => toggleExpand(result.id)}
                    className="w-full text-left"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">{result.topic}</CardTitle>
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {format(new Date(result.created_at), "MMM dd, yyyy 'at' h:mm a")}
                            </div>
                            <Badge variant={getScoreBadgeVariant(Number(result.score))}>
                              {Number(result.score)}%
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {result.correct_answers}/{result.total_questions} correct
                            </span>
                            {result.question_types.map((t) => (
                              <Badge key={t} variant="outline" className="text-[10px]">
                                {t.toUpperCase()}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-muted-foreground">
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <CardContent className="pt-0 border-t border-border">
                          {questions.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4">Loading questions...</p>
                          ) : (
                            <div className="space-y-4 pt-4">
                              {questions.map((q: any) => (
                                <div
                                  key={q.id}
                                  className={`rounded-lg border p-4 ${
                                    q.is_correct ? "border-success/20 bg-success/5" : "border-destructive/20 bg-destructive/5"
                                  }`}
                                >
                                  <div className="flex items-start gap-2 mb-2">
                                    {q.is_correct ? (
                                      <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                                    )}
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className="text-[10px]">
                                          {q.question_type.toUpperCase()}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground font-mono">
                                          Q{q.question_number}
                                        </span>
                                      </div>
                                      <p className="text-sm font-medium leading-relaxed">{q.question}</p>
                                    </div>
                                  </div>

                                  <div className="ml-6 space-y-1.5">
                                    <div>
                                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Your Answer</p>
                                      <p className={`text-sm break-words ${q.is_correct ? "text-success" : "text-destructive"}`}>
                                        {q.user_answer || "(No answer)"}
                                      </p>
                                    </div>
                                    {!q.is_correct && (
                                      <div>
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Correct Answer</p>
                                        <p className="text-sm text-success break-words">{q.correct_answer}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TestHistory;
