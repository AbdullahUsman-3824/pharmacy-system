import { ReactNode, useState } from "react";

interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  variant?: "default" | "pills";
}

const Tabs = ({
  tabs,
  defaultTab,
  onChange,
  variant = "default",
}: TabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || "");

  const handleTabChange = (tabId: string) => {
    if (tabs.find((t) => t.id === tabId)?.disabled) return;
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const variantStyles = {
    default: {
      list: "border-b border-[var(--color-border)]",
      button: (isActive: boolean, disabled: boolean) =>
        `px-4 py-2 -mb-px text-sm font-medium transition-all duration-200 ${
          isActive
            ? "text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]"
            : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] border-b-2 border-transparent hover:border-[var(--color-border)]"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`,
    },
    pills: {
      list: "space-x-1",
      button: (isActive: boolean, disabled: boolean) =>
        `px-4 py-2 text-sm font-medium rounded-[var(--radius-full)] transition-all duration-200 ${
          isActive
            ? "bg-[var(--color-primary)] text-white"
            : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-background-muted)]"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`,
    },
  };

  const styles = variantStyles[variant];

  return (
    <div>
      <div className={styles.list}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            disabled={tab.disabled}
            className={styles.button(activeTab === tab.id, !!tab.disabled)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {tabs.find((t) => t.id === activeTab)?.content}
      </div>
    </div>
  );
};

export default Tabs;
