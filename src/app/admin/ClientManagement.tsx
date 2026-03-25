import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Building2,
  X,
  AlertTriangle,
  ExternalLink,
  UserCircle2,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useStore } from "../data/store";
import type { Client } from "../data/types";

// ─── Color palette ────────────────────────────────────────────────────────────

const COLORS = [
  "#2563eb",
  "#10b981",
  "#f59e0b",
  "#7c3aed",
  "#db2777",
  "#ef4444",
  "#0ea5e9",
  "#84cc16",
];

// ─── Blank client template ────────────────────────────────────────────────────

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ClientModalProps {
  initial: Partial<Client> | null;
  onSave: (data: Client | Omit<Client, "id" | "activeCampaigns">) => void;
  onClose: () => void;
  isEdit: boolean;
}

function ClientModal({ initial, onSave, onClose, isEdit }: ClientModalProps) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    company: initial?.company ?? "",
    color: initial?.color ?? COLORS[0],
    briefing: initial?.briefing ?? "",
    logo: initial?.logo ?? "",
    website: initial?.website ?? "",
  });
  const [errors, setErrors] = useState<{ name?: string; company?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Nome é obrigatório.";
    if (!form.company.trim()) e.company = "Empresa é obrigatória.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (isEdit && initial?.id != null) {
      onSave({
        ...form,
        id: initial.id,
        activeCampaigns: initial.activeCampaigns ?? 0,
      } as Client);
    } else {
      onSave(form);
    }
  };

  const field = (
    key: keyof typeof form,
    label: string,
    placeholder: string,
    multiline = false
  ) => (
    <div className="space-y-1.5">
      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
        {label}
      </label>
      {multiline ? (
        <textarea
          rows={5}
          value={form[key]}
          placeholder={placeholder}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 resize-none"
        />
      ) : (
        <input
          type="text"
          value={form[key]}
          placeholder={placeholder}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 ${
            (errors as any)[key] ? "border-red-300" : "border-slate-100"
          }`}
        />
      )}
      {(errors as any)[key] && (
        <p className="text-xs text-red-500">{(errors as any)[key]}</p>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
      >
        <div className="p-8 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-900">
              {isEdit ? "Editar Cliente" : "Novo Cliente"}
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-5">
            {field("name", "Nome do Responsável", "Ex: João Silva")}
            {field("company", "Nome da Empresa", "Ex: Alpha Tech Solutions")}
            {field("website", "Site (para preview dos anúncios)", "https://www.suaempresa.com.br")}
            {field(
              "logo",
              "URL do Logo (opcional)",
              "https://exemplo.com/logo.png"
            )}
            {field(
              "briefing",
              "Briefing / Observações Estratégicas",
              "Descreva aqui o briefing, objetivos e particularidades do cliente...",
              true
            )}

            <div className="space-y-3">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                Cor de Identificação
              </label>
              <div className="flex flex-wrap gap-3">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setForm({ ...form, color })}
                    className={`w-10 h-10 rounded-xl border-2 transition-all ${
                      form.color === color
                        ? "border-slate-900 scale-110"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              onClick={onClose}
              className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200 transition-colors"
            >
              {isEdit ? "Salvar Alterações" : "Cadastrar Cliente"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Delete confirmation ──────────────────────────────────────────────────────

function DeleteModal({
  client,
  onConfirm,
  onClose,
}: {
  client: Client;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 p-8"
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Remover Cliente
            </h3>
            <p className="text-sm text-slate-500">
              Tem certeza que deseja remover{" "}
              <span className="font-bold text-slate-700">{client.name}</span>?
              Esta ação não pode ser desfeita.
            </p>
          </div>
          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
            >
              Remover
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ClientManagement() {
  const { clients, addClient, updateClient, deleteClient } = useStore();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | "delete" | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openEdit = (client: Client) => {
    setSelectedClient(client);
    setModal("edit");
  };

  const openDelete = (client: Client) => {
    setSelectedClient(client);
    setModal("delete");
  };

  const closeModal = () => {
    setModal(null);
    setSelectedClient(null);
  };

  const handleSave = (data: Client | Omit<Client, "id" | "activeCampaigns">) => {
    if (modal === "edit") {
      updateClient(data as Client);
    } else {
      addClient(data as Omit<Client, "id" | "activeCampaigns">);
    }
    closeModal();
  };

  const handleDelete = () => {
    if (selectedClient) deleteClient(selectedClient.id);
    closeModal();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-slate-900" style={{ fontWeight: 700 }}>
            Gestão de Clientes
          </h1>
          <p className="text-slate-500">
            {clients.length} cliente{clients.length !== 1 ? "s" : ""} cadastrado
            {clients.length !== 1 ? "s" : ""}.
          </p>
        </div>
        <button
          onClick={() => setModal("create")}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2 w-full md:w-auto"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Novo Cliente
        </button>
      </div>

      {/* Search */}
      <div
        className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center"
      >
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Buscar por nome ou empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((client, i) => (
          <motion.div
            key={client.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white border-2 border-slate-200 rounded-2xl p-6 focus-within:border-blue-500 transition-all text-center group relative overflow-hidden"
          >
            <div className="h-2 w-full" style={{ backgroundColor: client.color }} />
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-sm"
                  style={{ backgroundColor: client.color }}
                >
                  {client.logo ? (
                    <img
                      src={client.logo}
                      alt={client.name}
                      className="w-full h-full object-contain p-2 rounded-2xl bg-white"
                    />
                  ) : (
                    client.company.charAt(0)
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => navigate(`/admin/clients/${client.id}`)}
                    className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all"
                    title="Perfil do Cliente"
                  >
                    <UserCircle2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEdit(client)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openDelete(client)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Remover"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg text-slate-900 font-bold leading-tight mb-1">
                  {client.name}
                </h3>
                <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                  <Building2 className="w-3.5 h-3.5" />
                  {client.company}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-0.5">
                    Campanhas
                  </p>
                  <p className="text-lg text-slate-900 font-bold">
                    {client.activeCampaigns}
                  </p>
                </div>
                <div
                  className="rounded-xl p-3 text-center"
                  style={{
                    backgroundColor: client.color + "18",
                    border: `1px solid ${client.color}30`,
                  }}
                >
                  <p
                    className="text-[10px] uppercase font-bold tracking-widest mb-0.5"
                    style={{ color: client.color }}
                  >
                    Status
                  </p>
                  <p
                    className="text-sm font-bold uppercase"
                    style={{ color: client.color }}
                  >
                    {client.activeCampaigns > 0 ? "Ativo" : "Sem camp."}
                  </p>
                </div>
              </div>

              {client.briefing && (
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4">
                  {client.briefing}
                </p>
              )}

              <button
                onClick={() => navigate("/admin/campaigns")}
                className="w-full py-3 bg-slate-50 group-hover:bg-blue-600 text-slate-600 group-hover:text-white border border-slate-100 group-hover:border-blue-600 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
              >
                Ver Campanhas
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}

        {/* Add new placeholder */}
        <button
          onClick={() => setModal("create")}
          className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/30 transition-all min-h-[300px]"
        >
          <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
            <Plus className="w-6 h-6" />
          </div>
          <p className="font-bold">Adicionar Cliente</p>
        </button>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && searchTerm && (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
          <p className="text-slate-500 font-medium">
            Nenhum cliente encontrado para "{searchTerm}".
          </p>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {(modal === "create" || modal === "edit") && (
          <ClientModal
            key={modal}
            initial={modal === "edit" ? selectedClient : null}
            isEdit={modal === "edit"}
            onSave={handleSave}
            onClose={closeModal}
          />
        )}
        {modal === "delete" && selectedClient && (
          <DeleteModal
            client={selectedClient}
            onConfirm={handleDelete}
            onClose={closeModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
