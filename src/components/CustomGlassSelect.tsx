"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  subtitle?: string;
  badge?: string;
  avatarUrl?: string;
}

interface CustomGlassSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  searchable?: boolean;
  disabled?: boolean;
}

export default function CustomGlassSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option...",
  className = "",
  searchable = false,
  disabled = false,
}: CustomGlassSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input on open if searchable
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
    if (!isOpen) {
      setSearchTerm("");
    }
  }, [isOpen, searchable]);

  const filteredOptions = searchable && searchTerm.trim()
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (o.subtitle && o.subtitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (o.badge && o.badge.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : options;

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full glass-select flex items-center justify-between text-left cursor-pointer transition-all ${
          isOpen ? "ring-2 ring-[#0A52A9]/20 border-[#0A52A9]" : ""
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <div className="flex items-center gap-2 min-w-0 overflow-hidden pr-2 flex-1">
          {selectedOption ? (
            <div className="flex items-center gap-2 w-full min-w-0">
              {selectedOption.avatarUrl && (
                <img
                  src={selectedOption.avatarUrl}
                  alt=""
                  className="w-5 h-5 rounded-full object-cover shrink-0 border border-[#E6DEBA]"
                />
              )}
              <span className="truncate font-medium text-neutral-900 text-xs sm:text-sm">
                {selectedOption.label}
              </span>
              {selectedOption.subtitle && (
                <span className="truncate text-xs text-neutral-400 font-mono hidden sm:inline">
                  {selectedOption.subtitle}
                </span>
              )}
              {selectedOption.badge && (
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-[#FDFBF4] text-[#0A52A9] border border-[#E6DEBA] shrink-0 ml-auto mr-1">
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <span className="text-neutral-400 text-xs sm:text-sm font-normal">
              {placeholder}
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-neutral-500 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#0A52A9]" : ""
          }`}
        />
      </button>

      {/* Floating Glass Menu Popup */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-[0_16px_40px_-8px_rgba(10,82,169,0.22),0_4px_16px_rgba(0,0,0,0.08)] p-1.5 animate-in fade-in zoom-in-95 duration-150">
          {searchable && (
            <div className="p-1.5 border-b border-neutral-100 mb-1">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:border-[#0A52A9] focus:bg-white transition-all font-sans"
                />
              </div>
            </div>
          )}

          <div className="max-h-56 overflow-y-auto space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-neutral-400 font-mono">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left text-xs transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#0A52A9] text-[#F4EECF] font-semibold shadow-xs"
                        : "text-neutral-700 hover:bg-[#FDFBF4] hover:text-[#0A52A9]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {opt.avatarUrl && (
                        <img
                          src={opt.avatarUrl}
                          alt=""
                          className="w-6 h-6 rounded-full object-cover shrink-0 border border-[#E6DEBA]"
                        />
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="truncate font-medium">{opt.label}</span>
                        {opt.subtitle && (
                          <span
                            className={`truncate text-[10px] ${
                              isSelected ? "text-[#F4EECF]/75" : "text-neutral-400"
                            } font-mono`}
                          >
                            {opt.subtitle}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {opt.badge && (
                        <span
                          className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md ${
                            isSelected
                              ? "bg-white/20 text-[#F4EECF]"
                              : "bg-[#FDFBF4] text-[#0A52A9] border border-[#E6DEBA]"
                          }`}
                        >
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-[#F4EECF]" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
