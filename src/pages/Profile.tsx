
import { AlertTriangle, Award, LogOut, Settings, User, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";

// Mock data
const userStats = {
  totalPoints: 250,
  totalReports: 25,
  verified: 18,
  rejected: 3,
  pending: 4
};

const userBadges = [
  { id: 1, name: "First Report", icon: AlertTriangle, date: "Apr 10, 2025" },
  { id: 2, name: "10 Verified Reports", icon: Award, date: "Apr 18, 2025" },
  { id: 3, name: "Weekly Top Reporter", icon: Award, date: "Apr 22, 2025" }
];

const userReports = [
  {
    id: 1,
    type: "No Helmet",
    location: "MG Road, Bangalore",
    date: "Apr 24, 2025",
    status: "verified",
    points: 10
  },
  {
    id: 2,
    type: "Wrong Side Driving",
    location: "Brigade Road, Bangalore",
    date: "Apr 23, 2025",
    status: "verified",
    points: 10
  },
  {
    id: 3,
    type: "Signal Jump",
    location: "Residency Road, Bangalore",
    date: "Apr 22, 2025",
    status: "pending",
    points: 0
  },
  {
    id: 4,
    type: "Triple Riding",
    location: "Indiranagar, Bangalore",
    date: "Apr 20, 2025",
    status: "rejected",
    points: 0
  },
  {
    id: 5,
    type: "No Helmet",
    location: "Koramangala, Bangalore",
    date: "Apr 18, 2025",
    status: "verified",
    points: 10
  }
];

const Profile = () => {
  const navigate = useNavigate();

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
              <h2 className="text-xl font-semibold">Demo User</h2>
              <p className="text-sm text-muted-foreground">user@example.com</p>
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
              onClick={() => navigate("/")}
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
            {userBadges.map(badge => (
              <div 
                key={badge.id} 
                className="flex flex-col items-center min-w-24 bg-muted p-3 rounded-lg"
              >
                <div className="bg-secondary/20 p-2 rounded-full mb-2">
                  <badge.icon className="h-6 w-6 text-secondary" />
                </div>
                <span className="text-sm font-medium text-center">{badge.name}</span>
                <span className="text-xs text-muted-foreground mt-1">{badge.date}</span>
              </div>
            ))}
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
            </TabsContent>

            <TabsContent value="verified" className="mt-0">
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
            </TabsContent>

            <TabsContent value="pending" className="mt-0">
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
