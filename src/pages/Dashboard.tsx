
import { AlertTriangle, MapPin, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

// Types
interface ReportData {
  id: string;
  type: string;
  location: string;
  time: string;
  status: string;
}

interface TopReporter {
  id: string;
  name: string;
  points: number;
  reports: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (error) {
        toast.error("Failed to load profile data");
        throw error;
      }
      
      return data;
    },
    enabled: !!user
  });

  // Fetch recent violations
  const { data: recentViolations = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["recentReports", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);
      
      if (error) {
        toast.error("Failed to load reports");
        throw error;
      }
      
      return data.map(report => ({
        id: report.id,
        type: report.violation_type,
        location: report.location,
        time: formatTimeAgo(new Date(report.created_at)), 
        status: report.status
      }));
    },
    enabled: !!user
  });

  // Fetch top reporters
  const { data: topReporters = [], isLoading: reportersLoading } = useQuery({
    queryKey: ["topReporters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, points, total_reports")
        .order("points", { ascending: false })
        .limit(3);
      
      if (error) {
        toast.error("Failed to load top reporters");
        throw error;
      }
      
      return data.map(reporter => ({
        id: reporter.id,
        name: reporter.username || "Anonymous User",
        points: reporter.points,
        reports: reporter.total_reports
      }));
    }
  });

  // Helper function to format time
  function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  return (
    <div className="px-4 py-6 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {profile?.username || user?.email?.split('@')[0] || "User"}
          </p>
        </div>
        <div className="flex items-center space-x-1 bg-secondary/20 px-3 py-1 rounded-full">
          <Trophy className="h-4 w-4 text-secondary" />
          <span className="text-sm font-medium">{profile?.points || 0} pts</span>
        </div>
      </div>

      {/* Quick Action */}
      <Card className="mb-6 bg-primary text-primary-foreground">
        <CardContent className="p-4 flex justify-between items-center">
          <div>
            <h3 className="font-semibold mb-1">Spotted a violation?</h3>
            <p className="text-sm text-primary-foreground/80">Report it now and earn points</p>
          </div>
          <Button 
            onClick={() => navigate("/app/report")}
            variant="secondary" 
            size="sm" 
            className="whitespace-nowrap"
          >
            Report Now
          </Button>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Recent Violations</h2>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/app/profile")}>
            View All
          </Button>
        </div>

        <div className="space-y-3">
          {reportsLoading ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">Loading reports...</p>
            </div>
          ) : recentViolations.length > 0 ? (
            recentViolations.map(violation => (
              <Card key={violation.id} className="overflow-hidden">
                <CardContent className="p-4 flex items-start">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <h3 className="font-medium">{violation.type}</h3>
                      <span 
                        className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                          violation.status === "verified" 
                            ? "bg-success-light text-success"
                            : violation.status === "rejected"
                            ? "bg-violation-light text-violation"
                            : "bg-secondary/20 text-secondary-foreground"
                        }`}
                      >
                        {violation.status}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span>{violation.location}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {violation.time}
                    </div>
                  </div>
                  <AlertTriangle className={`h-5 w-5 ${
                    violation.status === "verified" 
                      ? "text-success"
                      : violation.status === "rejected"
                      ? "text-violation"
                      : "text-secondary"
                  }`} />
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No reports yet. Report your first violation!</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Reporters Leaderboard */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Top Reporters</h2>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/app/leaderboard")}>
            View All
          </Button>
        </div>

        <Card>
          <CardContent className="p-4 divide-y">
            {reportersLoading ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground">Loading leaderboard...</p>
              </div>
            ) : topReporters.length > 0 ? (
              topReporters.map((reporter, index) => (
                <div key={reporter.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center mr-3 ${
                      index === 0 
                        ? "bg-yellow-100 text-yellow-600" 
                        : index === 1 
                        ? "bg-gray-100 text-gray-600"
                        : "bg-amber-100 text-amber-600"
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{reporter.name}</p>
                      <p className="text-xs text-muted-foreground">{reporter.reports} reports</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Trophy className="h-4 w-4 text-secondary" />
                    <span className="font-medium">{reporter.points}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No reporters yet. Be the first!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
