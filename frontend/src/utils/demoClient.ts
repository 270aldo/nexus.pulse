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

// Demo Client para generar datos de prueba de sparklines
export const generateDemoSparklineData = () => {
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }

  return {
    sleep: dates.map((date, index) => ({
      date,
      value: Math.random() > 0.3 ? 6 + Math.random() * 3 : null // 6-9 horas de sueño, algunos días sin datos
    })),
    steps: dates.map((date, index) => ({
      date,
      value: Math.random() > 0.2 ? 5000 + Math.random() * 10000 : null // 5k-15k pasos
    })),
    hrv: dates.map((date, index) => ({
      date,
      value: Math.random() > 0.4 ? 30 + Math.random() * 50 : null // 30-80 ms HRV
    })),
    weight: dates.map((date, index) => ({
      date,
      value: Math.random() > 0.7 ? 70 + Math.random() * 20 : null // 70-90 kg, pocos datos
    })),
    mood: dates.map((date, index) => ({
      date,
      value: Math.random() > 0.5 ? 5 + Math.random() * 5 : null // 5-10 mood score
    })),
    stress: dates.map((date, index) => ({
      date,
      value: Math.random() > 0.5 ? 1 + Math.random() * 8 : null // 1-9 stress level
    }))
  };
};