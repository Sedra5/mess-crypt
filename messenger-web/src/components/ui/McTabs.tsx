interface McTabsProps {
  tabs: { id: string; label: string; count?: number }[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export function McTabs({ tabs, activeTab, onTabChange }: McTabsProps) {
  return (
    <div className="flex px-4 pt-3 gap-1 border-b border-[#D4EAE3]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-3.5 py-2 text-[13px] font-medium bg-transparent border-none cursor-pointer -mb-px border-b-2 transition-colors duration-150 flex items-center gap-1.5 ${
            activeTab === tab.id
              ? "text-[#0F6E56] border-b-[#0F6E56] font-semibold"
              : "text-[#7EA898] border-b-transparent hover:text-[#4A5A54]"
          }`}
        >
          {tab.label}
          {tab.count !== undefined && tab.count > 0 && (
            <span className="bg-[#0F6E56] text-white text-[10px] font-semibold px-1.5 py-[1px] rounded-[10px]">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
