/**
 * This file maps user-friendly cuisine types to Yelp API category aliases
 * to improve matching accuracy when searching for restaurants.
 */

// Map of cuisine types to Yelp category aliases
export const cuisineToYelpMapping = {
    'indian': ['indpak', 'indian', 'pakistani', 'himalayan'],
    'chinese': ['chinese', 'cantonese', 'dimsum', 'shanghainese', 'szechuan'],
    'italian': ['italian', 'sicilian', 'sardinian', 'tuscan'],
    'mexican': ['mexican', 'tex-mex', 'tacos', 'newmexican'],
    'japanese': ['japanese', 'sushi', 'ramen', 'teppanyaki', 'izakaya'],
    'thai': ['thai', 'laotian'],
    'vietnamese': ['vietnamese', 'pho'],
    'korean': ['korean', 'kbbq'],
    'american': ['newamerican', 'tradamerican', 'burgers', 'diners'],
    'mediterranean': ['mediterranean', 'greek', 'lebanese', 'turkish'],
    'middle eastern': ['mideastern', 'lebanese', 'turkish', 'egyptian'],
    'french': ['french', 'bistros', 'provencal'],
    'seafood': ['seafood', 'fishnchips', 'raw_food'],
    'vegetarian': ['vegetarian', 'vegan'],
    'bbq': ['bbq', 'smokehouse'],
    'dessert': ['desserts', 'icecream', 'bakeries'],
  };
  
  // Get Yelp categories for a given cuisine
  export function getYelpCategories(cuisine) {
    const normalizedCuisine = cuisine.toLowerCase().trim();
    return cuisineToYelpMapping[normalizedCuisine] || [normalizedCuisine];
  }
  
  // Get all possible Yelp categories for a list of cuisines
  export function getAllYelpCategories(cuisines) {
    const allCategories = new Set();
    
    cuisines.forEach(cuisine => {
      const yelpCategories = getYelpCategories(cuisine);
      yelpCategories.forEach(category => allCategories.add(category));
    });
    
    return Array.from(allCategories);
  }