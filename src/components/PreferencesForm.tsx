import React, { useState, useRef } from 'react';
import { MapPin, DollarSign } from 'lucide-react';
import { useLoadScript, Autocomplete } from "@react-google-maps/api";

const CUISINE_TYPES = [
  'American', 'Italian', 'Mexican', 'Chinese', 'Japanese', 
  'Thai', 'Indian', 'Mediterranean', 'French', 'Korean',
  'Vietnamese', 'Greek', 'BBQ', 'Vegan', 'Seafood'
];

const DIETARY_RESTRICTIONS = [
  'Vegetarian', 'Vegan', 'Gluten Free', 'Dairy Free', 
  'Nut Free', 'Halal', 'Kosher', 'Paleo'
];

interface Preference {
  cuisineTypes: string[];
  dietaryRestrictions: string[];
  spiceLevel: number;
  budget: string;
  location: string;
  coordinates: [number, number] | null;
  dateTime: string;
}

interface PreferencesFormProps {
  initialValues: Preference | null;
  onSubmit: (preferences: Preference) => void;
}

export const PreferencesForm: React.FC<PreferencesFormProps> = ({ initialValues, onSubmit }) => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyCE0czdshmR143Givplngsl-DROHywnP7s", // Replace or inject securely
    libraries: ["places"]
  });
  
  const autocompleteRef = useRef<any>(null);
  const [cuisineTypes, setCuisineTypes] = useState<string[]>(initialValues?.cuisineTypes || []);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>(
    initialValues?.dietaryRestrictions || []
  );
  const [spiceLevel, setSpiceLevel] = useState<number>(initialValues?.spiceLevel || 3);
  const [budget, setBudget] = useState<string>(initialValues?.budget || '$$');
  const [location, setLocation] = useState<string>(initialValues?.location || '');
  const [coordinates, setCoordinates] = useState<[number, number] | null>(initialValues?.coordinates || null);
  const [dateTime, setDateTime] = useState<string>(
    initialValues?.dateTime 
      ? new Date(initialValues.dateTime).toISOString().slice(0, 16) 
      : new Date().toISOString().slice(0, 16)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCuisineToggle = (cuisine: string) => {
    setCuisineTypes((prev) =>
      prev.includes(cuisine) ? prev.filter((c) => c !== cuisine) : [...prev, cuisine]
    );
  };

  const handleDietaryToggle = (restriction: string) => {
    setDietaryRestrictions((prev) =>
      prev.includes(restriction) ? prev.filter((r) => r !== restriction) : [...prev, restriction]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location || !coordinates) {
      alert('Please select a valid address');
      return;
    }
    setIsSubmitting(true);

    const preferences: Preference = {
      cuisineTypes,
      dietaryRestrictions,
      spiceLevel,
      budget,
      location,
      coordinates,
      dateTime: new Date(dateTime).toISOString()
    };

    onSubmit(preferences);
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-neutral-700 mb-3">Cuisine Types</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CUISINE_TYPES.map((cuisine) => (
            <label key={cuisine} className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${cuisineTypes.includes(cuisine) ? 'bg-primary/10 border border-primary' : 'bg-neutral-50 border border-neutral-200 hover:bg-neutral-100'}`}>
              <input type="checkbox" className="sr-only" checked={cuisineTypes.includes(cuisine)} onChange={() => handleCuisineToggle(cuisine)} />
              <span className={cuisineTypes.includes(cuisine) ? 'text-primary' : 'text-neutral-700'}>{cuisine}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-neutral-700 mb-3">Dietary Restrictions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DIETARY_RESTRICTIONS.map((restriction) => (
            <label key={restriction} className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${dietaryRestrictions.includes(restriction) ? 'bg-secondary/10 border border-secondary' : 'bg-neutral-50 border border-neutral-200 hover:bg-neutral-100'}`}>
              <input type="checkbox" className="sr-only" checked={dietaryRestrictions.includes(restriction)} onChange={() => handleDietaryToggle(restriction)} />
              <span className={dietaryRestrictions.includes(restriction) ? 'text-secondary' : 'text-neutral-700'}>{restriction}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-neutral-700 mb-3">Spice Level</h3>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-neutral-500">Mild</span>
          <input type="range" min="1" max="5" value={spiceLevel} onChange={(e) => setSpiceLevel(parseInt(e.target.value))} className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer" />
          <span className="text-xs text-neutral-500">Hot</span>
        </div>
        <div className="flex justify-between mt-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div key={level} className={`text-xs ${spiceLevel >= level ? 'text-primary' : 'text-neutral-400'}`}>{level}</div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-neutral-700 mb-3">Budget</h3>
        <div className="flex flex-wrap gap-2">
          {['$', '$$', '$$$', '$$$$'].map((price) => (
            <label key={price} className={`flex items-center p-2 border rounded-md cursor-pointer transition-colors ${budget === price ? 'bg-primary/10 border-primary' : 'border-neutral-200 hover:bg-neutral-100'}`}>
              <input type="radio" className="sr-only" name="budget" value={price} checked={budget === price} onChange={() => setBudget(price)} />
              <DollarSign className={`h-4 w-4 mr-1 ${budget === price ? 'text-primary' : 'text-neutral-400'}`} />
              <span className={budget === price ? 'text-primary' : 'text-neutral-700'}>
                {price === '$' && 'Budget'}
                {price === '$$' && 'Moderate'}
                {price === '$$$' && 'Pricey'}
                {price === '$$$$' && 'Luxury'}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-neutral-700 mb-1">Location</label>
          {isLoaded && (
            <Autocomplete
              onLoad={(ref) => (autocompleteRef.current = ref)}
              onPlaceChanged={() => {
                const place = autocompleteRef.current.getPlace();
                if (place?.geometry?.location) {
                  const lat = place.geometry.location.lat();
                  const lng = place.geometry.location.lng();
                  setLocation(place.formatted_address);
                  setCoordinates([lat, lng]);
                }
              }}
            >
              <input
                type="text"
                placeholder="Enter address"
                className="input-field pl-10"
                required
              />
            </Autocomplete>
          )}
        </div>

        <div>
          <label htmlFor="dateTime" className="block text-sm font-medium text-neutral-700 mb-1">Date & Time</label>
          <input
            type="datetime-local"
            id="dateTime"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            className="input-field"
            required
          />
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`btn-primary w-full ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isSubmitting ? 'Saving...' : initialValues ? 'Update Preferences' : 'Save Preferences'}
        </button>
      </div>
    </form>
  );
};




// import React, { useState } from 'react';
// import { MapPin, DollarSign } from 'lucide-react';
// import { useLoadScript, Autocomplete } from "@react-google-maps/api";
// import { useRef } from "react";

// // Data
// const CUISINE_TYPES = [
//   'American', 'Italian', 'Mexican', 'Chinese', 'Japanese', 
//   'Thai', 'Indian', 'Mediterranean', 'French', 'Korean',
//   'Vietnamese', 'Greek', 'BBQ', 'Vegan', 'Seafood'
// ];

// const DIETARY_RESTRICTIONS = [
//   'Vegetarian', 'Vegan', 'Gluten Free', 'Dairy Free', 
//   'Nut Free', 'Halal', 'Kosher', 'Paleo'
// ];

// interface Preference {
//   cuisineTypes: string[];
//   dietaryRestrictions: string[];
//   spiceLevel: number;
//   budget: string;
//   location: string;
//   dateTime: string;
// }

// interface PreferencesFormProps {
//   initialValues: Preference | null;
//   onSubmit: (preferences: Preference) => void;
// }

// export const PreferencesForm: React.FC<PreferencesFormProps> = ({ initialValues, onSubmit }) => {
//   const [cuisineTypes, setCuisineTypes] = useState<string[]>(initialValues?.cuisineTypes || []);
//   const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>(
//     initialValues?.dietaryRestrictions || []
//   );
//   const [spiceLevel, setSpiceLevel] = useState<number>(initialValues?.spiceLevel || 3);
//   const [budget, setBudget] = useState<string>(initialValues?.budget || '$$');
//   const [location, setLocation] = useState<string>(initialValues?.location || '');
//   const [dateTime, setDateTime] = useState<string>(
//     initialValues?.dateTime 
//       ? new Date(initialValues.dateTime).toISOString().slice(0, 16) 
//       : new Date().toISOString().slice(0, 16)
//   );
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const handleCuisineToggle = (cuisine: string) => {
//     if (cuisineTypes.includes(cuisine)) {
//       setCuisineTypes(cuisineTypes.filter((c) => c !== cuisine));
//     } else {
//       setCuisineTypes([...cuisineTypes, cuisine]);
//     }
//   };

//   const handleDietaryToggle = (restriction: string) => {
//     if (dietaryRestrictions.includes(restriction)) {
//       setDietaryRestrictions(dietaryRestrictions.filter((r) => r !== restriction));
//     } else {
//       setDietaryRestrictions([...dietaryRestrictions, restriction]);
//     }
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
    
//     if (!location) {
//       alert('Please enter a location');
//       return;
//     }
    
//     setIsSubmitting(true);
    
//     const preferences: Preference = {
//       cuisineTypes,
//       dietaryRestrictions,
//       spiceLevel,
//       budget,
//       location,
//       dateTime: new Date(dateTime).toISOString()
//     };
    
//     onSubmit(preferences);
//     setIsSubmitting(false);
//   };

//   return (
//     <form onSubmit={handleSubmit} className="space-y-6">
//       <div>
//         <h3 className="text-sm font-medium text-neutral-700 mb-3">Cuisine Types</h3>
//         <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
//           {CUISINE_TYPES.map((cuisine) => (
//             <label 
//               key={cuisine}
//               className={`
//                 flex items-center p-2 rounded-md cursor-pointer transition-colors
//                 ${cuisineTypes.includes(cuisine) 
//                   ? 'bg-primary/10 border border-primary' 
//                   : 'bg-neutral-50 border border-neutral-200 hover:bg-neutral-100'}
//               `}
//             >
//               <input
//                 type="checkbox"
//                 className="sr-only"
//                 checked={cuisineTypes.includes(cuisine)}
//                 onChange={() => handleCuisineToggle(cuisine)}
//               />
//               <span className={cuisineTypes.includes(cuisine) ? 'text-primary' : 'text-neutral-700'}>
//                 {cuisine}
//               </span>
//             </label>
//           ))}
//         </div>
//       </div>
      
//       <div>
//         <h3 className="text-sm font-medium text-neutral-700 mb-3">Dietary Restrictions</h3>
//         <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
//           {DIETARY_RESTRICTIONS.map((restriction) => (
//             <label 
//               key={restriction}
//               className={`
//                 flex items-center p-2 rounded-md cursor-pointer transition-colors
//                 ${dietaryRestrictions.includes(restriction) 
//                   ? 'bg-secondary/10 border border-secondary' 
//                   : 'bg-neutral-50 border border-neutral-200 hover:bg-neutral-100'}
//               `}
//             >
//               <input
//                 type="checkbox"
//                 className="sr-only"
//                 checked={dietaryRestrictions.includes(restriction)}
//                 onChange={() => handleDietaryToggle(restriction)}
//               />
//               <span className={dietaryRestrictions.includes(restriction) ? 'text-secondary' : 'text-neutral-700'}>
//                 {restriction}
//               </span>
//             </label>
//           ))}
//         </div>
//       </div>
      
//       <div>
//         <h3 className="text-sm font-medium text-neutral-700 mb-3">Spice Level</h3>
//         <div className="flex items-center space-x-2">
//           <span className="text-xs text-neutral-500">Mild</span>
//           <input
//             type="range"
//             min="1"
//             max="5"
//             value={spiceLevel}
//             onChange={(e) => setSpiceLevel(parseInt(e.target.value))}
//             className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
//           />
//           <span className="text-xs text-neutral-500">Hot</span>
//         </div>
//         <div className="flex justify-between mt-1">
//           {[1, 2, 3, 4, 5].map((level) => (
//             <div 
//               key={level}
//               className={`text-xs ${spiceLevel >= level ? 'text-primary' : 'text-neutral-400'}`}
//             >
//               {level}
//             </div>
//           ))}
//         </div>
//       </div>
      
//       <div>
//         <h3 className="text-sm font-medium text-neutral-700 mb-3">Budget</h3>
//         <div className="flex flex-wrap gap-2">
//           {['$', '$$', '$$$', '$$$$'].map((price) => (
//             <label 
//               key={price}
//               className={`
//                 flex items-center p-2 border rounded-md cursor-pointer transition-colors
//                 ${budget === price 
//                   ? 'bg-primary/10 border-primary' 
//                   : 'border-neutral-200 hover:bg-neutral-100'}
//               `}
//             >
//               <input
//                 type="radio"
//                 className="sr-only"
//                 name="budget"
//                 value={price}
//                 checked={budget === price}
//                 onChange={() => setBudget(price)}
//               />
//               <DollarSign className={`h-4 w-4 mr-1 ${budget === price ? 'text-primary' : 'text-neutral-400'}`} />
//               <span className={budget === price ? 'text-primary' : 'text-neutral-700'}>
//                 {price === '$' && 'Budget'}
//                 {price === '$$' && 'Moderate'}
//                 {price === '$$$' && 'Pricey'}
//                 {price === '$$$$' && 'Luxury'}
//               </span>
//             </label>
//           ))}
//         </div>
//       </div>
      
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <div>
//           <label htmlFor="location" className="block text-sm font-medium text-neutral-700 mb-1">
//             Location
//           </label>
//           <div className="relative">
//             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//               <MapPin className="h-5 w-5 text-neutral-400" />
//             </div>
//             <input
//               type="text"
//               id="location"
//               placeholder="City, neighborhood, or address"
//               value={location}
//               onChange={(e) => setLocation(e.target.value)}
//               className="input-field pl-10"
//               required
//             />
//           </div>
//         </div>
        
//         <div>
//           <label htmlFor="dateTime" className="block text-sm font-medium text-neutral-700 mb-1">
//             Date & Time
//           </label>
//           <input
//             type="datetime-local"
//             id="dateTime"
//             value={dateTime}
//             onChange={(e) => setDateTime(e.target.value)}
//             className="input-field"
//             required
//           />
//         </div>
//       </div>
      
//       <div className="pt-4">
//         <button
//           type="submit"
//           disabled={isSubmitting}
//           className={`btn-primary w-full ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
//         >
//           {isSubmitting ? 'Saving...' : initialValues ? 'Update Preferences' : 'Save Preferences'}
//         </button>
//       </div>
//     </form>
//   );
// };