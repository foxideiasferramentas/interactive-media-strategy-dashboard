interface FunnelTabsProps {
  activeTab: "top" | "middle" | "bottom";
  onTabChange: (tab: "top" | "middle" | "bottom") => void;
}

export function FunnelTabs({ activeTab, onTabChange }: FunnelTabsProps) {
  const tabs = [
    { id: "top" as const, label: "Topo de Funil", subtitle: "Conscientização" },
    { id: "middle" as const, label: "Meio de Funil", subtitle: "Consideração" },
    { id: "bottom" as const, label: "Fundo de Funil", subtitle: "Conversão" },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-2 inline-flex gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            px-6 py-3 rounded-lg transition-all font-medium
            ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-700 hover:bg-gray-100"
            }
          `}
        >
          <div className="text-left">
            <div className={activeTab === tab.id ? "font-semibold" : ""}>
              {tab.label}
            </div>
            <div className={`text-sm ${activeTab === tab.id ? "text-blue-100" : "text-gray-500"}`}>
              {tab.subtitle}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
