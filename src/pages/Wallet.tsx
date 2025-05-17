
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, AlertCircle, Clock, CheckCircle2, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  status: string;
  created_at: string;
  report_id: string | null;
}

interface UserProfile {
  total_earnings: number;
  is_subscribed: boolean;
  plan_name: string | null;
  subscription_expires_at: string | null;
}

const WalletPage = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchWalletData = async () => {
      try {
        // Fetch user profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('total_earnings, is_subscribed, plan_name, subscription_expires_at')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error("Profile fetch error:", profileError);
          if (profileError.code === "PGRST116") {
            // If profile not found, create one
            await supabase
              .from('profiles')
              .insert({
                id: user.id,
                username: user.email,
                total_earnings: 0,
                is_subscribed: false,
                plan_name: null,
                subscription_expires_at: null
              });
              
            setProfile({
              total_earnings: 0,
              is_subscribed: false,
              plan_name: null,
              subscription_expires_at: null
            });
          } else {
            throw profileError;
          }
        } else {
          setProfile(profileData);
        }

        // Fetch transaction history
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('user_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (transactionsError) {
          console.error("Transactions fetch error:", transactionsError);
          throw transactionsError;
        }
        
        setTransactions(transactionsData || []);
      } catch (error) {
        console.error("Error fetching wallet data:", error);
        toast.error("Failed to load wallet information");
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, [user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container px-4 py-10 mx-auto">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-6">My Wallet</h1>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Total Earnings</CardTitle>
              <CardDescription>Your accumulated rewards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Wallet className="h-10 w-10 text-primary mr-4" />
                <div className="text-3xl font-bold">₹{profile?.total_earnings || 0}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Subscription Status</CardTitle>
              <CardDescription>Your current plan details</CardDescription>
            </CardHeader>
            <CardContent>
              {profile?.is_subscribed ? (
                <div>
                  <Badge className="mb-2 bg-green-500">{profile.plan_name} Plan</Badge>
                  <p className="text-sm text-muted-foreground">
                    Expires on: {profile.subscription_expires_at 
                      ? formatDate(profile.subscription_expires_at) 
                      : 'N/A'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center text-amber-600">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span>No active subscription</span>
                  </div>
                  <Button asChild size="sm" className="mt-2">
                    <Link to="/app/subscription">Subscribe Now</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Your rewards and subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <p>No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center border-b pb-4">
                    <div className="flex items-start gap-3">
                      {transaction.transaction_type === 'reward' ? (
                        <div className="p-2 bg-green-100 rounded-full">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </div>
                      ) : (
                        <div className="p-2 bg-blue-100 rounded-full">
                          <Wallet className="h-4 w-4 text-blue-600" />
                        </div>
                      )}
                      
                      <div>
                        <div className="font-medium">
                          {transaction.transaction_type === 'reward' 
                            ? 'Report Reward' 
                            : 'Subscription Payment'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(transaction.created_at)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`font-medium ${
                        transaction.transaction_type === 'reward' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.transaction_type === 'reward' ? '+' : '-'}₹{transaction.amount}
                      </div>
                      <div className="flex items-center text-xs">
                        {transaction.status === 'completed' ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">Completed</Badge>
                        ) : transaction.status === 'pending' ? (
                          <Badge variant="outline" className="text-amber-600 border-amber-600">Pending</Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600 border-red-600">Failed</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {!profile?.is_subscribed && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
            <CardContent className="py-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <AlertCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Unlock Reward Earnings</h3>
                  <p className="text-muted-foreground mb-4">
                    Subscribe to earn 10% of every challan amount for reports you submit that get verified.
                  </p>
                  <Button asChild>
                    <Link to="/app/subscription" className="flex items-center">
                      View Subscription Plans
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WalletPage;
