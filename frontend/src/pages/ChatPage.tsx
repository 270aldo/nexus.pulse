
import { supabase } from "../utils/supabaseClient";
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import BackButton from "@/components/BackButton"; // Importar BackButton

interface Message {
  id: string; // Will be Supabase UUID after saving, local temporary before that
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
}

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false); // General processing state for sending or loading
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Placeholder for user profile - replace with actual user data later
  const userProfile = { name: "Aldo O.", avatarUrl: "" }; // Placeholder
  const aiProfile = { name: "NGX AI", avatarUrl: "/logo_icon_light.svg" };

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        console.warn("User not logged in. Chat functionality will be disabled.");
        toast.error("Debes iniciar sesión para acceder al chat.");
        // Potentially redirect to login page here
      }
    };
    getCurrentUser();
  }, []);

  // Load messages from Supabase
  useEffect(() => {
    if (!userId) return;

    const fetchMessages = async () => {
      setIsProcessing(true);
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, sender, text_content, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
      
      if (error) {
        console.error("Error fetching messages:", error);
        toast.error("Error al cargar el historial del chat.");
      } else if (data) {
        const loadedMessages: Message[] = data.map((msg: any) => ({
          id: msg.id,
          sender: msg.sender as "user" | "ai",
          text: msg.text_content,
          timestamp: new Date(msg.created_at),
        }));
        setMessages(loadedMessages);
      }
      setIsProcessing(false);
    };

    fetchMessages();
  }, [userId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (currentMessage.trim() === "" || !userId) {
      if (!userId) toast.info("Por favor, inicia sesión para enviar mensajes.");
      return;
    }
    setIsProcessing(true);

    const tempUserMessageId = `user-local-${Date.now()}`;
    const userMessageText = currentMessage;
    const newUserMessageForUI: Message = {
      id: tempUserMessageId,
      sender: "user",
      text: userMessageText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newUserMessageForUI]);
    setCurrentMessage("");

    try {
      const response = await fetch("/routes/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId, message: userMessageText }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempUserMessageId
            ? { ...msg, id: data.user_message.id, timestamp: new Date(data.user_message.created_at) }
            : msg
        )
      );

      const aiMessage: Message = {
        id: data.ai_message.id,
        sender: "ai",
        text: data.ai_message.text_content,
        timestamp: new Date(data.ai_message.created_at),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("Error al enviar tu mensaje. Intenta de nuevo.");
      setMessages((prev) => prev.filter((msg) => msg.id !== tempUserMessageId));
      setCurrentMessage(userMessageText);
    }

    setIsProcessing(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-neutral-900 via-neutral-950 to-black text-neutral-100">
      <header className="p-4 border-b border-neutral-700/50 shadow-md sticky top-0 bg-neutral-900/70 backdrop-blur-md z-10">
        <BackButton className="mb-2 sm:mb-0 sm:mr-4" /> {/* Añadir BackButton */}
        <h1 className="text-xl font-semibold text-brand-violet flex items-center">
          <Bot className="mr-2 h-6 w-6" /> NGX AI Coach
        </h1>
      </header>

      <ScrollArea className="flex-grow p-4 sm:p-6" ref={scrollAreaRef}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex items-end gap-3 max-w-[85%] sm:max-w-[75%] mb-4",
              msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            <Avatar className="h-8 w-8 border border-neutral-600 shadow-sm">
              <AvatarImage src={msg.sender === 'user' ? userProfile.avatarUrl : aiProfile.avatarUrl} />
              <AvatarFallback className="bg-neutral-700 text-neutral-400 text-xs">
                {msg.sender === 'user' 
                  ? userProfile.name.substring(0,2).toUpperCase() 
                  : aiProfile.name.substring(0,2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div
              className={cn(
                "p-3 rounded-xl shadow-md text-sm sm:text-base leading-relaxed",
                msg.sender === "user"
                  ? "bg-brand-violet/90 text-white rounded-br-none"
                  : "bg-neutral-750 text-neutral-100 rounded-bl-none border border-neutral-700"
              )}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
              <p className={cn(
                "text-xs mt-1.5 opacity-60",
                msg.sender === 'user' ? 'text-right' : 'text-left'
              )}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {messages.length === 0 && !isProcessing && (
          <div className="text-center text-neutral-500 pt-20">
            Comienza tu conversación con el NGX AI Coach. <br/> Pregunta sobre tu programa, registros o pide recomendaciones.
          </div>
        )}
         {messages.length === 0 && isProcessing && (
          <div className="text-center text-neutral-500 pt-20">Cargando historial...</div>
        )}
      </ScrollArea>

      <div className="p-4 sm:p-6 border-t border-neutral-700/50 bg-neutral-900/80 backdrop-blur-md sticky bottom-0">
        <div className="flex items-center gap-3">
          <Input
            type="text"
            placeholder={userId ? "Escribe tu mensaje..." : "Inicia sesión para chatear"}
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isProcessing && userId && handleSendMessage()}
            className="flex-grow bg-neutral-800 border-neutral-600/50 text-neutral-100 placeholder:text-neutral-500 focus:ring-2 focus:ring-brand-violet/70 focus:border-brand-violet transition-shadow duration-300 focus:shadow-[0_0_15px_2px_rgba(109,0,255,0.3)]"
            disabled={isProcessing || !userId}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isProcessing || currentMessage.trim() === "" || !userId}
            className="bg-brand-violet hover:bg-brand-violet/90 text-white font-semibold p-3 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand-violet/50 focus:ring-offset-2 focus:ring-offset-neutral-900"
          >
            <Send className="h-5 w-5" />
            <span className="sr-only">Enviar mensaje</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
