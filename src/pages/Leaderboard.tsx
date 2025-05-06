
import { Trophy, User, Medal, ArrowUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data
const weeklyTopUsers = [
  { id: 1, name: "Rahul S.", points: 240, position: 1, change: "up" },
  { id: 2, name: "Priya M.", points: 190, position: 2, change: "same" },
  { id: 3, name: "Amit K.", points: 150, position: 3, change: "up" },
  { id: 4, name: "Sanjay B.", points: 120, position: 4, change: "down" },
  { id: 5, name: "Kavita R.", points: 110, position: 5, change: "up" },
  { id: 6, name: "Rajesh T.", points: 100, position: 6, change: "same" },
  { id: 7, name: "Anita J.", points: 90, position: 7, change: "down" },
  { id: 8, name: "Prakash D.", points: 80, position: 8, change: "up" },
  { id: 9, name: "Neha P.", points: 70, position: 9, change: "same" },
  { id: 10, name: "Vikram S.", points: 60, position: 10, change: "down" },
];

const monthlyTopUsers = [
  { id: 1, name: "Amit K.", points: 750, position: 1, change: "up" },
  { id: 2, name: "Rahul S.", points: 680, position: 2, change: "down" },
  { id: 3, name: "Priya M.", points: 620, position: 3, change: "same" },
  { id: 4, name: "Kavita R.", points: 580, position: 4, change: "up" },
  { id: 5, name: "Sanjay B.", points: 520, position: 5, change: "down" },
  { id: 6, name: "Anita J.", points: 490, position: 6, change: "up" },
  { id: 7, name: "Rajesh T.", points: 450, position: 7, change: "same" },
  { id: 8, name: "Neha P.", points: 420, position: 8, change: "up" },
  { id: 9, name: "Prakash D.", points: 390, position: 9, change: "down" },
  { id: 10, name: "Vikram S.", points: 350, position: 10, change: "same" },
];

const allTimeTopUsers = [
  { id: 1, name: "Rahul S.", points: 3240, position: 1, change: "same" },
  { id: 2, name: "Amit K.", points: 2950, position: 2, change: "up" },
  { id: 3, name: "Priya M.", points: 2780, position: 3, change: "down" },
  { id: 4, name: "Kavita R.", points: 2540, position: 4, change: "same" },
  { id: 5, name: "Anita J.", points: 2320, position: 5, change: "up" },
  { id: 6, name: "Sanjay B.", points: 2180, position: 6, change: "down" },
  { id: 7, name: "Rajesh T.", points: 1950, position: 7, change: "same" },
  { id: 8, name: "Neha P.", points: 1820, position: 8, change: "up" },
  { id: 9, name: "Prakash D.", points: 1740, position: 9, change: "same" },
  { id: 10, name: "Vikram S.", points: 1650, position: 10, change: "up" },
];

const Leaderboard = () => {
  return (
    <div className="px-4 py-6 pb-20">
      <h1 className="text-2xl font-bold mb-6">Leaderboard</h1>

      <Tabs defaultValue="weekly">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="all-time">All Time</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly">
          <LeaderboardContent users={weeklyTopUsers} title="Weekly Top Reporters" />
        </TabsContent>

        <TabsContent value="monthly">
          <LeaderboardContent users={monthlyTopUsers} title="Monthly Top Reporters" />
        </TabsContent>

        <TabsContent value="all-time">
          <LeaderboardContent users={allTimeTopUsers} title="All Time Top Reporters" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface LeaderboardContentProps {
  users: {
    id: number;
    name: string;
    points: number;
    position: number;
    change: string;
  }[];
  title: string;
}

const LeaderboardContent = ({ users, title }: LeaderboardContentProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Trophy className="h-5 w-5 mr-2 text-secondary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {users.map((user) => (
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
      </CardContent>
    </Card>
  );
};

export default Leaderboard;
