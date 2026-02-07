import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Settings2 } from "lucide-react";

interface QuizSetupProps {
  onStart: (count: number, types: string[]) => void;
  loading: boolean;
  hasText: boolean;
}

const questionCounts = [5, 10, 15, 20, 25, 30];

const questionTypeOptions = [
  { id: "mcq", label: "MCQ", description: "Multiple Choice Questions" },
  { id: "vsa", label: "VSA", description: "Very Short Answer" },
  { id: "lsa", label: "LSA", description: "Long/Short Answer" },
];

const QuizSetup: React.FC<QuizSetupProps> = ({ onStart, loading, hasText }) => {
  const [count, setCount] = useState<number>(5);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["mcq"]);

  const toggleType = (type: string) => {
    setSelectedTypes((prev) => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev; // Must have at least one
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  };

  const selectAll = () => {
    setSelectedTypes(["mcq", "vsa", "lsa"]);
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings2 className="h-5 w-5 text-primary" />
          Test Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Number of Questions</Label>
          <Select value={count.toString()} onValueChange={(v) => setCount(Number(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {questionCounts.map((n) => (
                <SelectItem key={n} value={n.toString()}>
                  {n} Questions
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Question Types</Label>
            <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs text-primary h-auto py-1">
              Select All
            </Button>
          </div>
          <div className="space-y-2">
            {questionTypeOptions.map((type) => (
              <label
                key={type.id}
                className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer transition-colors hover:bg-muted/30"
              >
                <Checkbox
                  checked={selectedTypes.includes(type.id)}
                  onCheckedChange={() => toggleType(type.id)}
                />
                <div>
                  <p className="text-sm font-medium">{type.label}</p>
                  <p className="text-xs text-muted-foreground">{type.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <Button
          className="w-full gradient-primary gap-2"
          onClick={() => onStart(count, selectedTypes)}
          disabled={loading || !hasText || selectedTypes.length === 0}
        >
          {loading ? (
            <>
              <Sparkles className="h-4 w-4 animate-spin" />
              Generating Questions...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Test
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuizSetup;
