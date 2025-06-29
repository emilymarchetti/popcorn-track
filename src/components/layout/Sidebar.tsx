import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Search, 
  Bookmark, 
  BarChart3, 
  Settings, 
  Film,
  User,
  Users,
  Plus,
  Check,
  Trash2,
  Edit,
  Camera,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/storage';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import type { WatchedShow } from '@/types';

export const Sidebar: React.FC = () => {
  const { user, profiles, switchProfile, createProfile, deleteProfile, updateProfile } = useAuth();
  const location = useLocation();
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [editProfileName, setEditProfileName] = useState('');
  const [editProfileAvatar, setEditProfileAvatar] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentlyWatching, setCurrentlyWatching] = useState<WatchedShow[]>([]);

  React.useEffect(() => {
    const loadCurrentlyWatching = async () => {
      if (user) {
        try {
          const shows = await storage.getWatchedShows(user.id);
          const watching = shows.filter(show => show.status === 'watching').slice(0, 3);
          setCurrentlyWatching(watching);
        } catch (error) {
          console.error('Failed to load currently watching:', error);
        }
      }
    };

    loadCurrentlyWatching();
  }, [user]);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Discover', href: '/search', icon: Search },
    { name: 'Watchlist', href: '/watchlist', icon: Bookmark },
    { name: 'Statistics', href: '/statistics', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (href: string) => location.pathname === href;

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      toast.error('Please enter a profile name');
      return;
    }

    setIsCreating(true);
    try {
      await createProfile(newProfileName.trim());
      setNewProfileName('');
      setShowCreateProfile(false);
      toast.success('Profile created successfully!');
    } catch (error) {
      console.error('Failed to create profile:', error);
      toast.error('Failed to create profile');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditProfile = async () => {
    if (!editProfileName.trim()) {
      toast.error('Please enter a profile name');
      return;
    }

    setIsEditing(true);
    try {
      await updateProfile(user!.id, {
        name: editProfileName.trim(),
        avatar_url: editProfileAvatar || user!.avatar_url
      });
      setShowEditProfile(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsEditing(false);
    }
  };

  const openEditProfile = () => {
    if (user) {
      setEditProfileName(user.name);
      setEditProfileAvatar(user.avatar_url);
      setShowEditProfile(true);
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (profiles.length <= 1) {
      if (confirm('Are you sure you want to delete this profile? This will delete ALL data and you will need to create a new profile. This action cannot be undone.')) {
        if (confirm('This is your FINAL warning! All movies, TV shows, watchlist, and settings will be permanently deleted. Are you absolutely sure?')) {
          try {
            await deleteProfile(profileId);
            toast.success('Profile deleted. Please create a new profile to continue.');
          } catch (error) {
            console.error('Failed to delete profile:', error);
            toast.error('Failed to delete profile');
          }
        }
      }
      return;
    }

    if (confirm('Are you sure you want to delete this profile? All data will be lost.')) {
      try {
        await deleteProfile(profileId);
        toast.success('Profile deleted successfully');
      } catch (error) {
        console.error('Failed to delete profile:', error);
        toast.error('Failed to delete profile');
      }
    }
  };

  const generateAvatarUrl = (name: string) => {
    const colors = ['dc2626', '059669', '7c3aed', 'ea580c', '0891b2', 'be185d', '4338ca'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${randomColor}&color=fff&size=128`;
  };

  if (!user) return null;

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="fixed left-0 top-0 z-40 h-screen w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200 dark:border-slate-700"
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 px-6 border-b border-slate-200 dark:border-slate-700">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            <Film className="h-8 w-8 text-red-600" />
          </motion.div>
          <span className="text-xl font-bold bg-gradient-to-r from-red-600 to-yellow-500 bg-clip-text text-transparent">
            PopcornTrack
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 p-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-slate-100/90 dark:hover:bg-slate-800/90 ${
                  isActive(item.href)
                    ? 'bg-red-50/95 dark:bg-red-900/30 text-red-600 dark:text-red-400 shadow-sm'
                    : 'text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Currently Watching Section */}
        {currentlyWatching.length > 0 && (
          <div className="px-4 pb-4">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                <Play className="h-4 w-4 text-green-600" />
                Currently Watching
              </h3>
              <div className="space-y-2">
                {currentlyWatching.map((show) => (
                  <div key={show.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50/95 dark:bg-slate-800/95 hover:bg-slate-100/95 dark:hover:bg-slate-700/95 transition-colors">
                    <div className="w-8 h-10 bg-muted rounded overflow-hidden shrink-0">
                      <img
                        src={`https://image.tmdb.org/t/p/w200${show.show.poster_path}`}
                        alt={show.show.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                        {show.show.name}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                        <span>{show.watched_episodes.length} eps</span>
                        {show.rating > 0 && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-0.5">
                              <span>⭐</span>
                              <span>{show.rating}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Separator className="bg-slate-200/50 dark:bg-slate-700/50" />
          </div>
        )}

        {/* Profile Switcher */}
        <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="mb-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start p-2 h-auto hover:bg-white/80 dark:hover:bg-slate-700/80 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 w-full">
                    <Avatar className="h-10 w-10 ring-2 ring-white/50 dark:ring-slate-600/50">
                      <AvatarImage src={user.avatar_url} alt={user.name} />
                      <AvatarFallback className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {user.name}
                      </p>
                    </div>
                    <Users className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50">
                <DropdownMenuLabel className="text-slate-900 dark:text-slate-100 font-bold">Profile Options</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-200/50 dark:bg-slate-700/50" />
                
                {/* Edit Current Profile */}
                <DropdownMenuItem
                  onClick={openEditProfile}
                  className="flex items-center gap-3 p-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/80 focus:bg-slate-50/80 dark:focus:bg-slate-800/80"
                >
                  <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-slate-900 dark:text-slate-100 font-semibold">Edit Profile</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="bg-slate-200/50 dark:bg-slate-700/50" />
                <DropdownMenuLabel className="text-slate-900 dark:text-slate-100 font-bold">Switch Profile</DropdownMenuLabel>
                
                {profiles.map((profile) => (
                  <DropdownMenuItem
                    key={profile.id}
                    onClick={() => switchProfile(profile.id)}
                    className="flex items-center gap-3 p-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/80 focus:bg-slate-50/80 dark:focus:bg-slate-800/80"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile.avatar_url} alt={profile.name} />
                      <AvatarFallback className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{profile.name}</p>
                    </div>
                    {profile.id === user.id && (
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                    )}
                    {profiles.length > 1 && profile.id !== user.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProfile(profile.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                    {profiles.length === 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProfile(profile.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-slate-200/50 dark:bg-slate-700/50" />
                <Dialog open={showCreateProfile} onOpenChange={setShowCreateProfile}>
                  <DialogTrigger asChild>
                    <DropdownMenuItem 
                      onSelect={(e) => e.preventDefault()}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/80 focus:bg-slate-50/80 dark:focus:bg-slate-800/80"
                    >
                      <Plus className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                      <span className="text-slate-900 dark:text-slate-100 font-semibold">Add Profile</span>
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DialogContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50">
                    <DialogHeader>
                      <DialogTitle className="text-slate-900 dark:text-slate-100">Create New Profile</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="profile-name" className="text-slate-900 dark:text-slate-100 font-semibold">Profile Name</Label>
                        <Input
                          id="profile-name"
                          placeholder="Enter profile name"
                          value={newProfileName}
                          onChange={(e) => setNewProfileName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleCreateProfile();
                            }
                          }}
                          className="bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowCreateProfile(false)}
                          disabled={isCreating}
                          className="bg-white/80 dark:bg-slate-800/80 hover:bg-slate-50/80 dark:hover:bg-slate-700/80 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCreateProfile}
                          disabled={isCreating || !newProfileName.trim()}
                          className="bg-red-600/95 hover:bg-red-700/95 text-white"
                        >
                          {isCreating ? 'Creating...' : 'Create Profile'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-slate-900 dark:text-slate-100 font-bold">
              {profiles.length} profile{profiles.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>

        {/* Edit Profile Dialog */}
        <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
          <DialogContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50">
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Edit Profile
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-20 w-20 ring-2 ring-slate-200 dark:ring-slate-700">
                  <AvatarImage src={editProfileAvatar} alt={editProfileName} />
                  <AvatarFallback className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                    <User className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditProfileAvatar(generateAvatarUrl(editProfileName))}
                  className="bg-white/80 dark:bg-slate-800/80 hover:bg-slate-50/80 dark:hover:bg-slate-700/80 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Generate New Avatar
                </Button>
              </div>

              {/* Name Section */}
              <div>
                <Label htmlFor="edit-profile-name" className="text-slate-900 dark:text-slate-100 font-semibold">Profile Name</Label>
                <Input
                  id="edit-profile-name"
                  placeholder="Enter profile name"
                  value={editProfileName}
                  onChange={(e) => setEditProfileName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleEditProfile();
                    }
                  }}
                  className="bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Custom Avatar URL */}
              <div>
                <Label htmlFor="edit-avatar-url" className="text-slate-900 dark:text-slate-100 font-semibold">Avatar URL (optional)</Label>
                <Input
                  id="edit-avatar-url"
                  placeholder="Enter custom avatar URL"
                  value={editProfileAvatar}
                  onChange={(e) => setEditProfileAvatar(e.target.value)}
                  className="bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowEditProfile(false)}
                  disabled={isEditing}
                  className="bg-white/80 dark:bg-slate-800/80 hover:bg-slate-50/80 dark:hover:bg-slate-700/80 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEditProfile}
                  disabled={isEditing || !editProfileName.trim()}
                  className="bg-red-600/95 hover:bg-red-700/95 text-white"
                >
                  {isEditing ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </motion.aside>
  );
};