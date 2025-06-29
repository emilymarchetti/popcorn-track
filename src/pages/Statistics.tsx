import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Calendar, Star, Film, Tv, Clock, Target, Award, Zap, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  RadialBarChart,
  RadialBar,
  Legend
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/storage';
import { motion } from 'framer-motion';
import type { WatchedMovie, WatchedShow } from '@/types';

export const Statistics: React.FC = () => {
  const { user } = useAuth();
  const [watchedMovies, setWatchedMovies] = useState<WatchedMovie[]>([]);
  const [watchedShows, setWatchedShows] = useState<WatchedShow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWatchedData = async () => {
      if (user) {
        try {
          setLoading(true);
          const [moviesData, showsData] = await Promise.all([
            storage.getWatchedMovies(user.id),
            storage.getWatchedShows(user.id)
          ]);
          setWatchedMovies(moviesData);
          setWatchedShows(showsData);
        } catch (error) {
          console.error('Failed to load statistics data:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadWatchedData();
  }, [user]);

  const totalWatched = watchedMovies.length + watchedShows.length;
  const ratedItems = [...watchedMovies, ...watchedShows].filter(item => item.rating > 0);
  const averageRating = ratedItems.length > 0 
    ? ratedItems.reduce((sum, item) => sum + item.rating, 0) / ratedItems.length
    : 0;

  // Monthly stats for the last 12 months
  const getMonthlyStats = () => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (11 - i));
      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        fullMonth: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        movies: 0,
        shows: 0,
        total: 0,
      };
    });

    watchedMovies.forEach(movie => {
      const date = new Date(movie.watched_date);
      const monthIndex = months.findIndex(m => {
        const monthDate = new Date();
        monthDate.setMonth(new Date().getMonth() - (11 - months.indexOf(m)));
        return date.getMonth() === monthDate.getMonth() && 
               date.getFullYear() === monthDate.getFullYear();
      });
      if (monthIndex !== -1) {
        months[monthIndex].movies++;
        months[monthIndex].total++;
      }
    });

    watchedShows.forEach(show => {
      const date = new Date(show.updated_date);
      const monthIndex = months.findIndex(m => {
        const monthDate = new Date();
        monthDate.setMonth(new Date().getMonth() - (11 - months.indexOf(m)));
        return date.getMonth() === monthDate.getMonth() && 
               date.getFullYear() === monthDate.getFullYear();
      });
      if (monthIndex !== -1) {
        months[monthIndex].shows++;
        months[monthIndex].total++;
      }
    });

    return months;
  };

  // Genre analysis
  const getGenreStats = () => {
    const genreCount: { [key: string]: { movies: number; shows: number; total: number } } = {};
    
    watchedMovies.forEach(movie => {
      movie.movie.genres?.forEach(genre => {
        if (!genreCount[genre.name]) {
          genreCount[genre.name] = { movies: 0, shows: 0, total: 0 };
        }
        genreCount[genre.name].movies++;
        genreCount[genre.name].total++;
      });
    });

    watchedShows.forEach(show => {
      show.show.genres?.forEach(genre => {
        if (!genreCount[genre.name]) {
          genreCount[genre.name] = { movies: 0, shows: 0, total: 0 };
        }
        genreCount[genre.name].shows++;
        genreCount[genre.name].total++;
      });
    });

    return Object.entries(genreCount)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  };

  // Rating distribution
  const getRatingDistribution = () => {
    const distribution = [
      { rating: '1 Star', value: 0, count: 0 },
      { rating: '2 Stars', value: 0, count: 0 },
      { rating: '3 Stars', value: 0, count: 0 },
      { rating: '4 Stars', value: 0, count: 0 },
      { rating: '5 Stars', value: 0, count: 0 },
    ];
    
    ratedItems.forEach(item => {
      if (item.rating > 0 && item.rating <= 5) {
        distribution[item.rating - 1].count++;
      }
    });

    const total = distribution.reduce((sum, item) => sum + item.count, 0);
    distribution.forEach(item => {
      item.value = total > 0 ? (item.count / total) * 100 : 0;
    });

    return distribution;
  };

  // Yearly comparison
  const getYearlyComparison = () => {
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 2, currentYear - 1, currentYear];
    
    return years.map(year => {
      const yearMovies = watchedMovies.filter(m => 
        new Date(m.watched_date).getFullYear() === year
      ).length;
      
      const yearShows = watchedShows.filter(s => 
        new Date(s.updated_date).getFullYear() === year
      ).length;

      return {
        year: year.toString(),
        movies: yearMovies,
        shows: yearShows,
        total: yearMovies + yearShows
      };
    });
  };

  // Content type distribution for pie chart
  const getContentTypeData = () => {
    return [
      { name: 'Movies', value: watchedMovies.length, color: '#dc2626' },
      { name: 'TV Shows', value: watchedShows.length, color: '#059669' }
    ];
  };

  const monthlyStats = getMonthlyStats();
  const genreStats = getGenreStats();
  const ratingDistribution = getRatingDistribution();
  const yearlyComparison = getYearlyComparison();
  const contentTypeData = getContentTypeData();

  // Calculate streaks and achievements
  const getCurrentStreak = () => {
    const allItems = [...watchedMovies, ...watchedShows]
      .sort((a, b) => new Date(b.watched_date || b.updated_date).getTime() - 
                     new Date(a.watched_date || a.updated_date).getTime());
    
    let streak = 0;
    let currentDate = new Date();
    
    for (const item of allItems) {
      const itemDate = new Date(item.watched_date || item.updated_date);
      const daysDiff = Math.floor((currentDate.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= streak + 7) { // Allow up to 7 days gap
        streak++;
        currentDate = itemDate;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const stats = [
    {
      title: 'Total Watched',
      value: totalWatched,
      icon: Target,
      color: 'text-blue-600',
      description: 'Movies and TV shows',
      trend: '+12% this month'
    },
    {
      title: 'Movies',
      value: watchedMovies.length,
      icon: Film,
      color: 'text-purple-600',
      description: 'Feature films watched',
      trend: `${Math.round((watchedMovies.length / totalWatched) * 100)}% of total`
    },
    {
      title: 'TV Shows',
      value: watchedShows.length,
      icon: Tv,
      color: 'text-green-600',
      description: 'Series followed',
      trend: `${Math.round((watchedShows.length / totalWatched) * 100)}% of total`
    },
    {
      title: 'Average Rating',
      value: averageRating.toFixed(1),
      icon: Star,
      color: 'text-yellow-600',
      description: 'Your average score',
      trend: `${ratedItems.length} items rated`
    },
  ];

  const achievements = [
    {
      title: 'Current Streak',
      value: getCurrentStreak(),
      icon: Zap,
      color: 'text-orange-600',
      description: 'Days watching',
    },
    {
      title: 'This Month',
      value: monthlyStats[monthlyStats.length - 1]?.total || 0,
      icon: Calendar,
      color: 'text-indigo-600',
      description: 'Items watched',
    },
    {
      title: 'Top Genre',
      value: genreStats[0]?.name || 'None',
      icon: Award,
      color: 'text-pink-600',
      description: `${genreStats[0]?.total || 0} items`,
    },
    {
      title: 'Activity Score',
      value: Math.min(100, Math.round((totalWatched / 50) * 100)),
      icon: Activity,
      color: 'text-cyan-600',
      description: 'Based on total watched',
    },
  ];

  const COLORS = ['#dc2626', '#059669', '#7c3aed', '#ea580c', '#0891b2', '#be185d', '#4338ca', '#65a30d'];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-muted rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          Statistics
        </h1>
        <p className="text-muted-foreground">
          Comprehensive insights into your watching habits and preferences
        </p>
      </motion.div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <p className="text-xs text-muted-foreground mb-1">
                  {stat.description}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                  {stat.trend}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Achievements */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {achievements.map((achievement, index) => (
          <motion.div
            key={achievement.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
          >
            <Card className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm`}>
                    <achievement.icon className={`h-5 w-5 ${achievement.color}`} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{achievement.value}</div>
                    <p className="text-sm font-medium">{achievement.title}</p>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="activity" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white/95 dark:bg-slate-800/95 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
          <TabsTrigger value="activity" className="data-[state=active]:bg-red-50/95 dark:data-[state=active]:bg-red-900/30 data-[state=active]:text-red-700 dark:data-[state=active]:text-red-400">
            Activity
          </TabsTrigger>
          <TabsTrigger value="genres" className="data-[state=active]:bg-red-50/95 dark:data-[state=active]:bg-red-900/30 data-[state=active]:text-red-700 dark:data-[state=active]:text-red-400">
            Genres
          </TabsTrigger>
          <TabsTrigger value="ratings" className="data-[state=active]:bg-red-50/95 dark:data-[state=active]:bg-red-900/30 data-[state=active]:text-red-700 dark:data-[state=active]:text-red-400">
            Ratings
          </TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-red-50/95 dark:data-[state=active]:bg-red-900/30 data-[state=active]:text-red-700 dark:data-[state=active]:text-red-400">
            Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-6">
          {/* Monthly Activity Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Monthly Activity (Last 12 Months)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="month" 
                        stroke="#64748b"
                        fontSize={12}
                      />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        labelFormatter={(label, payload) => {
                          const data = payload?.[0]?.payload;
                          return data?.fullMonth || label;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="movies"
                        stackId="1"
                        stroke="#dc2626"
                        fill="#dc2626"
                        fillOpacity={0.8}
                        name="Movies"
                      />
                      <Area
                        type="monotone"
                        dataKey="shows"
                        stackId="1"
                        stroke="#059669"
                        fill="#059669"
                        fillOpacity={0.8}
                        name="TV Shows"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Content Type Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Content Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={contentTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {contentTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="genres" className="space-y-6">
          {/* Top Genres Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Genres
                </CardTitle>
              </CardHeader>
              <CardContent>
                {genreStats.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Film className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No genre data available</p>
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={genreStats} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis type="number" stroke="#64748b" fontSize={12} />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          stroke="#64748b" 
                          fontSize={12}
                          width={80}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: 'none',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Bar dataKey="movies" fill="#dc2626" name="Movies" />
                        <Bar dataKey="shows" fill="#059669" name="TV Shows" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="ratings" className="space-y-6">
          {/* Rating Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Rating Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart 
                      cx="50%" 
                      cy="50%" 
                      innerRadius="20%" 
                      outerRadius="80%" 
                      data={ratingDistribution}
                    >
                      <RadialBar
                        dataKey="value"
                        cornerRadius={10}
                        fill="#fbbf24"
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value, name) => [`${value.toFixed(1)}%`, 'Percentage']}
                      />
                      <Legend />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Rating Summary */}
                <div className="mt-6 grid grid-cols-5 gap-4">
                  {ratingDistribution.map((rating, index) => (
                    <div key={rating.rating} className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        {Array.from({ length: index + 1 }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <div className="text-2xl font-bold">{rating.count}</div>
                      <div className="text-xs text-muted-foreground">
                        {rating.value.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>

                {totalWatched > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Average Rating</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {Array.from({ length: Math.floor(averageRating) }).map((_, i) => (
                            <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                          ))}
                          {averageRating % 1 >= 0.5 && (
                            <Star className="h-4 w-4 text-yellow-400 fill-current opacity-50" />
                          )}
                        </div>
                        <span className="font-bold text-lg">{averageRating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {/* Yearly Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Yearly Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={yearlyComparison}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="year" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="movies"
                        stroke="#dc2626"
                        strokeWidth={3}
                        dot={{ fill: '#dc2626', strokeWidth: 2, r: 6 }}
                        name="Movies"
                      />
                      <Line
                        type="monotone"
                        dataKey="shows"
                        stroke="#059669"
                        strokeWidth={3}
                        dot={{ fill: '#059669', strokeWidth: 2, r: 6 }}
                        name="TV Shows"
                      />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#7c3aed"
                        strokeWidth={3}
                        dot={{ fill: '#7c3aed', strokeWidth: 2, r: 6 }}
                        name="Total"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Watching Patterns */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Watching Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {Math.round(totalWatched / 12)}
                    </div>
                    <div className="text-sm font-medium">Items per Month</div>
                    <div className="text-xs text-muted-foreground">Average rate</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {getCurrentStreak()}
                    </div>
                    <div className="text-sm font-medium">Current Streak</div>
                    <div className="text-xs text-muted-foreground">Days active</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {Math.round((ratedItems.length / totalWatched) * 100)}%
                    </div>
                    <div className="text-sm font-medium">Rating Rate</div>
                    <div className="text-xs text-muted-foreground">Items rated</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};