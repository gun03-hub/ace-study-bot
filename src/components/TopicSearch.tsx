import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Globe } from "lucide-react";
import { motion } from "framer-motion";

interface TopicSearchProps {
  onTopicSelected: (topic: string) => void;
  disabled?: boolean;
}

const TopicSearch: React.FC<TopicSearchProps> = ({ onTopicSelected, disabled }) => {
  const [topic, setTopic] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim().length >= 2) {
      onTopicSelected(topic.trim());
    }
  };

  return (
    <Card className="glass-card overflow-hidden">
      <CardContent className="p-0">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <form onSubmit={handleSubmit}>
            <div className={`flex flex-col items-center justify-center gap-4 p-10 border-2 border-dashed rounded-lg transition-all border-border hover:border-primary/50 hover:bg-muted/30 ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Globe className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center w-full max-w-md">
                <p className="text-base font-medium text-foreground mb-3">
                  Enter a topic to generate questions
                </p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Quantum Physics, World War II, Machine Learning..."
                    className="pl-10"
                    disabled={disabled}
                    maxLength={200}
                  />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  AI will research the topic and generate practice questions
                </p>
              </div>
            </div>
          </form>
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default TopicSearch;
