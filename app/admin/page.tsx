"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import {
  PlusCircle,
  Settings,
  PackagePlus,
  Video,
  Camera,
  CalendarDays,
  LayoutDashboard,
  FileText,
  Boxes,
  ShieldCheck,
  Users,
  TrendingUp,
  Search,
  LogOut,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare
} from "lucide-react";

// Tipagem para dados mockados de contratos (substituir por dados reais do Firebase)
interface ContractStats {
  total: number;
  pending: number;
  signedToday: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("Administrador");
  const [userEmail, setUserEmail] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isScrolled, setIsScrolled] = useState(false);
  
  

  // Atualizar hora e detectar scroll
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const name = user.displayName || user.email?.split('@')[0] || "Administrador";
        setUserName(name.charAt(0).toUpperCase() + name.slice(1));
        setUserEmail(user.email || "");
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 font-sans pb-20">
      {/* Navbar Moderna com Glassmorphism */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/80 backdrop-blur-xl shadow-lg border-b border-slate-200/50' 
          : 'bg-white border-b border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="bg-linear-to-br from-yellow-400 to-yellow-600 p-2.5 rounded-xl shadow-lg shadow-yellow-500/20 group-hover:scale-105 transition-transform">
                <LayoutDashboard className="text-white" size={22} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  PROTECT <span className="text-yellow-600 font-black">ADMIN</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                  Sistema de Gestão
                </p>
              </div>
            </div>

            {/* Ações do Header */}
            <div className="flex items-center gap-4">
              {/* Hora Atual */}
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full">
                <Clock size={14} className="text-slate-500" />
                <span className="text-sm font-semibold text-slate-600">{currentTime}</span>
              </div>

              {/* User Profile Mini */}
              <div className="hidden md:flex items-center gap-3 pl-4 border-l border-slate-200">
                <div className="w-10 h-10 bg-linear-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  {userName.charAt(0)}
                </div>
                <div className="hidden lg:block">
                  <p className="text-sm font-bold text-slate-900">{userName}</p>
                  <p className="text-xs text-slate-500 truncate max-w-30">{userEmail}</p>
                </div>
              </div>

              {/* Logout */}
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 border border-red-200 hover:border-red-300 rounded-xl transition-all group"
              >
                <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pt-28">
        
        {/* Header de Boas-vindas Aprimorado */}
        <header className="mb-12 relative">
          <div className="absolute -top-4 -left-4 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl"></div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold uppercase tracking-wider rounded-full">
                Dashboard
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-500 text-sm">Visão Geral</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-3 tracking-tight">
              Painel de <span className="text-transparent bg-clip-text bg-linear-to-r from-yellow-600 to-yellow-500">Gestão</span>
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl">
              Bem-vindo de volta, <span className="text-slate-900 font-bold">{userName}</span>. 
              Gerencie conteúdo, contratos e interações com seus membros.
            </p>
          </div>
        </header>

        {/* SEÇÃO 01: OPERACIONAL */}
        <SectionTitle 
          icon={<FileText size={18} />}
          title="Operacional e Conteúdo"
          description="Gerencie posts, produtos e eventos do clube"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <AdminBlock 
            title="Blog e Notícias" 
            color="blue" 
            icon={<PlusCircle size={24} />}
            subtitle="Artigos e atualizações"
            manageHref="/admin/posts" 
            addHref="/admin/novo"
          />
          <AdminBlock 
            title="Catálogo / Loja" 
            color="indigo" 
            icon={<PackagePlus size={24} />}
            subtitle="Produtos e equipamentos"
            manageHref="/admin/produtos" 
            addHref="/admin/produtos/novo"
          />
          <AdminBlock 
            title="Calendário de Eventos" 
            color="amber" 
            icon={<CalendarDays size={24} />}
            subtitle="Agenda e compromissos"
            manageHref="/admin/agenda/gerenciar" 
            addHref="/admin/agenda"
          />
        </div>

        {/* SEÇÃO 02: CONTRATOS */}
        <SectionTitle 
          icon={<ShieldCheck size={18} />}
          title="Gestão de Contratos"
          description="Assinaturas digitais e documentação de sócios"
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Card Principal de Contratos */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-500 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-br from-emerald-50 to-transparent rounded-bl-full opacity-50"></div>
            
            <div className="relative flex flex-col h-full">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-linear-to-br from-emerald-100 to-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-200 group-hover:scale-110 transition-transform duration-300">
                    <ShieldCheck size={32} />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-slate-800">Contratos Digitais</h4>
                    <p className="text-slate-500 text-sm mt-1">Gestão de sócios colaboradores</p>
                  </div>
                </div>
            
              </div>

          

              {/* Ações */}
              <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                
                <Link 
                  href="/admin/contratos" 
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-white text-emerald-700 border-2 border-emerald-200 rounded-2xl font-bold hover:bg-emerald-50 hover:border-emerald-300 transition-all text-sm uppercase tracking-wider group/btn"
                >
                  <Settings size={18} className="group-hover/btn:rotate-180 transition-transform duration-500" />
                  Gerenciar Todos
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* SEÇÃO 03: MÍDIA */}
        <SectionTitle 
          icon={<Boxes size={18} />}
          title="Mídia e Galeria Visual"
          description="Gestão de conteúdo multimídia"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <AdminBlock 
            title="Central de Vídeos" 
            color="purple" 
            icon={<Video size={24} />}
            subtitle="Upload e organização"
            manageHref="/admin/videos/gerenciar" 
            addHref="/admin/videos"
          />
          <AdminBlock 
            title="Galeria de Fotos" 
            color="emerald" 
            icon={<Camera size={24} />}
            subtitle="Álbuns e eventos"
            manageHref="/admin/galeria/gerenciar" 
            addHref="/admin/galeria"
          />
        </div>

        {/* Footer do Dashboard */}
        <footer className="mt-20 pt-8 border-t border-slate-200 text-center text-slate-400 text-sm">
          <p>© {new Date().getFullYear()} Protect Clube Mineiro de Tiro. Todos os direitos reservados.</p>
          <p className="mt-1 text-xs">Sistema de Gestão Interno v2.0</p>
        </footer>
      </main>
    </div>
  );
}

