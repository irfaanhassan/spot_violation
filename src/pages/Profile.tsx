
import { AlertTriangle, Award, LogOut, Settings, User, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

// Profile data type
interface ProfileData {
  id: string;
  username: string;
  avatar_url: string | null;
  points: number;
  total_reports: number;
  verified_reports: number;
}

// Report data type
interface ReportData {
  id: string;
  type: string;
  location: string;
  date: string;
  status: string;
  points: number;
}

// Badge data type
interface BadgeData {
  id: string;
  name: string;
  icon: string;
  date: string;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const [userReports, setUserReports] = useState<ReportData[]>([]);
  const [userBadges, setUserBadges] = useState<BadgeData[]>([]);

  // Fetch profile data
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
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
      
      return data as ProfileData;
    },
    enabled: !!user,
  });

  // Fetch user reports
  useEffect(() => {
    const fetchUserReports = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) {
        toast.error("Failed to load reports data");
        return;
      }
      
      // Transform data format
      const formattedReports = data.map(report => ({
        id: report.id,
        type: report.violation_type,
        location: report.location,
        date: new Date(report.created_at).toLocaleDateString(),
        status: report.status,
        points: report.points
      }));
      
      setUserReports(formattedReports);
    };
    
    fetchUserReports();
  }, [user]);

  // Fetch user badges
  useEffect(() => {
    const fetchUserBadges = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from("user_badges")
        .select(`
          awarded_at,
          badges (
            id,
            name,
            icon
          )
        `)
        .eq("user_id", user.id);
      
      if (error) {
        toast.error("Failed to load badges data");
        return;
      }
      
      // Transform data format
      const formattedBadges = data.map(item => ({
        id: item.badges.id,
        name: item.badges.name,
        icon: item.badges.icon,
        date: new Date(item.awarded_at).toLocaleDateString()
      }));
      
      setUserBadges(formattedBadges);
    };
    
    fetchUserBadges();
  }, [user]);

  // If profile is loading, show a loading state
  if (profileLoading || !profileData) {
    return (
      <div className="px-4 py-6 pb-20">
        <div className="flex items-center justify-center h-64">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  const userStats = {
    totalPoints: profileData.points,
    totalReports: profileData.total_reports,
    verified: profileData.verified_reports,
    rejected: userReports.filter(r => r.status === "rejected").length,
    pending: userReports.filter(r => r.status === "pending").length
  };

  // If no badges found, use some default ones for display
  const displayBadges = userBadges.length > 0 ? userBadges : [
    { id: "1", name: "First Report", icon: "AlertTriangle", date: "Not earned yet" },
    { id: "2", name: "10 Verified Reports", icon: "Award", date: "Not earned yet" },
    { id: "3", name: "Weekly Top Reporter", icon: "Award", date: "Not earned yet" }
  ];

  return (
    <div className="px-4 py-6 pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Your Profile</h1>
      </div>

      {/* User Profile Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="bg-primary/10 rounded-full p-4">
              <User className="h-10 w-10 text-primary" />
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold">{profileData.username || user?.email}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 text-center">
            <div className="bg-primary/5 rounded-lg p-3">
              <p className="text-2xl font-semibold">{userStats.totalPoints}</p>
              <p className="text-xs text-muted-foreground">Points</p>
            </div>
            <div className="bg-primary/5 rounded-lg p-3">
              <p className="text-2xl font-semibold">{userStats.totalReports}</p>
              <p className="text-xs text-muted-foreground">Reports</p>
            </div>
            <div className="bg-primary/5 rounded-lg p-3">
              <p className="text-2xl font-semibold">{userStats.verified}</p>
              <p className="text-xs text-muted-foreground">Verified</p>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button 
              onClick={() => {}}
              variant="outline" 
              className="flex items-center"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button 
              onClick={() => signOut()}
              variant="destructive" 
              className="flex items-center"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Award className="h-5 w-5 mr-2 text-secondary" />
            Your Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 overflow-x-auto py-2 scrollbar-hide">
            {displayBadges.map(badge => {
              // Dynamic icon selection based on badge type
              const BadgeIcon = badge.icon === "AlertTriangle" 
                ? AlertTriangle 
                : badge.icon === "Award" 
                ? Award 
                : User;
              
              return (
                <div 
                  key={badge.id} 
                  className="flex flex-col items-center min-w-24 bg-muted p-3 rounded-lg"
                >
                  <div className="bg-secondary/20 p-2 rounded-full mb-2">
                    <BadgeIcon className="h-6 w-6 text-secondary" />
                  </div>
                  <span className="text-sm font-medium text-center">{badge.name}</span>
                  <span className="text-xs text-muted-foreground mt-1">{badge.date}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Reports History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-secondary" />
            Your Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="all">
            <div className="px-4 pt-2">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="verified">Verified</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="mt-0">
              {userReports.length > 0 ? (
                <div className="divide-y">
                  {userReports.map(report => (
                    <div key={report.id} className="p-4">
                      <div className="flex justify-between mb-1">
                        <h3 className="font-medium">{report.type}</h3>
                        <span 
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            report.status === "verified" 
                              ? "bg-success-light text-success"
                              : report.status === "rejected"
                              ? "bg-violation-light text-violation"
                              : "bg-secondary/20 text-secondary-foreground"
                          }`}
                        >
                          {report.status}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground mb-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{report.location}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{report.date}</span>
                        {report.points > 0 && (
                          <span className="font-medium text-success flex items-center">
                            +{report.points} points
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-muted-foreground">No reports found. Start reporting traffic violations!</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="verified" className="mt-0">
              {userReports.filter(r => r.status === "verified").length > 0 ? (
                <div className="divide-y">
                  {userReports
                    .filter(report => report.status === "verified")
                    .map(report => (
                      <div key={report.id} className="p-4">
                        <div className="flex justify-between mb-1">
                          <h3 className="font-medium">{report.type}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-success-light text-success">
                            verified
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground mb-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>{report.location}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{report.date}</span>
                          <span className="font-medium text-success flex items-center">
                            +{report.points} points
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-muted-foreground">No verified reports yet.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="pending" className="mt-0">
              {userReports.filter(r => r.status === "pending").length > 0 ? (
                <div className="divide-y">
                  {userReports
                    .filter(report => report.status === "pending")
                    .map(report => (
                      <div key={report.id} className="p-4">
                        <div className="flex justify-between mb-1">
                          <h3 className="font-medium">{report.type}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/20 text-secondary-foreground">
                            pending
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground mb-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>{report.location}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{report.date}</span>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-muted-foreground">No pending reports.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
