"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface ComboboxOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface ComboboxProps {
  value: string;
  search: string;
  onSearchChange: (value: string) => void;

  options: ComboboxOption[];

  onChange: (id: string) => void;

  isLoading?: boolean;
  placeholder?: string;

  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function Combobox({
  value,
  search,
  onSearchChange,
  options,
  onChange,
  isLoading,
  placeholder,
  onKeyDown,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [rect, setRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const selected = options.find((o) => o.id === value);

  function updateRect() {
    if (!inputRef.current) return;

    const r = inputRef.current.getBoundingClientRect();

    setRect({
      top: r.bottom + 6,
      left: r.left,
      width: r.width,
    });
  }

  useLayoutEffect(() => {
    if (open) updateRect();
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return;

    const handleScroll = () => updateRect();

    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      ) {
        return;
      }

      setOpen(false);
      onSearchChange("");
    };

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, onSearchChange]);

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        value={open ? search : (selected?.label ?? "")}
        placeholder={placeholder}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        onFocus={() => {
          setOpen(true);
          onSearchChange("");
        }}
        onChange={(e) => {
          setOpen(true);
          setHighlightedIndex(0);
          onSearchChange(e.target.value);
        }}
        onKeyDown={(e) => {
          onKeyDown?.(e);

          if (!open) return;

          switch (e.key) {
            case "ArrowDown":
              e.preventDefault();
              setHighlightedIndex((i) => Math.min(i + 1, options.length - 1));
              break;

            case "ArrowUp":
              e.preventDefault();
              setHighlightedIndex((i) => Math.max(i - 1, 0));
              break;

            case "Escape":
              e.preventDefault();
              setOpen(false);
              onSearchChange("");
              break;

            case "Enter":
              if (options.length === 0) return;

              e.preventDefault();

              onChange(options[highlightedIndex].id);

              setOpen(false);
              onSearchChange("");
              break;
          }
        }}
      />

      {open &&
        rect &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: rect.top,
              left: rect.left,
              width: rect.width,
            }}
            className="z-50 max-h-72 overflow-auto rounded-md border border-gray-200 bg-white shadow-xl"
          >
            {isLoading ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                Searching...
              </div>
            ) : options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                No products found
              </div>
            ) : (
              options.map((option, index) => (
                <div
                  key={option.id}
                  onMouseDown={(e) => {
                    e.preventDefault();

                    onChange(option.id);

                    setOpen(false);
                    onSearchChange("");
                  }}
                  className={`cursor-pointer px-3 py-2 ${
                    highlightedIndex === index
                      ? "bg-blue-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="text-sm font-medium">{option.label}</div>

                  {option.sublabel && (
                    <div className="text-xs text-gray-500">
                      {option.sublabel}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
