import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Users, Copy, Clock, Calendar, ChevronDown, CheckCircle2, CircleDashed } from 'lucide-react';
import { PreferencesForm } from '../components/PreferencesForm';
import { RecommendationList } from '../components/RecommendationList';

interface GroupMember {
  id: string;
  name: string;
  email: string;
  hasSubmittedPreferences: boolean;
}

interface GroupData {
  _id: string;
  name: string;
  inviteCode: string;
  members: {
    user: {
      _id: string;
      name: string;
      email: string;
    };
    hasSubmittedPreferences: boolean;
  }[];
}

interface Preference {
  cuisineTypes: string[];
  dietaryRestrictions: string[];
  spiceLevel: number;
  budget: string;
  location: string;
  dateTime: string;
}

interface Recommendation {
  id: string;
  name: string;
  imageUrl: string;
  url: string;
  rating: number;
  reviewCount: number;
  price: string;
  address: string;
  categories: string[];
  phone: string;
  distance: number;
  matchScore: number;
}

export const Group: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const [group, setGroup] = useState<GroupData | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [userPreference, setUserPreference] = useState<Preference | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
  const [aggregatedPreferences, setAggregatedPreferences] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  useEffect(() => {
    if (groupId) {
      fetchGroupData();
    }
  }, [groupId]);

  const fetchGroupData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch group data
      const groupResponse = await axios.get(`/api/groups/${groupId}`);
      setGroup(groupResponse.data.group);
      
      // Fetch members with their preference status
      const membersResponse = await axios.get(`/api/groups/${groupId}/members`);
      setMembers(membersResponse.data.members);
      
      // Fetch user preferences if they exist
      try {
        const preferencesResponse = await axios.get(`/api/groups/${groupId}/preferences`);
        setUserPreference(preferencesResponse.data.preference);
      } catch (error) {
        // User hasn't submitted preferences yet
        setUserPreference(null);
      }
    } catch (error) {
      console.error('Error fetching group data:', error);
      toast.error('Failed to load group data');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferenceSubmit = async (preferences: Preference) => {
    try {
      await axios.post(`/api/groups/${groupId}/preferences`, preferences);
      toast.success('Preferences saved successfully!');
      fetchGroupData(); // Refresh data
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    }
  };

  const generateRecommendations = async () => {
    try {
      setIsLoadingRecommendations(true);
      const response = await axios.post(`/api/yelp/recommend/${groupId}`);
      setRecommendations(response.data.recommendations);
      setAggregatedPreferences(response.data.preferences);
      toast.success('Recommendations generated!');
    } catch (error: any) {
      console.error('Error generating recommendations:', error);
      const errorMessage = error.response?.data?.message || 'Failed to generate recommendations';
      toast.error(errorMessage);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const copyInviteCode = () => {
    if (group?.inviteCode) {
      navigator.clipboard.writeText(group.inviteCode)
        .then(() => {
          toast.success('Invite code copied to clipboard!');
        })
        .catch((err) => {
          console.error('Failed to copy:', err);
          toast.error('Failed to copy invite code');
        });
    }
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-neutral-200 rounded w-1/4 mb-8"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="h-12 bg-neutral-200 rounded mb-4"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 bg-neutral-200 rounded"></div>
                ))}
              </div>
            </div>
            <div>
              <div className="h-12 bg-neutral-200 rounded mb-4"></div>
              <div className="h-64 bg-neutral-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      {group && (
        <>
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">
              {group.name}
            </h1>
            
            <div className="bg-neutral-100 inline-flex items-center px-3 py-1.5 rounded-md text-sm text-neutral-700">
              <span className="mr-2">Invite Code: {group.inviteCode}</span>
              <button 
                onClick={copyInviteCode}
                className="text-neutral-500 hover:text-neutral-700"
                title="Copy invite code"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main content area - preferences form or recommendations */}
            <div className="md:col-span-2 space-y-6">
              {recommendations ? (
                <RecommendationList 
                  recommendations={recommendations} 
                  preferences={aggregatedPreferences}
                  onBack={() => {
                    setRecommendations(null);
                    setAggregatedPreferences(null);
                  }}
                />
              ) : (
                <>
                  <div className="card">
                    <div className="card-body">
                      <h2 className="text-xl font-semibold mb-4">Your Food Preferences</h2>
                      <PreferencesForm 
                        initialValues={userPreference} 
                        onSubmit={handlePreferenceSubmit} 
                      />
                    </div>
                  </div>
                  
                  {userPreference && (
                    <div className="flex justify-center">
                      <button
                        onClick={generateRecommendations}
                        disabled={isLoadingRecommendations}
                        className={`btn-primary w-full max-w-md ${isLoadingRecommendations ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {isLoadingRecommendations ? 'Generating Recommendations...' : 'Show Restaurant Recommendations'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Sidebar - members list */}
            <div className="space-y-4">
              <div className="card">
                <div 
                  className="flex justify-between items-center p-4 cursor-pointer"
                  onClick={() => setShowMembers(!showMembers)}
                >
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-neutral-600 mr-2" />
                    <h3 className="font-semibold">Group Members ({members.length})</h3>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-neutral-600 transition-transform ${showMembers ? 'transform rotate-180' : ''}`} />
                </div>
                
                {showMembers && (
                  <div className="border-t border-neutral-200 p-4">
                    <div className="space-y-3">
                      {members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between">
                          <span className="text-sm">{member.name}</span>
                          {member.hasSubmittedPreferences ? (
                            <span className="flex items-center text-xs text-secondary">
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                              Submitted
                            </span>
                          ) : (
                            <span className="flex items-center text-xs text-neutral-500">
                              <CircleDashed className="h-3.5 w-3.5 mr-1" />
                              Pending
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {userPreference && (
                <div className="card">
                  <div className="card-body">
                    <h3 className="font-semibold mb-3">Your Selection</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start">
                        <Calendar className="h-4 w-4 text-neutral-500 mr-2 mt-0.5" />
                        <span>
                          {new Date(userPreference.dateTime).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short', 
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-start">
                        <Clock className="h-4 w-4 text-neutral-500 mr-2 mt-0.5" />
                        <span>
                          {new Date(userPreference.dateTime).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-neutral-100">
                        <p className="text-xs text-neutral-500 mb-1">Cuisine Types:</p>
                        <div className="flex flex-wrap gap-1">
                          {userPreference.cuisineTypes.length > 0 ? (
                            userPreference.cuisineTypes.map((cuisine, index) => (
                              <span key={index} className="bg-neutral-100 text-xs px-2 py-0.5 rounded">
                                {cuisine}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-neutral-500">No preferences selected</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};