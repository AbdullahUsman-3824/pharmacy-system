"use client";

import { useState, useRef, useEffect, useMemo, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

export interface ComboboxOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface ComboboxProps {
  value: string;
  onChange: (id: string) => void;
  options: ComboboxOption[];
  isLoading?: boolean;
  placeholder?: string;
}

export function Combobox({
  value,
  onChange,
  options,
  isLoading,
  placeholder,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [rect, setRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.id === value);

  const filtered = useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.sublabel?.toLowerCase().includes(q),
    );
  }, [options, query]);

  const updateRect = () => {
    if (!inputRef.current) return;
    const r = inputRef.current.getBoundingClientRect();
    setRect({ top: r.bottom + 4, left: r.left, width: r.width });
  };

  useLayoutEffect(() => {
    if (open) updateRect();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleScrollOrResize() {
      updateRect();
    }
    function handleClickOutside(e: MouseEvent) {
      if (
        inputRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setOpen(false);
      setQuery("");
    }
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        value={open ? query : (selected?.label ?? "")}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && open && filtered.length > 0) {
            const top = filtered[0];
            if (top.id !== value) onChange(top.id);
            setOpen(false);
            setQuery("");
          }
        }}
        placeholder={isLoading ? "Loading..." : placeholder}
        className="w-full border rounded px-2 py-1.5 text-sm"
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
            className="z-50 max-h-56 overflow-auto border rounded bg-white shadow-lg"
          >
            {filtered.length === 0 && (
              <div className="px-2 py-1.5 text-sm text-gray-400">
                No results
              </div>
            )}
            {filtered.map((opt) => (
              <div
                key={opt.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(opt.id);
                  setOpen(false);
                  setQuery("");
                }}
                className={`px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-100 ${
                  opt.id === value ? "bg-blue-50 font-medium" : ""
                }`}
              >
                {opt.label}
                {opt.sublabel && (
                  <span className="text-gray-400 ml-1 text-xs">
                    {opt.sublabel}
                  </span>
                )}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