// Componentes Auxiliares

function SectionTitle({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">{title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        </div>
      </div>
    </div>
  );
}

function AdminBlock({ 
  title, 
  color, 
  icon, 
  subtitle,
  manageHref, 
  addHref
}: { 
  title: string; 
  color: string; 
  icon: React.ReactNode; 
  subtitle: string;
  manageHref: string; 
  addHref: string;
}) {
  const colors: Record<string, { bg: string; text: string; border: string; hover: string; light: string }> = {
    yellow: { 
      bg: "bg-yellow-50", 
      text: "text-yellow-600", 
      border: "border-yellow-200",
      hover: "hover:bg-yellow-500 hover:text-white hover:border-yellow-600",
      light: "bg-yellow-400/10"
    },
    blue: { 
      bg: "bg-blue-50", 
      text: "text-blue-600", 
      border: "border-blue-200",
      hover: "hover:bg-blue-600 hover:text-white hover:border-blue-700",
      light: "bg-blue-400/10"
    },
    indigo: { 
      bg: "bg-indigo-50", 
      text: "text-indigo-600", 
      border: "border-indigo-200",
      hover: "hover:bg-indigo-600 hover:text-white hover:border-indigo-700",
      light: "bg-indigo-400/10"
    },
    amber: { 
      bg: "bg-amber-50", 
      text: "text-amber-600", 
      border: "border-amber-200",
      hover: "hover:bg-amber-500 hover:text-white hover:border-amber-600",
      light: "bg-amber-400/10"
    },
    purple: { 
      bg: "bg-purple-50", 
      text: "text-purple-600", 
      border: "border-purple-200",
      hover: "hover:bg-purple-600 hover:text-white hover:border-purple-700",
      light: "bg-purple-400/10"
    },
    emerald: { 
      bg: "bg-emerald-50", 
      text: "text-emerald-600", 
      border: "border-emerald-200",
      hover: "hover:bg-emerald-600 hover:text-white hover:border-emerald-700",
      light: "bg-emerald-400/10"
    },
    rose: { 
      bg: "bg-rose-50", 
      text: "text-rose-600", 
      border: "border-rose-200",
      hover: "hover:bg-rose-600 hover:text-white hover:border-rose-700",
      light: "bg-rose-400/10"
    },
    cyan: { 
      bg: "bg-cyan-50", 
      text: "text-cyan-600", 
      border: "border-cyan-200",
      hover: "hover:bg-cyan-600 hover:text-white hover:border-cyan-700",
      light: "bg-cyan-400/10"
    },
  };

  const selectedColor = colors[color] || colors.blue;

  return (
    <div className="group bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-500 relative overflow-hidden">
      {/* Background Decoration */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 ${selectedColor.light} rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`}></div>
      
      <div className="relative">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 border-2 ${selectedColor.bg} ${selectedColor.text} ${selectedColor.border} ${selectedColor.hover} group-hover:scale-110`}>
              {icon}
            </div>
            <div>
              <h4 className="text-xl font-black text-slate-800 leading-tight">{title}</h4>
              <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link 
            href={addHref} 
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all text-sm uppercase tracking-wider shadow-lg shadow-slate-900/20 group/btn"
          >
            {title === "Comentários" ? <MessageSquare size={16} /> : <PlusCircle size={16} className="group-hover/btn:rotate-90 transition-transform" />} 
            {title === "Comentários" ? "Ver Recentes" : "Novo Registro"}
          </Link>
          <Link 
            href={manageHref} 
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-white text-slate-600 border-2 border-slate-200 rounded-xl font-bold hover:border-slate-400 hover:text-slate-900 transition-all text-sm uppercase tracking-wider group/btn hover:bg-slate-50"
          >
            <Settings size={16} className="group-hover/btn:rotate-180 transition-transform duration-500" /> 
            Gerenciar
          </Link>
        </div>
      </div>
    </div>
  );
}