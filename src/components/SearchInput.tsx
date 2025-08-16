import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchInputProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  placeholder?: string;
  showButton?: boolean;
}

export function SearchInput({ onSearch, isLoading, placeholder = "Ask anything about Football...", showButton = true }: SearchInputProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center w-full max-w-2xl mx-auto">
      <div className="relative flex-1">
        <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10 md:pl-12 pr-4 py-4 md:py-6 text-base md:text-lg rounded-full border-2 border-border hover:border-primary/20 focus:border-primary transition-colors shadow-sm"
          style={{ boxShadow: "var(--search-shadow)" }}
          disabled={isLoading}
          autoFocus
        />
      </div>
      {showButton && (
        <Button
          type="submit"
          disabled={!query.trim() || isLoading}
          className="ml-2 md:ml-3 px-4 md:px-6 py-4 md:py-6 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
          ) : (
            <Search className="h-4 w-4 md:h-5 md:w-5" />
          )}
        </Button>
      )}
    </form>
  );
}