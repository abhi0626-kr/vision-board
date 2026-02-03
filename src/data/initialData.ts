import { VisionImage, VisionVideo, Theory, Wish } from '@/types/vision';
import visionTravel from '@/assets/vision-travel.jpg';
import visionCareer from '@/assets/vision-career.jpg';
import visionHealth from '@/assets/vision-health.jpg';

export const initialImages: VisionImage[] = [
  {
    id: '1',
    src: visionTravel,
    alt: 'Mountain summit at golden hour',
    category: 'travel',
  },
  {
    id: '2',
    src: visionCareer,
    alt: 'Minimalist workspace sanctuary',
    category: 'career',
  },
  {
    id: '3',
    src: visionHealth,
    alt: 'Morning meditation practice',
    category: 'health',
  },
];

export const initialVideos: VisionVideo[] = [
  {
    id: '1',
    url: 'https://www.youtube.com/embed/LXb3EKWsInQ',
    title: 'Morning Motivation',
    category: 'personal',
  },
];

export const initialTheories: Theory[] = [
  {
    id: '1',
    title: 'The Compound Effect',
    content: 'Small, seemingly insignificant steps completed consistently over time will create a radical difference.',
    author: 'Darren Hardy',
    category: 'personal',
  },
  {
    id: '2',
    title: 'Amor Fati',
    content: 'Love your fate. Not merely bear what is necessary, but love it.',
    author: 'Friedrich Nietzsche',
    category: 'personal',
  },
  {
    id: '3',
    title: 'The Map Is Not The Territory',
    content: 'Our perception of reality is not reality itself but our own version of it, or our "map".',
    author: 'Alfred Korzybski',
    category: 'creativity',
  },
];

export const initialWishes: Wish[] = [
  {
    id: '1',
    title: 'Run a marathon',
    description: 'Complete a full 42km marathon',
    category: 'health',
    completed: false,
    progress: 35,
  },
  {
    id: '2',
    title: 'Learn a new language',
    description: 'Become conversational in Japanese',
    category: 'personal',
    completed: false,
    progress: 20,
  },
  {
    id: '3',
    title: 'Visit Japan',
    description: 'Experience the culture and beauty of Japan',
    category: 'travel',
    completed: false,
    progress: 10,
  },
  {
    id: '4',
    title: 'Build a side project',
    description: 'Launch a profitable side business',
    category: 'career',
    completed: true,
    progress: 100,
  },
];

export const categoryLabels: Record<string, string> = {
  career: 'Career',
  health: 'Health',
  travel: 'Travel',
  creativity: 'Creativity',
  relationships: 'Relationships',
  personal: 'Personal Growth',
};

export const categoryColors: Record<string, string> = {
  career: 'bg-sage',
  health: 'bg-rose-dust',
  travel: 'bg-gold',
  creativity: 'bg-accent',
  relationships: 'bg-primary',
  personal: 'bg-gold-muted',
};
