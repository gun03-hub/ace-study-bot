import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Target, BookOpen, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

const CHART_COLORS = [
  "hsl(187, 80%, 48%)",
  "hsl(160, 60%, 50%)",
  "hsl(270, 60%, 60%)",
  "hsl(35, 85%, 60%)",
  "hsl(0, 62%, 55%)",
];

const Analytics: React.FC = () => {
  const { user } = useAuth();

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["test-results", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_results")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const totalTests = results.length;
  const avgScore = totalTests > 0
    ? Math.round(results.reduce((sum, r) => sum + Number(r.score), 0) / totalTests)
    : 0;
  const totalQuestions = results.reduce((sum, r) => sum + r.total_questions, 0);
  const totalCorrect = results.reduce((sum, r) => sum + r.correct_answers, 0);

  // Pie chart data
  const pieData = [
    { name: "Correct", value: totalCorrect },
    { name: "Incorrect", value: totalQuestions - totalCorrect },
  ];

  // Bar chart data (last 10 tests)
  const barData = results.slice(-10).map((r) => ({
    date: format(new Date(r.created_at), "MMM dd"),
    score: Number(r.score),
    topic: r.topic.length > 15 ? r.topic.substring(0, 15) + "…" : r.topic,
  }));

  const stats = [
    { label: "Tests Taken", value: totalTests, icon: BookOpen, color: "text-primary" },
    { label: "Avg Score", value: `${avgScore}%`, icon: Target, color: "text-primary" },
    { label: "Questions Answered", value: totalQuestions, icon: TrendingUp, color: "text-primary" },
    { label: "Best Score", value: totalTests > 0 ? `${Math.max(...results.map((r) => Number(r.score)))}%` : "—", icon: Trophy, color: "text-primary" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading analytics...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1">Analytics Dashboard</h1>
        <p className="text-muted-foreground text-sm">Track your learning progress</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {totalTests === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No tests yet</h3>
            <p className="text-muted-foreground text-sm">
              Upload a PDF and take a test to see your analytics here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base">Overall Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        dataKey="value"
                        strokeWidth={2}
                        stroke="hsl(var(--background))"
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base">Score Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                      <Bar dataKey="score" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
