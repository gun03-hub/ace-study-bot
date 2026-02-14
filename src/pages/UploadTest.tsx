import React, { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PdfUploader from "@/components/PdfUploader";
import TopicSearch from "@/components/TopicSearch";
import QuizSetup from "@/components/QuizSetup";
import QuizPlayer from "@/components/QuizPlayer";
import QuizResults from "@/components/QuizResults";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Share2, Copy, Check, Upload, Globe } from "lucide-react";
import type { QuizQuestion } from "@/types/quiz";

type Phase = "upload" | "quiz" | "results";

const UploadTest: React.FC = () => {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("upload");
  const [pdfText, setPdfText] = useState("");
  const [fileName, setFileName] = useState("");
  const [topicName, setTopicName] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [completedQuestions, setCompletedQuestions] = useState<QuizQuestion[]>([]);
  const [generating, setGenerating] = useState(false);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [inputMode, setInputMode] = useState<"pdf" | "topic">("pdf");

  const handleTextExtracted = (text: string, name: string) => {
    setPdfText(text);
    setFileName(name);
  };

  const handleTopicSelected = (topic: string) => {
    setTopicName(topic);
  };

  const handleGenerateTest = async (count: number, types: string[]) => {
    if (inputMode === "pdf" && !pdfText) {
      toast.error("Please upload a PDF first");
      return;
    }
    if (inputMode === "topic" && !topicName) {
      toast.error("Please enter a topic first");
      return;
    }

    setGenerating(true);
    try {
      let response;
      if (inputMode === "pdf") {
        response = await supabase.functions.invoke("generate-questions", {
          body: { text: pdfText, questionCount: count, questionTypes: types },
        });
      } else {
        response = await supabase.functions.invoke("generate-from-topic", {
          body: { topic: topicName, questionCount: count, questionTypes: types },
        });
      }

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

    if (user) {
      try {
        const correct = answered.filter((q) => q.is_correct).length;
        const score = Math.round((correct / answered.length) * 100);
        const topic = inputMode === "pdf" ? fileName.replace(".pdf", "") : topicName;

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

  const handleShareTest = async () => {
    if (!user || questions.length === 0) return;

    try {
      const topic = inputMode === "pdf" ? fileName.replace(".pdf", "") : topicName;
      const questionsData = questions.map((q) => ({
        question_type: q.question_type,
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
      }));

      const { data, error } = await supabase
        .from("shared_tests")
        .insert({
          created_by: user.id,
          topic,
          questions: questionsData,
          question_count: questions.length,
          question_types: [...new Set(questions.map((q) => q.question_type))],
        })
        .select("share_code")
        .single();

      if (error) throw error;
      setShareCode(data.share_code);
      toast.success("Shareable link created!");
    } catch (err: any) {
      console.error("Share error:", err);
      toast.error("Failed to create shareable link");
    }
  };

  const copyShareLink = () => {
    if (!shareCode) return;
    const link = `${window.location.origin}/shared/${shareCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRetake = () => {
    setPhase("upload");
    setQuestions([]);
    setCompletedQuestions([]);
    setShareCode(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold mb-1">Upload & Test</h1>
        <p className="text-muted-foreground text-sm">
          Upload a PDF or search a topic to generate AI-powered practice questions
        </p>
      </motion.div>

      {phase === "upload" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as "pdf" | "topic")}>
            <TabsList className="w-full">
              <TabsTrigger value="pdf" className="flex-1 gap-2">
                <Upload className="h-4 w-4" />
                Upload PDF
              </TabsTrigger>
              <TabsTrigger value="topic" className="flex-1 gap-2">
                <Globe className="h-4 w-4" />
                Search Topic
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pdf" className="mt-4">
              <PdfUploader onTextExtracted={handleTextExtracted} disabled={generating} />
            </TabsContent>

            <TabsContent value="topic" className="mt-4">
              <TopicSearch onTopicSelected={handleTopicSelected} disabled={generating} />
            </TabsContent>
          </Tabs>

          {((inputMode === "pdf" && pdfText) || (inputMode === "topic" && topicName)) && (
            <QuizSetup
              onStart={handleGenerateTest}
              loading={generating}
              hasText={inputMode === "pdf" ? !!pdfText : !!topicName}
            />
          )}
        </motion.div>
      )}

      {phase === "quiz" && (
        <div className="space-y-4">
          {/* Share button */}
          <div className="flex justify-end">
            {!shareCode ? (
              <Button variant="outline" size="sm" className="gap-2" onClick={handleShareTest}>
                <Share2 className="h-4 w-4" />
                Share Test
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-3 py-1.5 rounded-md font-mono">
                  {`${window.location.origin}/shared/${shareCode}`}
                </code>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={copyShareLink}>
                  {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            )}
          </div>
          <QuizPlayer questions={questions} onComplete={handleQuizComplete} />
        </div>
      )}

      {phase === "results" && (
        <QuizResults questions={completedQuestions} onRetake={handleRetake} />
      )}
    </div>
  );
};

export default UploadTest;
