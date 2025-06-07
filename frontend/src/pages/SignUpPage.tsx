
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const SignUpPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async () => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });
      if (error) throw error;
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        toast.warning("Este correo ya está registrado con otro método. Por favor, inicia sesión.");
      } else if (data.user) {
        toast.success("¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.");
        // Considera si quieres redirigir a login o mostrar un mensaje de espera.
        // navigate("/auth-page"); 
      } else {
        toast.info("Por favor, revisa tu correo para confirmar tu cuenta.");
      }
    } catch (error: any) {
      console.error("Error signing up:", error.message);
      toast.error(`El registro falló: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-950 to-black p-4">
      <Card className="w-full max-w-md bg-neutral-900 border-neutral-700/50 shadow-2xl shadow-black/60 rounded-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-brand-violet">Crea tu Cuenta NGX</CardTitle>
          <CardDescription className="text-neutral-400 pt-2">
            Únete a la plataforma de optimización de salud personalizada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-neutral-300">Email</label>
            <Input 
              id="email" 
              type="email" 
              placeholder="tu@ejemplo.com" 
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
              className="bg-neutral-800 border-neutral-600/50 text-neutral-200 placeholder:text-neutral-500 focus:ring-brand-violet focus:border-brand-violet"
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button onClick={handleSignUp} className="w-full bg-brand-violet hover:bg-brand-violet/90 text-white font-semibold transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg shadow-brand-violet/40 hover:shadow-brand-violet/50 focus:outline-none focus:ring-2 focus:ring-brand-violet/50 focus:ring-offset-2 focus:ring-offset-neutral-900" disabled={isSubmitting}>
            {isSubmitting ? "Procesando..." : "Crear Cuenta"}
          </Button>
          <Button 
            variant="outline" 
            className="w-full border-brand-violet/80 text-brand-violet hover:bg-brand-violet/10 hover:text-brand-violet font-semibold transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand-violet/50 focus:ring-offset-2 focus:ring-offset-neutral-900" 
            onClick={() => navigate("/auth-page")}
            disabled={isSubmitting}
          >
            ¿Ya tienes cuenta? Inicia Sesión
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignUpPage;
