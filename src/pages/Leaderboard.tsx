
import { Trophy, User, Medal, ArrowUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

// Define types
interface LeaderboardUser {
  id: string;
  name: string;
  points: number;
  position: number;
  change: "up" | "same" | "down";
}

const Leaderboard = () => {
  const [timeRange, setTimeRange] = useState<"weekly" | "monthly" | "all-time">("weekly");
  
  // Fetch leaderboard data based on time range
  const { data: leaderboardUsers = [], isLoading } = useQuery({
    queryKey: ["leaderboard", timeRange],
    queryFn: async () => {
      try {
        // For a real app, you would have a proper timeframe filter in the query
        // This is a simplified implementation
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, points, total_reports")
          .order("points", { ascending: false })
          .limit(10);
        
        if (error) {
          throw error;
        }
        
        // Transform data format and add mock "change" field
        // In a real app, you would track position changes over time
        return data.map((user, index) => ({
          id: user.id,
          name: user.username || "Anonymous User",
          points: user.points,
          position: index + 1,
          // Randomly assign change status for demo purposes
          change: ["up", "same", "down"][Math.floor(Math.random() * 3)] as "up" | "same" | "down"
        }));
      } catch (error: any) {
        toast.error("Failed to load leaderboard");
        console.error("Error fetching leaderboard:", error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value as "weekly" | "monthly" | "all-time");
  };

  // Generate title based on time range
  const getTitle = () => {
    switch (timeRange) {
      case "weekly":
        return "Weekly Top Reporters";
      case "monthly":
        return "Monthly Top Reporters";
      case "all-time":
        return "All Time Top Reporters";
      default:
        return "Top Reporters";
    }
  };

  return (
    <div className="px-4 py-6 pb-20">
      <h1 className="text-2xl font-bold mb-6">Leaderboard</h1>

      <Tabs defaultValue="weekly" onValueChange={handleTimeRangeChange}>
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="all-time">All Time</TabsTrigger>
        </TabsList>

        <TabsContent value={timeRange}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-secondary" />
                {getTitle()}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <p className="text-muted-foreground">Loading leaderboard...</p>
                </div>
              ) : leaderboardUsers.length > 0 ? (
                <div className="divide-y">
                  {leaderboardUsers.map((user) => (
                    <div 
                      key={user.id} 
                      className="flex items-center p-4"
                    >
                      <div className="w-10 text-center font-semibold">
                        {user.position <= 3 ? (
                          <Medal className={`h-6 w-6 mx-auto ${
                            user.position === 1 
                              ? "text-yellow-500" 
                              : user.position === 2 
                              ? "text-gray-400" 
                              : "text-amber-700"
                          }`} />
                        ) : (
                          <span className="text-muted-foreground">{user.position}</span>
                        )}
                      </div>

                      <div className="ml-3 flex-1">
                        <div className="flex items-center">
                          <User className="h-5 w-5 mr-2 text-muted-foreground" />
                          <span className="font-medium">{user.name}</span>
                          
                          {user.change === "up" && (
                            <ArrowUp className="h-3 w-3 ml-2 text-success" />
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 bg-secondary/10 px-3 py-1 rounded-full">
                        <Trophy className="h-4 w-4 text-secondary" />
                        <span className="font-medium">{user.points}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex justify-center items-center py-12">
                  <p className="text-muted-foreground">No data available for this time period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Leaderboard;
