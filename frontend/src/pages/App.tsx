import React from "react";
import { Button } from "@/components/ui/button";
import { Zap, Brain, Activity, ArrowRight, ChevronRight, Settings, Target, BarChart3, ZapIcon, BrainIcon, ActivityIcon, AwardIcon, UsersIcon, MessageSquareIcon, BrainCircuit, Atom, CalendarDays, HeartPulse, Utensils, Dumbbell } from "lucide-react"; // Added BrainCircuit, Helix and more icons for potential use
import { useNavigate } from "react-router-dom"; // Added for navigation

// Helper component for section title (similar to previous, can be adjusted)
const SectionTitle = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <h2 className={`text-4xl sm:text-5xl font-bold tracking-tight text-center text-slate-100 mb-4 ${className || ''}`}>
    {children}
  </h2>
);

const SectionSubtitle = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <p className={`text-lg text-slate-400 text-center max-w-2xl mx-auto mb-16 sm:mb-20 ${className || ''}`}>
    {children}
  </p>
);

export default function App() {
  const navigate = useNavigate(); // Hook for navigation

  const features = [
    {
      icon: <ZapIcon size={24} className="text-brand-violet" />, // Adjusted icon usage
      title: "Seguimiento Integral Avanzado",
      description:
        "Visualiza cada faceta de tu optimización: desde el entrenamiento de precisión y la nutrición inteligente hasta biomarcadores clave y tu agudeza cognitiva.",
    },
    {
      icon: <BrainIcon size={24} className="text-brand-violet" />,
      title: "NGX AI Coach™ Personalizado",
      description:
        "Tu inteligencia artificial dedicada que analiza tus datos para ofrecerte insights accionables, ajustes proactivos y un acompañamiento sin precedentes.",
    },
    {
      icon: <ActivityIcon size={24} className="text-brand-violet" />,
      title: "Programas NGX Dinámicos",
      description:
        "Accede a los protocolos de NGX PRIME y NGX LONGEVITY, integrados y adaptados en tiempo real para maximizar tus resultados y expandir tu potencial.",
    },
     {
      icon: <AwardIcon size={24} className="text-brand-violet" />,
      title: "Optimización del Rendimiento",
      description:
        "Alcanza nuevas cimas de rendimiento físico y mental con estrategias basadas en datos y ciencia aplicada.",
    },
    {
      icon: <UsersIcon size={24} className="text-brand-violet" />,
      title: "Comunidad y Soporte Exclusivo",
      description:
        "Conéctate con otros usuarios de alto rendimiento y accede a nuestro equipo de expertos para resolver tus dudas.",
    },
    {
      icon: <MessageSquareIcon size={24} className="text-brand-violet" />,
      title: "Comunicación Directa con Coaches",
      description:
        "Facilita una comunicación fluida y eficiente con tus coaches para un seguimiento y ajustes continuos.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-950 to-black text-slate-100 flex flex-col font-sans antialiased overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-neutral-900/70 backdrop-blur-md shadow-lg border-b border-neutral-700/50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center">
            {/* Placeholder for a logo image if available, falls back to text */}
            {/* <img src="/logo.svg" alt="NGX Pulse Logo" className="h-8 w-auto" /> */}
            <span className="text-2xl font-bold text-white">
              NGX <span className="text-brand-violet">Pulse</span>
            </span>
          </div>
          <div>
            <Button 
              variant="outline"
              className="text-slate-200 border-neutral-700 hover:bg-neutral-800 hover:text-brand-violet hover:border-brand-violet transition-colors"
            >
              Login
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-screen pt-20 px-6 text-center sm:text-left overflow-hidden">
         {/* Background Glow - Subtle and Large */}
                {/* Removed previous large background glows for a cleaner, n8n-inspired look */}
        {/* <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-3/4 h-3/4 bg-purple-600/20 rounded-full blur-[200px] animate-pulse-slower opacity-50" />
          <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-indigo-500/20 rounded-full blur-[150px] animate-pulse-slow opacity-60" />
        </div> */}
        
        <div className="container mx-auto grid md:grid-cols-2 gap-8 lg:gap-16 items-center relative z-10 mt-12 sm:mt-0">
          {/* Left Column: Text Content & CTAs */}
          <div className="flex flex-col items-center sm:items-start">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-violet/90">
              PLATAFORMA DE OPTIMIZACIÓN INTEGRAL
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tighter text-white leading-tight">
              Maximiza Tu Potencial Con <span className="text-brand-violet">NGX Pulse</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-neutral-300 max-w-xl mx-auto sm:mx-0 leading-relaxed">
              Bienvenido a la experiencia definitiva para el seguimiento y la optimización de tu salud, rendimiento y longevidad. Accede a tus programas NGX PRIME y LONGEVITY, impulsados por IA.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button
                size="xl"
                className="w-full sm:w-auto group relative inline-flex items-center justify-center h-14 px-8 text-base font-semibold text-white bg-brand-violet hover:bg-brand-violet/90 shadow-lg shadow-brand-violet/40 hover:shadow-brand-violet/60 focus:ring-offset-neutral-950 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-brand-violet/50 focus:ring-offset-2 shadow-[0_0_10px_2px_rgba(109,0,255,0.3)] hover:shadow-[0_0_25px_8px_rgba(109,0,255,0.5)]"
              >
                Acceder a mi Programa
                <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-300 ease-in-out group-hover:translate-x-1" />
              </Button>
              <Button
                size="xl"
                variant="outline"
                className="w-full sm:w-auto group relative inline-flex items-center justify-center h-14 px-8 text-base font-semibold text-neutral-200 border-2 border-brand-violet/70 hover:bg-brand-violet/10 hover:text-brand-violet hover:border-brand-violet shadow-md focus:ring-offset-neutral-950 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-brand-violet/50 focus:ring-offset-2 shadow-[0_0_8px_1px_rgba(109,0,255,0.2)] hover:shadow-[0_0_20px_5px_rgba(109,0,255,0.4)]"
              >
                Explorar Características
                {/* <ChevronRight className="w-5 h-5 ml-2 transition-transform duration-300 ease-in-out group-hover:translate-x-1" /> */}
              </Button>
            </div>
             <div className="mt-10 flex items-center gap-x-6 opacity-80">
              {[ "Seguimiento Avanzado", "Planes Personalizados", "Insights por IA"].map((item) => (
                <div key={item} className="flex items-center gap-x-2">
                  <ZapIcon size={16} className="text-brand-violet" />
                  <span className="text-xs text-neutral-400 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Visual Element (Placeholder for now) */}
          <div className="relative flex items-center justify-center min-h-[400px] sm:min-h-[500px] md:min-h-[550px] order-first md:order-last">
            {/* Dashboard Visual Container - n8n style */}
            <div className="w-full h-full max-w-md lg:max-w-lg xl:max-w-2xl aspect-[4/3] bg-neutral-800/50 backdrop-blur-xl border border-neutral-700/60 rounded-3xl flex items-center justify-center shadow-2xl shadow-black/50 p-4 sm:p-6">
              {/* Inner Card for AI-themed content - Redesigning for Dashboard effect */}
              <div 
                className="group/aicard relative w-full h-full bg-neutral-700/60 rounded-xl shadow-lg p-4 flex flex-col items-center justify-center text-center overflow-hidden transition-shadow duration-300 hover:shadow-[0_0_35px_10px_rgba(109,0,255,0.3)]"
              >
                {/* Subtle dot pattern background - Kept */}
                <div 
                  className="absolute inset-0 opacity-5 pointer-events-none z-0"
                  style={{
                    backgroundImage: "radial-gradient(circle at 1px 1px, #A3A3A3 1px, transparent 0)", 
                    backgroundSize: "10px 10px",
                  }}
                />
                
                {/* Main content wrapper for dashboard layout */}
                <div className="relative z-10 w-full h-full flex items-center justify-center">
                  {/* Connecting Lines - Placed before widgets and brain for z-index */}
                  {/* Line to Top-Left Widget */}
                  <div 
                    className="absolute w-10 h-px opacity-75 group-hover/aicard:opacity-100 transition-opacity duration-300 animate-line-flow"
                    style={{
                      backgroundImage: 'linear-gradient(to right, transparent 0%, rgba(109,0,255,0.7) 50%, transparent 100%)',
                      top: 'calc(50% - 10px)', 
                      left: 'calc(50% - 30px)', 
                      transform: 'translate(-50%, -50%) rotate(-45deg)', 
                      transformOrigin: 'right center'
                    }}
                  ></div>
                  {/* Line to Top-Right Widget */}
                  <div 
                    className="absolute w-10 h-px opacity-75 group-hover/aicard:opacity-100 transition-opacity duration-300 animate-line-flow"
                    style={{
                      backgroundImage: 'linear-gradient(to right, transparent 0%, rgba(99,102,241,0.7) 50%, transparent 100%)',
                      top: 'calc(50% - 10px)', 
                      left: 'calc(50% - 10px)', 
                      transform: 'translate(-50%, -50%) rotate(45deg)', 
                      transformOrigin: 'left center' 
                    }}
                  ></div>
                  {/* Line to Bottom-Center Widget */}
                  <div 
                    className="absolute w-8 h-px opacity-75 group-hover/aicard:opacity-100 transition-opacity duration-300 animate-line-flow"
                    style={{
                      backgroundImage: 'linear-gradient(to right, transparent 0%, rgba(99,102,241,0.7) 50%, transparent 100%)',
                      top: 'calc(50% + 10px)', 
                      left: '50%', 
                      transform: 'translate(-50%, -50%) rotate(90deg)', 
                      transformOrigin: 'center top' 
                    }}
                  ></div>

                  {/* Widget Top-Left: Mini Bar Chart */}
                  <div className="absolute top-3 left-3 w-16 h-10 bg-neutral-600/30 border border-neutral-500/40 rounded-md p-1 flex items-end justify-around gap-px overflow-hidden shadow-inner">
                    {[4, 7, 5, 6].map((h, i) => (
                      <div 
                        key={i} 
                        className="w-2 bg-brand-violet/70 rounded-t-sm group-hover/aicard:bg-brand-violet/80 transition-all duration-300 ease-in-out group-hover/aicard:scale-y-110 origin-bottom"
                        style={{ height: `${h * 10}%` }} 
                      />
                    ))}
                  </div>
                  {/* Widget Top-Right: Circular Pulse Indicator */}
                  <div className="absolute top-3 right-3 w-10 h-10 bg-neutral-600/30 border border-neutral-500/40 rounded-full flex items-center justify-center shadow-inner">
                    <div className="w-5 h-5 bg-emerald-500/70 rounded-full animate-pulse group-hover/aicard:bg-emerald-400/90 shadow-md shadow-emerald-500/50 ring-1 ring-inset ring-emerald-600/50"></div>
                  </div> 
                  {/* Widget Bottom-Center: Data Log Lines */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-24 h-8 bg-neutral-600/30 border border-neutral-500/40 rounded-sm p-1 flex flex-col justify-around gap-px overflow-hidden shadow-inner">
                    {[1, 2, 1].map((w, i) => (
                      <div 
                        key={i} 
                        className={`h-px ${i === 1 ? 'bg-neutral-200/70 w-[calc(100%-8px)]' : 'bg-neutral-400/60 w-full group-hover/aicard:w-[calc(100%-4px)]'} group-hover/aicard:bg-neutral-300/70 mx-auto transition-all duration-300 rounded-full`} 
                      />
                    ))}
                  </div>

                  {/* New Widget: Helix Icon (DNA) */}
                  <div className="absolute bottom-3 right-3 w-10 h-10 bg-neutral-600/30 border border-neutral-500/40 rounded-lg flex items-center justify-center shadow-inner opacity-70 group-hover/aicard:opacity-100 transition-opacity">
                    <Atom size={20} className="text-brand-violet/80 group-hover/aicard:text-brand-violet/90 animate-pulse-slower" />
                  </div>

                  {/* BrainCircuit Icon - Central Element */}
                  <BrainCircuit 
                    size={48} // Adjusted size
                    className="relative text-brand-violet transition-all duration-300 group-hover/aicard:scale-110 group-hover/aicard:drop-shadow-[0_0_18px_rgba(109,0,255,0.8)] animate-pulse-slow"
                    style={{ filter: "drop-shadow(0 0 10px rgba(109,0,255,0.6))" }} 
                  />
                </div>

                {/* Fallback/Placeholder text if needed, can be removed later */}
                {/* <p className="absolute bottom-2 text-xs text-neutral-500 z-0">
                  NGX AI Dashboard Interface
                </p> */}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section Placeholder - To be built based on reference */}
      <section className="py-20 sm:py-28 bg-neutral-950">
        <div className="container mx-auto px-6">
          <SectionTitle className="mb-8 text-white">
            Una Plataforma Integral para la <span className="text-brand-violet">Optimización Humana</span>
          </SectionTitle>
           <SectionSubtitle className="mb-12 sm:mb-16 text-neutral-300">
            Cada herramienta y característica de NGX Pulse está diseñada para ofrecerte una visión 360º de tu progreso y potenciar tu camino hacia la excelencia.
          </SectionSubtitle>
          
          <div className="grid sm:grid-cols-2 ipad:grid-cols-3 gap-6 lg:gap-8">
            {features.slice(0,6).map((feature, index) => (
              <div
                key={index}
                className="group relative bg-neutral-850/50 backdrop-blur-md p-6 rounded-xl shadow-xl shadow-black/40 border border-neutral-700/60 transition-all duration-300 hover:border-brand-violet/70 hover:bg-neutral-800/60 hover:shadow-[0_0_20px_5px_rgba(109,0,255,0.3)] transform hover:-translate-y-1"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex-shrink-0 w-10 h-10 flex items-center justify-center bg-neutral-700/70 rounded-lg shadow-md group-hover:bg-brand-violet/60 transition-colors">
                     {feature.icon} 
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1 text-neutral-100 group-hover:text-brand-violet transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-neutral-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Access Dashboard Section - Conceptually for logged-in users */}
      <section className="py-20 sm:py-28 bg-neutral-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-100">
              Panel de Acciones Rápidas
            </h2>
            <p className="mt-3 text-lg text-slate-400 max-w-xl mx-auto">
              Accede directamente a tus registros y herramientas de seguimiento.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 ipad:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
            {[ // Navigation items
              {
                title: "Bienestar y Movilidad",
                description: "Registra tu sueño, energía, enfoque y sesiones de movilidad.",
                icon: <HeartPulse size={28} className="text-brand-violet" />,
                path: "/wellness-log-page",
                bgColor: "bg-neutral-800/60 hover:bg-neutral-750/70",
                borderColor: "hover:border-brand-violet/60"
              },
              {
                title: "Check-in Diario",
                description: "Tu estado diario: recuperación, calidad de sueño y más.",
                icon: <CalendarDays size={28} className="text-pink-400" />,
                path: "/daily-checkin-page",
                bgColor: "bg-neutral-800/60 hover:bg-neutral-750/70",
                borderColor: "hover:border-pink-500/60"
              },
              {
                title: "Registro Nutricional",
                description: "Detalla tus comidas, macros, hidratación y notas nutricionales.",
                icon: <Utensils size={28} className="text-emerald-400" />,
                path: "/nutrition-log-page",
                bgColor: "bg-neutral-800/60 hover:bg-neutral-750/70",
                borderColor: "hover:border-emerald-500/60"
              },
              {
                title: "Registro de Entrenamiento",
                description: "Registra tus sesiones, ejercicios, series, RPE y sensaciones.",
                icon: <Dumbbell size={28} className="text-sky-400" />,
                path: "/training-log-page",
                bgColor: "bg-neutral-800/60 hover:bg-neutral-750/70",
                borderColor: "hover:border-sky-500/60"
              },
            ].map((item) => (
              <button
                key={item.title}
                onClick={() => navigate(item.path)}
                className={`relative group p-6 rounded-xl shadow-xl shadow-black/40 border border-neutral-700/60 transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 ${item.bgColor} ${item.borderColor} text-left w-full`}
              >
                <div className="flex flex-col items-start h-full">
                  <div className="mb-4 p-3 rounded-lg bg-neutral-700/50 group-hover:bg-neutral-600/60 transition-colors">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-100 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-400 flex-grow">
                    {item.description}
                  </p>
                  <div className="mt-auto pt-4 w-full">
                    <div className="flex items-center text-sm font-medium text-brand-violet group-hover:text-brand-violet/80 transition-colors">
                      Ir al registro
                      <ArrowRight size={16} className="ml-2 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Footer - Placeholder */}
      <footer className="py-16 border-t border-neutral-800/70 mt-12">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-neutral-500">
            &copy; {new Date().getFullYear()} NGX Systems. La vanguardia de la optimización humana.
          </p>
          <div className="mt-4 space-x-6">
            {["Política de Privacidad", "Términos de Servicio", "Contacto"].map(
              (item) => (
                <a
                  key={item}
                  href="#"
                  className="text-xs text-neutral-500 hover:text-brand-violet transition-colors duration-300"
                >
                  {item}
                </a>
              )
            )}
          </div>
        </div>
      </footer>

    </div>
  );
}
