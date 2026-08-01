import { ReactNode, useState, useRef, useEffect } from "react";

interface DropdownItem {
  label: string;
  onClick?: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
  width?: "auto" | "sm" | "md" | "lg";
}

const Dropdown = ({
  trigger,
  items,
  align = "left",
  width = "md",
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const widths = {
    auto: "w-auto",
    sm: "w-48",
    md: "w-56",
    lg: "w-64",
  };

  const alignStyles = {
    left: "left-0",
    right: "right-0",
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          className={`absolute mt-2 ${alignStyles[align]} ${widths[width]} bg-[var(--color-card)] rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] border border-[var(--color-border)] py-1 z-50 transition-all duration-200`}
        >
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick?.();
                  setIsOpen(false);
                }
              }}
              disabled={item.disabled}
              className={`w-full px-4 py-2 text-sm text-left flex items-center gap-2 transition-colors duration-150 ${
                item.danger
                  ? "text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-background-muted)]"
              } ${item.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
