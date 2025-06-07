
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient"; // Asegúrate que la ruta sea correcta
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const AuthPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

    const handleLogin = async () => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      if (error) throw error;
      if (data.user) {
        toast.success("Login successful!");
        navigate("/dashboard-page"); // Redirige a la página del dashboard después del login
      }
    } catch (error: any) {
      console.error("Error logging in:", error.message);
      toast.error(`Login failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-950 to-black p-4">
      <Card className="w-full max-w-md bg-neutral-900 border-neutral-700/50 shadow-2xl shadow-black/60 rounded-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-brand-violet">NGX Pulse</CardTitle>
          <CardDescription className="text-neutral-400 pt-2">
            Access your personalized health optimization dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-neutral-300">Email</label>
            <Input 
              id="email" 
              type="email" 
              placeholder="you@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="bg-neutral-800 border-neutral-600/50 text-neutral-200 placeholder:text-neutral-500 focus:ring-brand-violet focus:border-brand-violet"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-neutral-300">Password</label>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:ring-brand-violet focus:border-brand-violet"
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button onClick={handleLogin} className="w-full bg-brand-violet hover:bg-brand-violet/90 text-white font-semibold transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg shadow-brand-violet/40 hover:shadow-brand-violet/50 focus:outline-none focus:ring-2 focus:ring-brand-violet/50 focus:ring-offset-2 focus:ring-offset-neutral-900" disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Login"}
          </Button>
          <Button 
            variant="outline" 
            className="w-full border-brand-violet/80 text-brand-violet hover:bg-brand-violet/10 hover:text-brand-violet font-semibold transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand-violet/50 focus:ring-offset-2 focus:ring-offset-neutral-900" 
            onClick={() => navigate("/signup-page")}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Procesando..." : "¿No tienes cuenta? Regístrate"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AuthPage;
