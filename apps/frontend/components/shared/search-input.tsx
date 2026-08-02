import { InputHTMLAttributes, forwardRef } from "react";
import Input from "../ui/input";
import { Search } from "lucide-react";

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
  debounceDelay?: number;
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onSearch, debounceDelay = 300, className = "", ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (onSearch) {
        const timeout = setTimeout(() => {
          onSearch(value);
        }, debounceDelay);
        return () => clearTimeout(timeout);
      }
    };

    return (
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="w-5 h-5 text-[var(--color-text-muted)]" />
        </div>
        <Input
          ref={ref}
          className={`pl-10 ${className}`}
          onChange={handleChange}
          {...props}
        />
      </div>
    );
  },
);

SearchInput.displayName = "SearchInput";

export default SearchInput;
