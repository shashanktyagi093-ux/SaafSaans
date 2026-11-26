import { Loader2, MapPin, Search, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { searchCities } from '../../lib/openMeteo.js';
import type { CitySearchResult } from '../../lib/types.js';

interface CitySearchBarProps {
  selectedCity: CitySearchResult | null;
  onSelectCity: (city: CitySearchResult) => void;
}

export function CitySearchBar({ selectedCity, onSelectCity }: CitySearchBarProps) {
  const [query, setQuery] = useState(selectedCity ? `${selectedCity.name}, ${selectedCity.country}` : '');
  const [results, setResults] = useState<CitySearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const skipNextFetchRef = useRef(false);
  const listboxId = useId();

  useEffect(() => {
    if (selectedCity) {
      skipNextFetchRef.current = true;
      setQuery(`${selectedCity.name}, ${selectedCity.country}`);
    }
  }, [selectedCity]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearchError(null);
      setIsOpen(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const cities = await searchCities(trimmed);
        if (!cancelled) {
          setResults(cities);
          setActiveIndex(cities.length > 0 ? 0 : -1);
          setIsOpen(true);
        }
      } catch (err) {
        if (!cancelled) {
          setResults([]);
          setSearchError(err instanceof Error ? err.message : 'Unable to search cities.');
          setIsOpen(true);
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const handleSelect = (city: CitySearchResult) => {
    skipNextFetchRef.current = true;
    setQuery(`${city.name}, ${city.country}`);
    setIsOpen(false);
    setActiveIndex(-1);
    onSelectCity(city);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setSearchError(null);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative flex items-center">
        <Search
          className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400 dark:text-slate-400"
          aria-hidden="true"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0 || searchError) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search any city..."
          aria-label="Search any city"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          className="w-full rounded-xl border border-[#E2E8E5] bg-white/90 py-2 pr-10 pl-10 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs transition-all focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none dark:border-white/10 dark:bg-[#151E29]/90 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
        {isSearching ? (
          <Loader2
            className="absolute right-3 h-4 w-4 animate-spin text-emerald-500"
            aria-label="Searching cities"
          />
        ) : query.length > 0 ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear city search"
            className="absolute right-2.5 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-slate-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-40 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-[#E2E8E5] bg-white/95 p-1.5 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-[#101720]/95"
        >
          {searchError ? (
            <li className="px-3 py-2 text-xs text-rose-600 dark:text-rose-400">
              {searchError}
            </li>
          ) : results.length === 0 ? (
            <li className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
              No matching cities found. Try another spelling.
            </li>
          ) : (
            results.map((city, index) => {
              const isActive = index === activeIndex;
              return (
                <li key={`${city.name}-${city.latitude}-${city.longitude}`} role="option" aria-selected={isActive}>
                  <button
                    type="button"
                    onClick={() => handleSelect(city)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
                      <span className="truncate font-medium">{city.name}</span>
                      {city.admin1 ? (
                        <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {city.admin1}
                        </span>
                      ) : null}
                    </span>
                    <span className="ml-2 shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">
                      {city.country}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
