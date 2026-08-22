import { ReactNode, useState, useRef, useEffect } from "react";

interface DropdownItem {
  label: string;
  onClick?: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
}

interface DropdownSection {
  label?: string;
  items: DropdownItem[];
}

interface DropdownProps {
  trigger: ReactNode;
  sections: DropdownSection[];
  align?: "left" | "right";
  width?: "auto" | "sm" | "md" | "lg";
  placement?: "bottom" | "top"; // new prop
}

const Dropdown = ({
  trigger,
  sections,
  align = "left",
  width = "md",
  placement = "bottom", // default bottom
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

  // Determine vertical positioning classes
  const placementStyles = {
    bottom: "mt-2",
    top: "bottom-full mb-2",
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen((prev) => !prev)}>{trigger}</div>

      {isOpen && (
        <div
          className={`absolute ${placementStyles[placement]} ${alignStyles[align]} ${
            widths[width]
          } bg-[var(--color-card)] rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] border border-[var(--color-border)] py-1 z-50`}
        >
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {section.label && (
                <div className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                  {section.label}
                </div>
              )}

              {section.items.map((item, itemIndex) => (
                <button
                  key={itemIndex}
                  type="button"
                  onClick={() => {
                    if (!item.disabled) {
                      item.onClick?.();
                      setIsOpen(false);
                    }
                  }}
                  disabled={item.disabled}
                  className={`w-full px-6 py-2 text-sm text-left flex items-center gap-2 transition-colors duration-150 ${
                    item.danger
                      ? "text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-background-muted)]"
                  } ${
                    item.disabled
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}

              {sectionIndex < sections.length - 1 && (
                <div className="my-1 border-t border-[var(--color-border)]" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
