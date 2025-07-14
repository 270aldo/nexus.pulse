import React, { useState, useEffect, startTransition } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const SignUpPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Verificar conexión a Supabase
  useEffect(() => {
    console.log("SignUpPage cargado - Supabase configurado");
    setErrorMessage(null);
  }, []);
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleSignUp();
    }
  };

  const handleSignUp = async () => {
    console.log("handleSignUp called", { email, password: password.length > 0 });
    setErrorMessage(null);
    
    // Validaciones
    if (!email || !password) {
      setErrorMessage("Por favor completa todos los campos");
      toast.error("Por favor completa todos los campos");
      setIsSubmitting(false);
      return;
    }
    
    if (password.length < 6) {
      setErrorMessage("La contraseña debe tener al menos 6 caracteres");
      toast.error("La contraseña debe tener al menos 6 caracteres");
      setIsSubmitting(false);
      return;
    }
    
    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden");
      toast.error("Las contraseñas no coinciden");
      setIsSubmitting(false);
      return;
    }
    
    setIsSubmitting(true);
    try {
      console.log("Registrando usuario con Supabase...");
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });
      
      console.log("Respuesta de Supabase:", { 
        userData: data?.user ? { id: data.user.id, email: data.user.email } : null,
        error: error ? { message: error.message, status: error.status } : null 
      });
      
      if (error) {
        if (error.message.includes("already registered")) {
          setErrorMessage("Este correo ya está registrado. Por favor, inicia sesión.");
          toast.warning("Este correo ya está registrado. Por favor, inicia sesión.");
        } else {
          setErrorMessage(`Error: ${error.message}`);
          toast.error(`El registro falló: ${error.message}`);
        }
        throw error;
      }
      
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setErrorMessage("Este correo ya está registrado con otro método. Por favor, inicia sesión.");
        toast.warning("Este correo ya está registrado con otro método. Por favor, inicia sesión.");
      } else if (data.user) {
        toast.success("¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.");
        setTimeout(() => {
          startTransition(() => {
            navigate("/auth-page");
          });
        }, 2000);
      } else {
        setErrorMessage("Ocurrió un error durante el registro. Inténtalo de nuevo.");
        toast.info("Ocurrió un error durante el registro. Inténtalo de nuevo.");
      }
    } catch (error: any) {
      console.error("Error al registrarse:", error);
      if (!errorMessage) {
        setErrorMessage(`Error: ${error.message || 'Desconocido'}`);
      }
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
            Únete a la plataforma de optimización personal y mejora tu productividad.
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
            <label htmlFor="password" className="text-sm font-medium text-neutral-300">Contraseña</label>
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
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-neutral-300">Confirmar Contraseña</label>
            <Input 
              id="confirmPassword" 
              type="password" 
              placeholder="••••••••" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              onKeyPress={handleKeyPress}
              className="bg-neutral-800 border-neutral-600/50 text-neutral-200 placeholder:text-neutral-500 focus:ring-brand-violet focus:border-brand-violet"
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
          <Button onClick={handleSignUp} className="w-full bg-brand-violet hover:bg-brand-violet/90 text-white font-semibold transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg shadow-brand-violet/40 hover:shadow-brand-violet/50 focus:outline-none focus:ring-2 focus:ring-brand-violet/50 focus:ring-offset-2 focus:ring-offset-neutral-900" disabled={isSubmitting}>
            {isSubmitting ? "Procesando..." : "Crear Cuenta"}
          </Button>
          <Button 
            variant="outline" 
            className="w-full border-neutral-700 bg-black text-white hover:bg-neutral-900 hover:text-white hover:border-neutral-600 font-semibold transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-neutral-700 focus:ring-offset-2 focus:ring-offset-neutral-900" 
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
