
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

const Login = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);

  const handlePhoneLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // This would be replaced with actual Firebase phone auth
    setShowOtp(true);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    // This would verify OTP with Firebase
    navigate("/app");
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // This would be replaced with actual Firebase email auth
    navigate("/app");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 flex items-center">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold ml-2">Sign In</h1>
      </header>

      <main className="flex-grow flex flex-col justify-center p-6">
        <div className="max-w-md w-full mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Welcome to SpotViolation</h1>
            <p className="text-muted-foreground">Sign in to report traffic violations and earn rewards</p>
          </div>

          <Tabs defaultValue="phone" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="phone">Phone</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
            </TabsList>

            <TabsContent value="phone">
              <Card>
                <CardHeader className="text-center text-lg font-medium">
                  Phone Number Login
                </CardHeader>
                <CardContent>
                  {!showOtp ? (
                    <form onSubmit={handlePhoneLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="Enter your phone number"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Send OTP
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="otp">Enter OTP</Label>
                        <Input
                          id="otp"
                          type="text"
                          placeholder="Enter OTP sent to your phone"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Verify & Login
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="email">
              <Card>
                <CardHeader className="text-center text-lg font-medium">
                  Email Login
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Login
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            <Button variant="outline" className="w-full">
              Continue with Google
            </Button>
          </div>

          <p className="text-center mt-6 text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/login" className="text-primary font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;
