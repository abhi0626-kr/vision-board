import { useState } from 'react';
import { Wish, Category } from '@/types/vision';
import { categoryLabels } from '@/data/initialData';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2 } from 'lucide-react';

interface EditWishDialogProps {
  wish: Wish | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (wish: Wish) => void;
  onDelete: (id: string) => void;
}

const categories: Category[] = ['career', 'health', 'travel', 'creativity', 'relationships', 'personal'];

export function EditWishDialog({ wish, open, onOpenChange, onSave, onDelete }: EditWishDialogProps) {
  const [title, setTitle] = useState(wish?.title || '');
  const [description, setDescription] = useState(wish?.description || '');
  const [category, setCategory] = useState<Category>(wish?.category || 'personal');
  const [progress, setProgress] = useState(wish?.progress || 0);

  // Reset form when wish changes
  useState(() => {
    if (wish) {
      setTitle(wish.title);
      setDescription(wish.description || '');
      setCategory(wish.category);
      setProgress(wish.progress || 0);
    }
  });

  const handleSave = () => {
    if (!wish || !title.trim()) return;
    onSave({
      ...wish,
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      progress,
      completed: progress === 100,
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!wish) return;
    onDelete(wish.id);
    onOpenChange(false);
  };

  if (!wish) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-foreground">
            Edit Wish
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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

          <div className="space-y-2">
            <label className="text-sm font-sans text-muted-foreground">Wish Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-sans text-muted-foreground">Description (optional)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-secondary border-border min-h-[80px]"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <label className="text-sm font-sans text-muted-foreground">Progress</label>
              <span className="text-sm text-gold">{progress}%</span>
            </div>
            <Slider
              value={[progress]}
              onValueChange={([v]) => setProgress(v)}
              max={100}
              step={5}
              className="py-2"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-gold hover:bg-gold/90 text-primary-foreground"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
