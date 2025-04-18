import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AuthForm = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = isSignUp 
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;
      
      toast({
        title: isSignUp ? "Account created!" : "Welcome back!",
        description: isSignUp ? "Please check your email to verify your account." : "You've been successfully logged in.",
      });

      if (!isSignUp) {
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>{isSignUp ? "Create Account" : "Login"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAuth} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {isSignUp ? "Sign Up" : "Login"}
          </Button>
          <Button
            type="button"
            variant="link"
            className="w-full"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? "Already have an account? Login" : "Need an account? Sign Up"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AuthForm;
