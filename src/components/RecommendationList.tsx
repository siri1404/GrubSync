import React from 'react';
import { Star, ArrowLeft, ExternalLink } from 'lucide-react';

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

interface RecommendationListProps {
  recommendations: Recommendation[];
  preferences: {
    cuisines: string[];
    dietaryRestrictions: string[];
    spiceLevel: number;
    budget: string;
    location: string;
  };
  onBack: () => void;
}

export const RecommendationList: React.FC<RecommendationListProps> = ({ 
  recommendations, 
  preferences,
  onBack 
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center text-neutral-600 hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span>Back to Preferences</span>
        </button>
        <div className="text-sm text-neutral-500">
          Based on everyone's preferences
        </div>
      </div>
      
      <div className="card mb-6">
        <div className="card-body">
          <h2 className="text-xl font-semibold mb-4">Top Restaurant Recommendations</h2>
          
          <div className="bg-neutral-50 p-3 rounded-md mb-6">
            <h3 className="text-sm font-medium text-neutral-700 mb-2">Group Preferences Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-xs text-neutral-500 block">Top Cuisines</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {preferences.cuisines.map((cuisine, index) => (
                    <span key={index} className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded">
                      {cuisine}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-xs text-neutral-500 block">Dietary Needs</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {preferences.dietaryRestrictions.length > 0 ? (
                    preferences.dietaryRestrictions.map((restriction, index) => (
                      <span key={index} className="bg-secondary/10 text-secondary text-xs px-2 py-0.5 rounded">
                        {restriction}
                      </span>
                    ))
                  ) : (
                    <span className="text-neutral-500 text-xs">None specified</span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-xs text-neutral-500 block">Budget</span>
                <span className="font-medium">{preferences.budget}</span>
              </div>
              <div>
                <span className="text-xs text-neutral-500 block">Location</span>
                <span className="font-medium">{preferences.location}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            {recommendations.length > 0 ? (
              recommendations.map((restaurant) => (
                <div key={restaurant.id} className="border rounded-lg overflow-hidden flex flex-col md:flex-row">
                  <div className="md:w-1/3 bg-neutral-100">
                    {restaurant.imageUrl ? (
                      <img 
                        src={restaurant.imageUrl} 
                        alt={restaurant.name}
                        className="w-full h-48 md:h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 md:h-full flex items-center justify-center text-neutral-400">
                        No image available
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 md:w-2/3 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{restaurant.name}</h3>
                        <div className="flex items-center text-sm space-x-3 mt-1">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                            <span>{restaurant.rating}</span>
                            <span className="text-neutral-500 ml-1">({restaurant.reviewCount} reviews)</span>
                          </div>
                          <div className="text-neutral-600">{restaurant.price || 'Price N/A'}</div>
                        </div>
                      </div>
                      <a 
                        href={restaurant.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary-dark flex items-center text-sm"
                      >
                        View <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-2">
                      {restaurant.categories.map((category, index) => (
                        <span key={index} className="bg-neutral-100 text-xs px-2 py-0.5 rounded">
                          {category}
                        </span>
                      ))}
                    </div>
                    
                    <p className="text-sm text-neutral-600 mb-3">{restaurant.address}</p>
                    
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-neutral-100">
                      <div className="text-sm text-neutral-500">
                        {restaurant.distance.toFixed(1)} miles away
                      </div>
                      <div className="flex items-center">
                        <div className="text-sm mr-2">Match:</div>
                        <div className="bg-neutral-100 rounded-full h-6 w-24 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${getMatchScoreColor(restaurant.matchScore)}`}
                            style={{ width: `${restaurant.matchScore}%` }}
                          ></div>
                        </div>
                        <div className="text-sm font-medium ml-2">{restaurant.matchScore}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-neutral-500">
                No recommendations found. Try adjusting your preferences.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get color based on match score
function getMatchScoreColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-secondary';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-orange-500';
}