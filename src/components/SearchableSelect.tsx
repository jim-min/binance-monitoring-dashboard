import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export type SearchableOption = {
  value: string;
  label: string;
  description?: string;
  meta?: string;
  searchText?: string;
};

export function SearchableSelect({
  label,
  value,
  options,
  placeholder = "검색",
  emptyText = "검색 결과가 없습니다",
  onChange,
}: {
  label: string;
  value: string;
  options: SearchableOption[];
  placeholder?: string;
  emptyText?: string;
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toUpperCase();
    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) => (
      `${option.label} ${option.description ?? ""} ${option.meta ?? ""} ${option.searchText ?? ""}`
        .toUpperCase()
        .includes(normalizedQuery)
    ));
  }, [options, query]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      window.setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  return (
    <div className="searchable-select" ref={wrapRef}>
      <button
        className="searchable-select-trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span>
          <small>{label}</small>
          <strong>{selected?.label ?? "선택"}</strong>
        </span>
        {selected?.meta ? <em>{selected.meta}</em> : null}
        <ChevronDown size={16} />
      </button>

      {isOpen ? (
        <div className="searchable-select-panel">
          <label className="searchable-select-search">
            <Search size={15} />
            <input
              ref={inputRef}
              value={query}
              placeholder={placeholder}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <div className="searchable-select-list" role="listbox">
            {filteredOptions.length > 0 ? filteredOptions.map((option) => {
              const active = option.value === value;

              return (
                <button
                  className={`searchable-select-option ${active ? "active" : ""}`}
                  type="button"
                  role="option"
                  aria-selected={active}
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  <span>
                    <strong>{option.label}</strong>
                    {option.description ? <small>{option.description}</small> : null}
                  </span>
                  {active ? <Check size={16} /> : null}
                </button>
              );
            }) : (
              <div className="searchable-select-empty">{emptyText}</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
