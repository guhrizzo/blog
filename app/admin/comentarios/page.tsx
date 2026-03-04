"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import {
  MessageSquare,
  Trash2,
  ArrowLeft,
  Clock,
  Mail,
  Phone,
  Tag,
  Search,
  Calendar,
  FilterX,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Comment {
  id: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  planType?: string;
  text: string;
  createdAt: any;
  targetId: string;
}

// 🎨 avatar dinâmico
const getAvatarColor = (name: string) => {
  const colors = [
    "bg-rose-500",
    "bg-blue-500",
    "bg-emerald-500",
    "bg-purple-500",
    "bg-amber-500",
  ];
  const index = name?.charCodeAt(0) % colors.length;
  return colors[index];
};

export default function ManageComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<
    "all" | "today" | "7d" | "30d" | "custom"
  >("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const ITEMS_PER_PAGE = 6;

  // 🔥 realtime
  useEffect(() => {
    const q = query(
      collection(db, "comments"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Comment[];

      setComments(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 🧠 reset automático de página ao filtrar
  useEffect(() => {
    setPage(1);
  }, [search, dateFilter, startDate, endDate]);

  const handleDelete = (id: string) => {
    toast.error("Excluir registro?", {
      description:
        "Esta ação removerá permanentemente o lead do banco de dados.",
      action: {
        label: "Confirmar Exclusão",
        onClick: async () => {
          const deletePromise = deleteDoc(doc(db, "comments", id));
          toast.promise(deletePromise, {
            loading: "Processando...",
            success: "Registro deletado!",
            error: "Falha ao deletar.",
          });
        },
      },
      cancel: { label: "Manter", onClick: () => {} },
    });
  };

  const filteredComments = comments.filter((comment) => {
    if (!comment.createdAt) return false;

    const commentDate = comment.createdAt.toDate();
    const now = new Date();
    const searchLower = search.toLowerCase();

    const matchesSearch =
      comment.userName?.toLowerCase().includes(searchLower) ||
      comment.userEmail?.toLowerCase().includes(searchLower) ||
      comment.text?.toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;

    if (dateFilter === "today") {
      return commentDate.toDateString() === now.toDateString();
    }

    if (dateFilter === "7d" || dateFilter === "30d") {
      const days = dateFilter === "7d" ? 7 : 30;
      const diff =
        (now.getTime() - commentDate.getTime()) / (1000 * 3600 * 24);
      return diff <= days;
    }

    if (dateFilter === "custom" && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      return commentDate >= start && commentDate <= end;
    }

    return true;
  });

  const totalPages = Math.ceil(
    filteredComments.length / ITEMS_PER_PAGE
  );

  const paginatedComments = filteredComments.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 lg:p-12 font-sans antialiased text-slate-900">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <header className="mb-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <Link
                href="/admin"
                className="group flex items-center gap-2 text-slate-400 hover:text-yellow-600 transition-colors text-xs font-bold uppercase tracking-widest"
              >
                <ArrowLeft
                  size={14}
                  className="group-hover:-translate-x-1 transition-transform"
                />
                Painel Administrativo
              </Link>

              <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900">
                Inbox de <span className="text-yellow-500">Leads</span>
              </h1>
            </div>

            <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
              <div className="pl-4 pr-2 border-r border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                  Total Filtrado
                </p>
                <p className="text-2xl font-black text-slate-900 leading-none">
                  {filteredComments.length}
                </p>
              </div>

              <div className="w-12 h-12 bg-yellow-400 text-black rounded-xl flex items-center justify-center ">
                <MessageSquare size={22} strokeWidth={2.5} />
              </div>
            </div>
          </div>

          {/* 🔍 FILTER BAR */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 bg-white p-3 rounded-4xl shadow-sm border border-slate-200">
            <div className="lg:col-span-5 relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Filtrar por nome, e-mail ou conteúdo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-transparent rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-yellow-400/20 focus:border-yellow-400 transition-all outline-none"
              />
            </div>

            <div className="lg:col-span-3 relative">
              <Calendar
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <select
                value={dateFilter}
                onChange={(e) =>
                  setDateFilter(e.target.value as any)
                }
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-transparent rounded-2xl text-sm font-bold appearance-none cursor-pointer focus:bg-white transition-all outline-none"
              >
                <option value="all">Todo o período</option>
                <option value="today">Recebidos hoje</option>
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="custom">Personalizado...</option>
              </select>
            </div>

            <AnimatePresence>
              {dateFilter === "custom" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="lg:col-span-4 flex gap-2"
                >
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) =>
                      setStartDate(e.target.value)
                    }
                    className="flex-1 px-3 py-2 bg-slate-50 rounded-xl text-xs font-bold border-transparent focus:bg-white focus:border-yellow-400 outline-none"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) =>
                      setEndDate(e.target.value)
                    }
                    className="flex-1 px-3 py-2 bg-slate-50 rounded-xl text-xs font-bold border-transparent focus:bg-white focus:border-yellow-400 outline-none"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* 📦 CONTENT */}
        <main>
          {/* 🧊 SKELETON */}
          {loading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white border border-slate-200 rounded-[2.5rem] p-8 animate-pulse"
                >
                  <div className="flex gap-6">
                    <div className="w-14 h-14 bg-slate-200 rounded-2xl" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 w-40 bg-slate-200 rounded" />
                      <div className="h-3 w-64 bg-slate-200 rounded" />
                      <div className="h-3 w-full bg-slate-200 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : paginatedComments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-16 rounded-[3rem] border border-slate-200 text-center shadow-sm"
            >
              <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                <FilterX size={36} />
              </div>

              <h3 className="text-xl font-black text-slate-900">
                Nenhum lead encontrado
              </h3>

              <p className="text-slate-500 mt-2 max-w-sm mx-auto text-sm">
                {search || dateFilter !== "all"
                  ? "Tente ajustar os filtros ou limpar a busca."
                  : "Assim que novos leads chegarem, eles aparecerão aqui."}
              </p>

              {(search || dateFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setDateFilter("all");
                  }}
                  className="mt-6 px-5 py-2.5 bg-yellow-400 text-black rounded-xl font-bold text-sm hover:brightness-95 transition"
                >
                  Limpar filtros
                </button>
              )}
            </motion.div>
          ) : (
            <div className="grid gap-6">
              <AnimatePresence mode="popLayout">
                {paginatedComments.map((comment) => (
                  <motion.div
                    layout
                    key={comment.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group relative bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-yellow-500/10 hover:-translate-y-1 transition-all duration-500"
                  >
                    <div className="p-6 md:p-10 flex flex-col lg:flex-row gap-8">
                      {/* LEFT */}
                      <div className="lg:w-1/3 space-y-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-14 h-14 rounded-2xl ${getAvatarColor(
                              comment.userName
                            )} text-white flex items-center justify-center text-xl font-bold shadow-lg`}
                          >
                            {comment.userName?.charAt(0)}
                          </div>

                          <div>
                            <h3 className="font-black text-xl text-slate-900 leading-tight">
                              {comment.userName}
                            </h3>
                            <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                              <Clock size={12} />
                              {comment.createdAt
                                ?.toDate()
                                .toLocaleDateString("pt-BR")}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {comment.userEmail && (
                            <a
                              href={`mailto:${comment.userEmail}`}
                              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-slate-600 hover:bg-yellow-50 hover:text-yellow-700 transition-colors border border-slate-100"
                            >
                              <Mail size={16} />
                              <span className="text-xs font-bold truncate">
                                {comment.userEmail}
                              </span>
                            </a>
                          )}

                          {comment.userPhone && (
                            <a
                              href={`https://wa.me/${comment.userPhone.replace(
                                /\D/g,
                                ""
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors border border-slate-100"
                            >
                              <Phone size={16} />
                              <span className="text-xs font-bold">
                                {comment.userPhone}
                              </span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* RIGHT */}
                      <div className="flex-1 flex flex-col justify-between gap-6">
                        <div className="relative">
                          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />

                          <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                            <MessageSquare size={12} />
                            Mensagem do Lead
                          </div>

                          <p className="text-slate-700 leading-relaxed text-base italic font-medium">
                            "{comment.text}"
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                          <div className="flex items-center gap-3">
                            {comment.planType && (
                              <span className="px-3 py-1 rounded-lg bg-yellow-400/10 text-yellow-700 text-[10px] font-black uppercase border border-yellow-400/20">
                                {comment.planType}
                              </span>
                            )}

                            <div className="flex items-center gap-1 text-slate-300 text-[9px] font-bold uppercase">
                              <Tag size={10} />
                              {comment.targetId}
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              handleDelete(comment.id)
                            }
                            className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer border border-slate-100 hover:border-red-200"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* 📄 PAGINATION */}
          {totalPages > 1 && (
            <footer className="flex items-center justify-center gap-2 mt-12 py-8 border-t border-slate-200">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setPage(i + 1);
                    window.scrollTo({
                      top: 0,
                      behavior: "smooth",
                    });
                  }}
                  className={`min-w-10 h-10 rounded-xl text-sm font-black transition-all ${
                    page === i + 1
                      ? "bg-slate-900 text-white shadow-xl shadow-slate-200"
                      : "bg-white text-slate-400 border border-slate-200 hover:border-yellow-400 hover:text-yellow-600"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </footer>
          )}
        </main>
      </div>
    </div>
  );
}