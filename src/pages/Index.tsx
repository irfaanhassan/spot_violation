
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, Shield, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4 px-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold">SpotViolation</h1>
          <p className="text-primary-foreground/80">Make your roads safer</p>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-grow flex flex-col items-center justify-center p-6 bg-gradient-to-b from-primary/10 to-background">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-8">
            <div className="inline-block p-3 bg-primary/10 rounded-full mb-4">
              <AlertTriangle className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Report Traffic Violations</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Join our community effort to make roads safer by reporting traffic violations in your city.
            </p>
          </div>

          <div className="space-y-4">
            <Button asChild size="lg" className="w-full">
              <Link to="/login">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link to="/app">
                Explore App
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 px-6 bg-muted">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">Key Features</h2>
          
          <div className="grid gap-6">
            <div className="bg-background p-6 rounded-lg shadow-sm flex">
              <div className="mr-4 bg-primary/10 p-2 rounded-full h-fit">
                <AlertTriangle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Easy Reporting</h3>
                <p className="text-sm text-muted-foreground">Report violations quickly with photos and location detection.</p>
              </div>
            </div>
            
            <div className="bg-background p-6 rounded-lg shadow-sm flex">
              <div className="mr-4 bg-primary/10 p-2 rounded-full h-fit">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Earn Points & Badges</h3>
                <p className="text-sm text-muted-foreground">Get rewarded for verified reports with our gamification system.</p>
              </div>
            </div>
            
            <div className="bg-background p-6 rounded-lg shadow-sm flex">
              <div className="mr-4 bg-primary/10 p-2 rounded-full h-fit">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Make Roads Safer</h3>
                <p className="text-sm text-muted-foreground">Contribute to road safety initiatives in your community.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-6 text-center text-sm text-muted-foreground">
        <div className="max-w-md mx-auto">
          <p>© 2025 SpotViolation. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
