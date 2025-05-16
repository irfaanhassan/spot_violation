
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface SubscriptionPlan {
  id: string;
  name: string;
  duration_months: number;
  price: number;
}

const loadRazorpay = () => {
  return new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const SubscriptionPlans = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingPayment, setProcessingPayment] = useState<boolean>(false);
  const [activeSubscription, setActiveSubscription] = useState<boolean>(false);
  const [expiryDate, setExpiryDate] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  
  const { user } = useAuth();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data: plans, error } = await supabase
          .from('subscription_plans')
          .select('*')
          .order('price', { ascending: true });

        if (error) throw error;
        setPlans(plans || []);
      } catch (error) {
        console.error("Error fetching plans:", error);
        toast.error("Failed to load subscription plans");
      } finally {
        setLoading(false);
      }
    };

    const fetchUserSubscription = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_subscribed, plan_name, subscription_expires_at')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        setActiveSubscription(data?.is_subscribed || false);
        setCurrentPlan(data?.plan_name || null);
        
        if (data?.subscription_expires_at) {
          const expiryDate = new Date(data.subscription_expires_at);
          setExpiryDate(expiryDate.toLocaleDateString());
        }
      } catch (error) {
        console.error("Error fetching user subscription:", error);
      }
    };

    fetchPlans();
    fetchUserSubscription();
  }, [user]);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!user) {
      toast.error("Please log in to subscribe");
      return;
    }

    setProcessingPayment(true);
    
    try {
      // Load Razorpay script
      const isRazorpayLoaded = await loadRazorpay();
      if (!isRazorpayLoaded) {
        throw new Error("Razorpay failed to load");
      }

      // In a real implementation, you would make a call to your backend to create an order
      // For now, we'll simulate this process
      const options = {
        key: "rzp_test_YourTestKey", // Replace with your actual test key
        amount: plan.price * 100, // Amount in paise
        currency: "INR",
        name: "SpotViolation",
        description: `${plan.name} Subscription Plan`,
        handler: async function (response: any) {
          // Payment successful, update user's subscription in database
          try {
            const now = new Date();
            const expiryDate = new Date();
            expiryDate.setMonth(now.getMonth() + plan.duration_months);

            const { error } = await supabase
              .from('profiles')
              .update({
                is_subscribed: true,
                plan_name: plan.name,
                subscription_starts_at: now.toISOString(),
                subscription_expires_at: expiryDate.toISOString()
              })
              .eq('id', user.id);

            if (error) throw error;

            // Record the transaction
            await supabase
              .from('user_transactions')
              .insert({
                user_id: user.id,
                amount: plan.price,
                transaction_type: 'subscription',
                status: 'completed'
              });

            toast.success("Subscription successful!");
            setActiveSubscription(true);
            setCurrentPlan(plan.name);
            setExpiryDate(expiryDate.toLocaleDateString());
          } catch (error) {
            console.error("Error updating subscription:", error);
            toast.error("Failed to update subscription");
          }
        },
        prefill: {
          email: user.email,
        },
        theme: {
          color: "#3B82F6",
        },
      };

      // @ts-ignore - Razorpay is loaded via script
      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Payment processing failed");
    } finally {
      setProcessingPayment(false);
    }
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
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight">Subscription Plans</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Subscribe to unlock rewards for your reports
          </p>
          
          {activeSubscription && (
            <div className="mt-6 inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full">
              <CheckCircle2 className="h-5 w-5" />
              <span>
                You're subscribed to {currentPlan} plan until {expiryDate}
              </span>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative overflow-hidden ${plan.name === 'Annual' ? 'border-primary' : ''}`}
            >
              {plan.name === 'Annual' && (
                <div className="absolute top-0 right-0">
                  <Badge className="rounded-none rounded-bl-lg bg-primary">Best Value</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>
                  {plan.duration_months === 1 
                    ? "1 Month" 
                    : `${plan.duration_months} Months`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₹{plan.price}</div>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                    <span>Earn 10% of challan amount</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                    <span>Featured on leaderboard</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                    <span>Priority report processing</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={plan.name === 'Annual' ? "default" : "outline"}
                  disabled={processingPayment || (activeSubscription && currentPlan === plan.name)}
                  onClick={() => handleSubscribe(plan)}
                >
                  {processingPayment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing
                    </>
                  ) : activeSubscription && currentPlan === plan.name ? (
                    "Current Plan"
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-12 bg-gray-50 p-6 rounded-lg">
          <div className="flex items-start gap-4">
            <Shield className="h-6 w-6 text-primary mt-1" />
            <div>
              <h3 className="text-lg font-medium">How rewards work</h3>
              <p className="text-muted-foreground mt-1">
                Once you subscribe, you'll earn 10% of the challan amount for every report you submit that gets verified. 
                Rewards are processed automatically when challans are paid, and deposited directly to your wallet.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
