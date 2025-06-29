import React, { useState } from 'react';
import { User, Film, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export const ProfileCreation: React.FC = () => {
  const { createProfile } = useAuth();
  const [profileName, setProfileName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');

  const generateAvatarUrl = (name: string) => {
    const colors = ['dc2626', '059669', '7c3aed', 'ea580c', '0891b2', 'be185d', '4338ca'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${randomColor}&color=fff&size=128`;
  };

  const handleCreateProfile = async () => {
    if (!profileName.trim()) {
      toast.error('Please enter a profile name');
      return;
    }

    setIsCreating(true);
    try {
      await createProfile(profileName.trim());
      toast.success('Profile created successfully! Welcome to PopcornTrack!');
    } catch (error) {
      console.error('Failed to create profile:', error);
      toast.error('Failed to create profile');
    } finally {
      setIsCreating(false);
    }
  };

  React.useEffect(() => {
    if (profileName.trim()) {
      setAvatarUrl(generateAvatarUrl(profileName));
    }
  }, [profileName]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-0 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="p-4 bg-red-50 dark:bg-red-900/30 rounded-full"
              >
                <Film className="h-12 w-12 text-red-600" />
              </motion.div>
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-red-600 to-yellow-500 bg-clip-text text-transparent">
              Welcome to PopcornTrack
            </CardTitle>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Create your profile to start tracking movies and TV shows
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Avatar Preview */}
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-20 w-20 ring-4 ring-red-100 dark:ring-red-900/30">
                <AvatarImage src={avatarUrl} alt={profileName} />
                <AvatarFallback className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              {profileName && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-slate-600 dark:text-slate-400"
                >
                  Your avatar will be generated automatically
                </motion.p>
              )}
            </div>

            {/* Profile Name Input */}
            <div className="space-y-2">
              <Label htmlFor="profile-name" className="text-slate-900 dark:text-slate-100 font-semibold">
                Profile Name
              </Label>
              <Input
                id="profile-name"
                placeholder="Enter your name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateProfile();
                  }
                }}
                className="bg-slate-50/95 dark:bg-slate-800/95 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 h-12"
                disabled={isCreating}
                autoFocus
              />
            </div>

            {/* Create Button */}
            <Button
              onClick={handleCreateProfile}
              disabled={isCreating || !profileName.trim()}
              className="w-full h-12 bg-red-600/95 hover:bg-red-700/95 text-white font-semibold"
              size="lg"
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Profile...
                </div>
              ) : (
                <>
                  <Plus className="h-5 w-5 mr-2" />
                  Create Profile
                </>
              )}
            </Button>

            {/* Info */}
            <div className="text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You can create multiple profiles and switch between them later
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};