import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@/types';
import { storage } from '@/lib/storage';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  switchProfile: (profileId: string) => Promise<void>;
  profiles: User[];
  createProfile: (name: string) => Promise<User>;
  deleteProfile: (profileId: string) => Promise<void>;
  updateProfile: (profileId: string, updates: Partial<User>) => Promise<void>;
  needsProfileCreation: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [needsProfileCreation, setNeedsProfileCreation] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Initialize database first
        await storage.init();
        
        // Load profiles from storage
        const savedProfiles = await storage.getAllProfiles();
        setProfiles(savedProfiles);
        
        if (savedProfiles.length === 0) {
          // No profiles exist, need to create one
          setNeedsProfileCreation(true);
        } else {
          // Get current active profile
          const activeProfileId = localStorage.getItem('active_profile_id');
          if (activeProfileId) {
            const activeProfile = savedProfiles.find(p => p.id === activeProfileId);
            if (activeProfile) {
              setUser(activeProfile);
            } else {
              // Active profile not found, use first one
              setUser(savedProfiles[0]);
              localStorage.setItem('active_profile_id', savedProfiles[0].id);
            }
          } else {
            // No active profile set, use first one
            setUser(savedProfiles[0]);
            localStorage.setItem('active_profile_id', savedProfiles[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const switchProfile = async (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      setUser(profile);
      localStorage.setItem('active_profile_id', profileId);
    }
  };

  const createProfile = async (name: string): Promise<User> => {
    const newProfile: User = {
      id: `profile_${Date.now()}`,
      login: name.toLowerCase().replace(/\s+/g, '_'),
      avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${Math.floor(Math.random()*16777215).toString(16)}&color=fff&size=128`,
      name: name,
    };
    
    await storage.setUser(newProfile);
    const updatedProfiles = [...profiles, newProfile];
    setProfiles(updatedProfiles);
    
    // If this is the first profile, set it as active and clear the creation flag
    if (profiles.length === 0) {
      setUser(newProfile);
      localStorage.setItem('active_profile_id', newProfile.id);
      setNeedsProfileCreation(false);
    }
    
    return newProfile;
  };

  const updateProfile = async (profileId: string, updates: Partial<User>) => {
    const profileIndex = profiles.findIndex(p => p.id === profileId);
    if (profileIndex === -1) {
      throw new Error('Profile not found');
    }

    const updatedProfile = { ...profiles[profileIndex], ...updates };
    
    // Update login based on name if name is being updated
    if (updates.name) {
      updatedProfile.login = updates.name.toLowerCase().replace(/\s+/g, '_');
    }

    await storage.setUser(updatedProfile);
    
    const updatedProfiles = [...profiles];
    updatedProfiles[profileIndex] = updatedProfile;
    setProfiles(updatedProfiles);

    // Update current user if it's the same profile
    if (user?.id === profileId) {
      setUser(updatedProfile);
    }
  };

  const deleteProfile = async (profileId: string) => {
    if (profiles.length <= 1) {
      // If deleting the last profile, clear everything and require profile creation
      await storage.deleteUser(profileId);
      setProfiles([]);
      setUser(null);
      setNeedsProfileCreation(true);
      localStorage.removeItem('active_profile_id');
      return;
    }
    
    await storage.deleteUser(profileId);
    const updatedProfiles = profiles.filter(p => p.id !== profileId);
    setProfiles(updatedProfiles);
    
    // If we're deleting the current user, switch to another profile
    if (user?.id === profileId) {
      const newActiveProfile = updatedProfiles[0];
      setUser(newActiveProfile);
      localStorage.setItem('active_profile_id', newActiveProfile.id);
    }
  };

  const value = {
    user,
    isLoading,
    switchProfile,
    profiles,
    createProfile,
    deleteProfile,
    updateProfile,
    needsProfileCreation,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};