import React, { useState, startTransition, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const AuthPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    console.log("AuthPage cargado - Supabase configurado");
    setErrorMessage(null);
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleLogin();
    }
  };

  const handleLogin = async () => {
    console.log("handleLogin called", { email, password: password.length > 0 });
    setErrorMessage(null);
    
    if (!email || !password) {
      toast.error("Por favor ingresa email y contraseña");
      setErrorMessage("Debes ingresar tanto el email como la contraseña");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("Iniciando sesión con Supabase...");
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });
      
      console.log("Respuesta de Supabase:", { data, error });
      
      if (error) {
        // Para testing, permitir login con cualquier credencial si no hay conexión
        if (error.message.includes("fetch") || error.message.includes("network")) {
          console.log("Sin conexión, usando modo offline");
          toast.success("¡Login exitoso! (Modo Offline)");
          
          // Simular usuario logueado
          localStorage.setItem("offline_user", JSON.stringify({
            id: "offline-user-123",
            email: email,
            created_at: new Date().toISOString()
          }));
          
          setTimeout(() => {
            startTransition(() => {
              navigate("/dashboard-page");
            });
          }, 100);
          return;
        }
        throw error;
      }
      
      if (data.user) {
        console.log("Login exitoso:", data.user.id);
        toast.success("¡Login exitoso!");
        
        setTimeout(() => {
          startTransition(() => {
            navigate("/dashboard-page");
          });
        }, 100);
      }
    } catch (error: any) {
      console.error("Error en login:", error);
      setErrorMessage(`Error: ${error.message}`);
      toast.error(`Error: ${error.message}`);
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
            Accede a tu plataforma de optimización personal.
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
              onKeyPress={handleKeyPress}
              className="bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:ring-brand-violet focus:border-brand-violet"
              disabled={isSubmitting}
            />
          </div>
          {errorMessage && (
            <div className="mt-4 p-3 bg-red-900/30 border border-red-800/50 rounded-md">
              <p className="text-red-300 text-sm">{errorMessage}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            onClick={handleLogin} 
            className="w-full bg-brand-violet hover:bg-brand-violet/90 text-white font-semibold transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg shadow-brand-violet/40 hover:shadow-brand-violet/50 focus:outline-none focus:ring-2 focus:ring-brand-violet/50 focus:ring-offset-2 focus:ring-offset-neutral-900" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Iniciando sesión..." : "Iniciar Sesión"}
          </Button>
          <Button 
            className="w-full bg-brand-violet hover:bg-brand-violet/90 text-white font-semibold transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg shadow-brand-violet/40 hover:shadow-brand-violet/50 focus:outline-none focus:ring-2 focus:ring-brand-violet/50 focus:ring-offset-2 focus:ring-offset-neutral-900" 
            // Envuelve la navegación en startTransition para prevenir la advertencia
            onClick={() => startTransition(() => navigate("/sign-up-page"))}
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
