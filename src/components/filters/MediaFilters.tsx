import React from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { SearchFilters } from '@/types';

interface MediaFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  genres?: Array<{ id: number; name: string }>;
}

const yearPeriods = [
  { value: 'all', label: 'All Years' },
  { value: '-80s', label: 'Before 1980s' },
  { value: '80s', label: '1980s' },
  { value: '90s', label: '1990s' },
  { value: '00s', label: '2000s' },
  { value: '10s', label: '2010s' },
  { value: '2020+', label: '2020+' },
];

const sortOptions = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'release_date.desc', label: 'Newest First' },
  { value: 'release_date.asc', label: 'Oldest First' },
];

export const MediaFilters: React.FC<MediaFiltersProps> = ({
  filters,
  onFiltersChange,
  genres = [],
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const activeFiltersCount = Object.values(filters).filter(
    (value) => value !== 'all' && value !== ''
  ).length;

  const resetFilters = () => {
    onFiltersChange({
      type: 'all',
      genre: 'all',
      year: 'all',
      sort_by: 'popularity.desc',
    });
  };

  const getActiveFilters = () => {
    const active = [];
    if (filters.type !== 'all') active.push({ key: 'type', label: filters.type });
    if (filters.genre !== 'all') {
      const genre = genres.find(g => g.id.toString() === filters.genre);
      if (genre) active.push({ key: 'genre', label: genre.name });
    }
    if (filters.year !== 'all') {
      const period = yearPeriods.find(p => p.value === filters.year);
      if (period) active.push({ key: 'year', label: period.label });
    }
    return active;
  };

  return (
    <div className="space-y-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 bg-white/95 dark:bg-slate-800/95 hover:bg-slate-50/95 dark:hover:bg-slate-700/95">
              <Filter className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </CollapsibleTrigger>

          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="bg-white/95 dark:bg-slate-800/95 hover:bg-slate-100/95 dark:hover:bg-slate-700/95">
              <X className="h-4 w-4 mr-1" />
              Clear all
            </Button>
          )}
        </div>

        <CollapsibleContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select
                value={filters.type}
                onValueChange={(value) => 
                  onFiltersChange({ ...filters, type: value as any })
                }
              >
                <SelectTrigger className="bg-white/95 dark:bg-slate-800/95">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="movie">Movies</SelectItem>
                  <SelectItem value="tv">TV Shows</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Genre</label>
              <Select
                value={filters.genre}
                onValueChange={(value) => 
                  onFiltersChange({ ...filters, genre: value })
                }
              >
                <SelectTrigger className="bg-white/95 dark:bg-slate-800/95">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  {genres.map((genre) => (
                    <SelectItem key={genre.id} value={genre.id.toString()}>
                      {genre.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Year</label>
              <Select
                value={filters.year}
                onValueChange={(value) => 
                  onFiltersChange({ ...filters, year: value })
                }
              >
                <SelectTrigger className="bg-white/95 dark:bg-slate-800/95">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearPeriods.map((period) => (
                    <SelectItem key={period.value} value={period.value}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Sort by</label>
              <Select
                value={filters.sort_by}
                onValueChange={(value) => 
                  onFiltersChange({ ...filters, sort_by: value })
                }
              >
                <SelectTrigger className="bg-white/95 dark:bg-slate-800/95">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {getActiveFilters().length > 0 && (
        <div className="flex flex-wrap gap-2">
          {getActiveFilters().map((filter) => (
            <Badge key={filter.key} variant="secondary" className="capitalize bg-slate-100/95 dark:bg-slate-800/95">
              {filter.label}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-2 hover:bg-slate-200/95 dark:hover:bg-slate-700/95"
                onClick={() => {
                  onFiltersChange({ 
                    ...filters, 
                    [filter.key]: filter.key === 'type' ? 'all' : 'all'
                  });
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};