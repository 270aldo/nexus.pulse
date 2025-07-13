// DEMO CLIENT - Reemplaza completamente Supabase para funcionar offline

interface DemoUser {
  id: string;
  email: string;
  created_at: string;
}

interface DemoSession {
  user: DemoUser;
  access_token: string;
}

class DemoClient {
  private currentSession: DemoSession | null = null;

  // Simular autenticación
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    console.log("Demo: Iniciando sesión con", { email, password: "***" });
    
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Validación simple
    if (!email.includes("@")) {
      throw new Error("Email debe contener @");
    }
    
    if (password.length < 1) {
      throw new Error("Contraseña requerida");
    }
    
    // Crear usuario demo
    const user: DemoUser = {
      id: `demo-user-${Date.now()}`,
      email,
      created_at: new Date().toISOString()
    };
    
    const session: DemoSession = {
      user,
      access_token: `demo-token-${Date.now()}`
    };
    
    this.currentSession = session;
    localStorage.setItem("demo_session", JSON.stringify(session));
    
    return { 
      data: { user, session }, 
      error: null 
    };
  }

  // Simular registro
  async signUp({ email, password }: { email: string; password: string }) {
    console.log("Demo: Registrando usuario", { email, password: "***" });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!email.includes("@")) {
      throw new Error("Email debe contener @");
    }
    
    if (password.length < 6) {
      throw new Error("Contraseña debe tener al menos 6 caracteres");
    }
    
    const user: DemoUser = {
      id: `demo-user-${Date.now()}`,
      email,
      created_at: new Date().toISOString()
    };
    
    return { 
      data: { user }, 
      error: null 
    };
  }

  // Obtener sesión actual
  async getSession() {
    const stored = localStorage.getItem("demo_session");
    if (stored) {
      this.currentSession = JSON.parse(stored);
      return { data: { session: this.currentSession }, error: null };
    }
    return { data: { session: null }, error: null };
  }

  // Cerrar sesión
  async signOut() {
    this.currentSession = null;
    localStorage.removeItem("demo_session");
    return { error: null };
  }

  // Listener de cambios de autenticación (mock)
  onAuthStateChange(callback: (event: string, session: DemoSession | null) => void) {
    // En demo mode, no hay cambios reales de estado
    return {
      subscription: {
        unsubscribe: () => console.log("Demo: Auth listener unsubscribed")
      }
    };
  }
}

// Crear instancia global del cliente demo
export const demoClient = new DemoClient();

// Exportar como reemplazo directo de supabase.auth
export const demoAuth = {
  signInWithPassword: demoClient.signInWithPassword.bind(demoClient),
  signUp: demoClient.signUp.bind(demoClient),
  getSession: demoClient.getSession.bind(demoClient),
  signOut: demoClient.signOut.bind(demoClient),
  onAuthStateChange: demoClient.onAuthStateChange.bind(demoClient)
};