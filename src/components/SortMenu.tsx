import { ChevronDown, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type SortOption<T extends string> = {
  value: T;
  label: string;
};

export function SortMenu<T extends string>({
  label = "정렬",
  value,
  options,
  onChange,
  className = "",
}: {
  label?: string;
  value: T;
  options: SortOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const activeOption = options.find((option) => option.value === value) ?? options[0];

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

  return (
    <div className={`sort-menu ${className}`} ref={wrapRef}>
      <button
        className="sort-menu-trigger"
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span>{label}</span>
        <strong>{activeOption.label}</strong>
        <ChevronDown size={16} />
      </button>

      {isOpen ? (
        <div className="sort-menu-panel" role="menu">
          {options.map((option) => {
            const active = option.value === value;

            return (
              <button
                className={`sort-menu-option ${active ? "active" : ""}`}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <span>{option.label}</span>
                {active ? <Check size={16} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
