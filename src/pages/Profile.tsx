import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Camera, Save } from 'lucide-react';
import { ThemeToggle } from '@/components/vision/ThemeToggle';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [profileData, setProfileData] = useState(() => {
    const saved = localStorage.getItem('vision-profile');
    if (saved) return JSON.parse(saved);
    return {
      name: '',
      bio: '',
      location: '',
      occupation: '',
      avatarUrl: '',
    };
  });

  const handleSave = () => {
    localStorage.setItem('vision-profile', JSON.stringify(profileData));
    toast({ title: 'Profile saved', description: 'Your details have been updated.' });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileData((prev: typeof profileData) => ({ ...prev, avatarUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const initials = profileData.name
    ? profileData.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.charAt(0).toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border/30">
        <div className="container flex items-center justify-between py-4">
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Board
          </Button>
          <ThemeToggle />
        </div>
      </div>

      <main className="container max-w-2xl py-12 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="font-serif text-4xl text-foreground">Your Profile</h1>
          <p className="text-muted-foreground font-sans">Personalize your vision board experience</p>
        </div>

        {/* Avatar Section */}
        <Card className="border-border/30">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <Avatar className="h-28 w-28 border-2 border-primary/30">
                  <AvatarImage src={profileData.avatarUrl} alt={profileData.name || 'Profile'} />
                  <AvatarFallback className="text-2xl font-serif bg-primary/20 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="avatar-upload"
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="h-6 w-6 text-foreground" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <p className="text-sm text-muted-foreground">Click to upload a photo</p>
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card className="border-border/30">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Personal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                placeholder="Your name"
                value={profileData.name}
                onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Occupation</Label>
              <Input
                placeholder="What do you do?"
                value={profileData.occupation}
                onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, occupation: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                placeholder="Where are you based?"
                value={profileData.location}
                onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, location: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea
                placeholder="Tell us about yourself and your vision..."
                value={profileData.bio}
                onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, bio: e.target.value }))}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled className="opacity-60" />
            </div>

            <Button onClick={handleSave} className="w-full gap-2 bg-primary hover:bg-primary/90">
              <Save className="h-4 w-4" />
              Save Profile
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Profile;
