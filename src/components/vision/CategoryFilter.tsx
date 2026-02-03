import { Category } from '@/types/vision';
import { categoryLabels } from '@/data/initialData';
import { cn } from '@/lib/utils';

interface CategoryFilterProps {
  selected: Category | 'all';
  onChange: (category: Category | 'all') => void;
}

const categories: (Category | 'all')[] = ['all', 'career', 'health', 'travel', 'creativity', 'relationships', 'personal'];

export function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onChange(category)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-sans transition-all duration-300",
            selected === category
              ? "bg-gold text-primary-foreground shadow-lg"
              : "bg-card text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/50"
          )}
        >
          {category === 'all' ? 'All' : categoryLabels[category]}
        </button>
      ))}
    </div>
  );
}
