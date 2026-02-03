import { useState } from 'react';
import { ContentType, Category, Theory, Wish } from '@/types/vision';
import { categoryLabels } from '@/data/initialData';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Quote, Star, Image, Video } from 'lucide-react';

interface AddContentDialogProps {
  onAddTheory: (theory: Omit<Theory, 'id'>) => void;
  onAddWish: (wish: Omit<Wish, 'id'>) => void;
}

type FormType = 'theory' | 'wish';

const categories: Category[] = ['career', 'health', 'travel', 'creativity', 'relationships', 'personal'];

export function AddContentDialog({ onAddTheory, onAddWish }: AddContentDialogProps) {
  const [open, setOpen] = useState(false);
  const [formType, setFormType] = useState<FormType>('theory');
  const [category, setCategory] = useState<Category>('personal');
  
  // Theory fields
  const [theoryTitle, setTheoryTitle] = useState('');
  const [theoryContent, setTheoryContent] = useState('');
  const [theoryAuthor, setTheoryAuthor] = useState('');
  
  // Wish fields
  const [wishTitle, setWishTitle] = useState('');
  const [wishDescription, setWishDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formType === 'theory') {
      if (!theoryTitle.trim() || !theoryContent.trim()) return;
      onAddTheory({
        title: theoryTitle.trim(),
        content: theoryContent.trim(),
        author: theoryAuthor.trim() || undefined,
        category,
      });
      setTheoryTitle('');
      setTheoryContent('');
      setTheoryAuthor('');
    } else {
      if (!wishTitle.trim()) return;
      onAddWish({
        title: wishTitle.trim(),
        description: wishDescription.trim() || undefined,
        category,
        completed: false,
        progress: 0,
      });
      setWishTitle('');
      setWishDescription('');
    }
    
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-gold hover:bg-gold/90 text-primary-foreground font-sans gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Plus className="h-4 w-4" />
          Add to Board
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-foreground">
            Add to Vision Board
          </DialogTitle>
        </DialogHeader>
        
        {/* Content type selector */}
        <div className="flex gap-2 py-4">
          <button
            onClick={() => setFormType('theory')}
            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-all duration-300 ${
              formType === 'theory'
                ? 'bg-gold/10 border-gold text-gold'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
            }`}
          >
            <Quote className="h-4 w-4" />
            <span className="font-sans text-sm">Theory</span>
          </button>
          <button
            onClick={() => setFormType('wish')}
            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-all duration-300 ${
              formType === 'wish'
                ? 'bg-gold/10 border-gold text-gold'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
            }`}
          >
            <Star className="h-4 w-4" />
            <span className="font-sans text-sm">Wish</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category selector */}
          <div className="space-y-2">
            <label className="text-sm font-sans text-muted-foreground">Category</label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {categoryLabels[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formType === 'theory' ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-sans text-muted-foreground">Title</label>
                <Input
                  value={theoryTitle}
                  onChange={(e) => setTheoryTitle(e.target.value)}
                  placeholder="The Compound Effect"
                  className="bg-secondary border-border"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-sans text-muted-foreground">Quote or Theory</label>
                <Textarea
                  value={theoryContent}
                  onChange={(e) => setTheoryContent(e.target.value)}
                  placeholder="Your philosophical insight or quote..."
                  className="bg-secondary border-border min-h-[100px] font-serif"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-sans text-muted-foreground">Author (optional)</label>
                <Input
                  value={theoryAuthor}
                  onChange={(e) => setTheoryAuthor(e.target.value)}
                  placeholder="Friedrich Nietzsche"
                  className="bg-secondary border-border"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-sans text-muted-foreground">Wish Title</label>
                <Input
                  value={wishTitle}
                  onChange={(e) => setWishTitle(e.target.value)}
                  placeholder="Run a marathon"
                  className="bg-secondary border-border"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-sans text-muted-foreground">Description (optional)</label>
                <Textarea
                  value={wishDescription}
                  onChange={(e) => setWishDescription(e.target.value)}
                  placeholder="Describe your dream in detail..."
                  className="bg-secondary border-border min-h-[80px]"
                />
              </div>
            </>
          )}

          <Button 
            type="submit" 
            className="w-full bg-gold hover:bg-gold/90 text-primary-foreground font-sans"
          >
            Add to Board
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
