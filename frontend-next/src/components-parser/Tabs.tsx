'use client';

import { ReactNode, useEffect, useState } from "react";

// Define the props for the Tabs component
interface TabsProps {
  children: ReactNode[];
  activeTabIndex?: number;  // Add activeTabIndex as an optional prop
}

const Tabs: React.FC<TabsProps> = ({ children, activeTabIndex }) => {
  const [activeTab, setActiveTab] = useState(activeTabIndex || 0);

  // Ensure the external activeTabIndex prop updates the state when it changes
  useEffect(() => {
    if (activeTabIndex !== undefined) {
      setActiveTab(activeTabIndex);
    }
  }, [activeTabIndex]);

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-primary/5 p-2">
      <div className="flex gap-2 p-2 bg-slate-50/50 rounded-[1.5rem] mb-6 overflow-x-auto no-scrollbar scroll-smooth">
        {children.map((tab, index) => (
          <button
            key={index}
            className={`whitespace-nowrap px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === index
              ? "bg-white text-slate-900 shadow-md ring-1 ring-slate-200"
              : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
              }`}
            onClick={() => setActiveTab(index)}
          >
            {(tab as React.ReactElement<any>).props.label}
          </button>
        ))}
      </div>
      <div className="p-2 transition-all duration-500 ease-out">
        {children.map((tab, index) =>
          activeTab === index ? <div key={index} className="animate-in fade-in slide-in-from-bottom-2 duration-500">{tab}</div> : null
        )}
      </div>
    </div>
  );
};

export default Tabs;