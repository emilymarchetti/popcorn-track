import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Key, User, Trash2, Users, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/storage';
import { setTMDBApiKey, validateTMDBApiKey } from '@/lib/tmdb';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export const Settings: React.FC = () => {
  const { user, profiles, switchProfile, createProfile, deleteProfile } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [savedApiKey, setSavedApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const key = await storage.getTMDBApiKey();
        if (key) {
          setSavedApiKey(key);
          setApiKey(key);
          setTMDBApiKey(key);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, []);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter a valid API key');
      return;
    }
    
    setValidating(true);
    try {
      // Validate the API key first
      const isValid = await validateTMDBApiKey(apiKey.trim());
      if (!isValid) {
        toast.error('Invalid TMDB API key. Please check your key and try again.');
        return;
      }

      setLoading(true);
      await storage.setTMDBApiKey(apiKey.trim());
      setTMDBApiKey(apiKey.trim());
      setSavedApiKey(apiKey.trim());
      toast.success('TMDB API key saved and validated successfully!');
      
      // Trigger a refresh of the dashboard by dispatching a custom event
      window.dispatchEvent(new CustomEvent('apiKeyUpdated'));
    } catch (error) {
      console.error('Failed to save API key:', error);
      toast.error('Failed to save API key');
    } finally {
      setLoading(false);
      setValidating(false);
    }
  };

  const handleClearUserData = async () => {
    if (!user) return;
    
    if (confirm('Are you sure you want to clear all your data? This action cannot be undone.')) {
      try {
        await storage.clearUserData(user.id);
        toast.success('Your data has been cleared');
      } catch (error) {
        console.error('Failed to clear data:', error);
        toast.error('Failed to clear data');
      }
    }
  };

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      toast.error('Please enter a profile name');
      return;
    }

    setIsCreating(true);
    try {
      const newProfile = await createProfile(newProfileName.trim());
      setNewProfileName('');
      toast.success('Profile created successfully!');
      // Switch to the new profile
      await switchProfile(newProfile.id);
    } catch (error) {
      console.error('Failed to create profile:', error);
      toast.error('Failed to create profile');
    } finally {
      setIsCreating(false);
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

  const hasApiKeyChanged = apiKey.trim() !== savedApiKey;

  return (
    <div className="container px-4 py-8 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <SettingsIcon className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your profiles and application preferences
        </p>
      </motion.div>

      <div className="space-y-6">
        {/* Current Profile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Current Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={user?.avatar_url} alt={user?.name} />
                  <AvatarFallback>
                    <User className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{user?.name}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* TMDB API Key */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                TMDB API Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-blue-50/95 dark:bg-blue-900/30">
                <AlertDescription>
                  To use PopcornTrack, you need a free API key from The Movie Database (TMDB).{' '}
                  <a
                    href="https://www.themoviedb.org/settings/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 hover:underline"
                  >
                    Get your API key here
                  </a>
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="api-key">TMDB API Key (Global for all profiles)</Label>
                <div className="flex gap-2">
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="Enter your TMDB API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="bg-slate-50/95 dark:bg-slate-800/95"
                    disabled={loading || validating}
                  />
                  <Button 
                    onClick={handleSaveApiKey} 
                    disabled={loading || validating || !apiKey.trim() || !hasApiKeyChanged}
                    className="bg-red-600/95 hover:bg-red-700/95"
                  >
                    {validating ? 'Validating...' : loading ? 'Saving...' : 'Save'}
                  </Button>
                </div>
                {savedApiKey && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      API key configured and validated
                    </p>
                  </div>
                )}
                {!savedApiKey && apiKey.trim() && (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Click "Save" to validate and store your API key
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Profile Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Profile Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Create New Profile */}
              <div>
                <h4 className="font-medium mb-2">Create New Profile</h4>
                <div className="flex gap-2">
                  <Input
                    placeholder="Profile name"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateProfile();
                      }
                    }}
                    className="bg-slate-50/95 dark:bg-slate-800/95"
                    disabled={isCreating}
                  />
                  <Button
                    onClick={handleCreateProfile}
                    disabled={isCreating || !newProfileName.trim()}
                    className="bg-green-600/95 hover:bg-green-700/95"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {isCreating ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </div>

              {/* Existing Profiles */}
              <div>
                <h4 className="font-medium mb-3">All Profiles ({profiles.length})</h4>
                <div className="space-y-2">
                  {profiles.map((profile) => (
                    <div
                      key={profile.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-slate-50/95 dark:bg-slate-800/95"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile.avatar_url} alt={profile.name} />
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{profile.name}</p>
                      </div>
                      {profile.id === user?.id && (
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                          Current
                        </span>
                      )}
                      <div className="flex gap-2">
                        {profile.id !== user?.id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => switchProfile(profile.id)}
                            className="bg-white/95 dark:bg-slate-700/95"
                          >
                            Switch
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteProfile(profile.id)}
                          className="bg-red-600/95 hover:bg-red-700/95"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Data Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Clear Profile Data</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  This will permanently delete all watched movies, TV shows, and watchlist for the current profile.
                  This action cannot be undone.
                </p>
                <Button variant="destructive" onClick={handleClearUserData} className="bg-red-600/95 hover:bg-red-700/95">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Current Profile Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};