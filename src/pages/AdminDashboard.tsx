import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, BarChart3, Shield, Trash2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

const CHART_COLORS = [
  "hsl(187, 80%, 48%)",
  "hsl(160, 60%, 50%)",
  "hsl(270, 60%, 60%)",
  "hsl(35, 85%, 60%)",
  "hsl(0, 62%, 55%)",
];

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const queryClient = useQueryClient();

  // Fetch all profiles
  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch all test results
  const { data: allResults = [], isLoading: resultsLoading } = useQuery({
    queryKey: ["admin-test-results"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_results")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch all user roles
  const { data: userRoles = [] } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*");
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Delete test result mutation
  const deleteResult = useMutation({
    mutationFn: async (resultId: string) => {
      // Delete questions first
      const { error: qErr } = await supabase
        .from("test_questions")
        .delete()
        .eq("test_result_id", resultId);
      if (qErr) throw qErr;

      const { error } = await supabase
        .from("test_results")
        .delete()
        .eq("id", resultId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-test-results"] });
      toast.success("Test result deleted");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete");
    },
  });

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Checking permissions...
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Platform stats
  const totalUsers = profiles.length;
  const totalTests = allResults.length;
  const avgScore = totalTests > 0
    ? Math.round(allResults.reduce((s, r) => s + Number(r.score), 0) / totalTests)
    : 0;
  const totalQuestions = allResults.reduce((s, r) => s + r.total_questions, 0);

  // Score distribution for pie chart
  const scoreRanges = [
    { name: "90-100%", value: allResults.filter(r => Number(r.score) >= 90).length },
    { name: "70-89%", value: allResults.filter(r => Number(r.score) >= 70 && Number(r.score) < 90).length },
    { name: "50-69%", value: allResults.filter(r => Number(r.score) >= 50 && Number(r.score) < 70).length },
    { name: "Below 50%", value: allResults.filter(r => Number(r.score) < 50).length },
  ].filter(d => d.value > 0);

  // Top topics
  const topicCounts: Record<string, number> = {};
  allResults.forEach(r => {
    topicCounts[r.topic] = (topicCounts[r.topic] || 0) + 1;
  });
  const topTopics = Object.entries(topicCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([topic, count]) => ({
      topic: topic.length > 20 ? topic.substring(0, 20) + "…" : topic,
      count,
    }));

  const getRoleForUser = (userId: string) => {
    const role = userRoles.find((r: any) => r.user_id === userId);
    return role ? (role as any).role : "student";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground text-sm">Platform management & analytics</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: totalUsers, icon: Users },
          { label: "Total Tests", value: totalTests, icon: BarChart3 },
          { label: "Avg Score", value: `${avgScore}%`, icon: BarChart3 },
          { label: "Questions Generated", value: totalQuestions, icon: BarChart3 },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <stat.icon className="h-5 w-5 text-primary" />
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

      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analytics">Platform Analytics</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="content">Content Moderation</TabsTrigger>
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-base">Score Distribution</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  {scoreRanges.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={scoreRanges} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" strokeWidth={2} stroke="hsl(var(--background))">
                          {scoreRanges.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No data yet</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader><CardTitle className="text-base">Popular Topics</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  {topTopics.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topTopics} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                        <YAxis dataKey="topic" type="category" width={120} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                        <Bar dataKey="count" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No data yet</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">All Users ({profiles.length})</CardTitle></CardHeader>
            <CardContent>
              {profilesLoading ? (
                <p className="text-muted-foreground text-sm">Loading...</p>
              ) : (
                <div className="space-y-3">
                  {profiles.map((p: any) => {
                    const role = getRoleForUser(p.user_id);
                    const userTests = allResults.filter(r => r.user_id === p.user_id);
                    const userAvg = userTests.length > 0
                      ? Math.round(userTests.reduce((s, r) => s + Number(r.score), 0) / userTests.length)
                      : 0;
                    return (
                      <div key={p.id} className="flex items-center gap-4 rounded-lg border border-border p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-sm">
                          {(p.display_name || p.email || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.display_name || "No name"}</p>
                          <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                        </div>
                        <Badge variant={role === "admin" ? "default" : "secondary"} className="text-xs">
                          {role}
                        </Badge>
                        <div className="text-right">
                          <p className="text-sm font-medium">{userTests.length} tests</p>
                          <p className="text-xs text-muted-foreground">Avg: {userAvg}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Moderation Tab */}
        <TabsContent value="content">
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">All Test Results ({allResults.length})</CardTitle></CardHeader>
            <CardContent>
              {resultsLoading ? (
                <p className="text-muted-foreground text-sm">Loading...</p>
              ) : allResults.length === 0 ? (
                <p className="text-muted-foreground text-sm">No test results yet.</p>
              ) : (
                <div className="space-y-3">
                  {allResults.slice(0, 50).map((r: any) => {
                    const profile = profiles.find((p: any) => p.user_id === r.user_id);
                    return (
                      <div key={r.id} className="flex items-center gap-4 rounded-lg border border-border p-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{r.topic}</p>
                          <p className="text-xs text-muted-foreground">
                            By {profile?.display_name || profile?.email || "Unknown"} • Score: {Number(r.score)}% • {r.total_questions} questions
                          </p>
                        </div>
                        <Badge variant={Number(r.score) >= 70 ? "default" : Number(r.score) >= 50 ? "secondary" : "destructive"}>
                          {Number(r.score)}%
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            if (confirm("Delete this test result?")) {
                              deleteResult.mutate(r.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
