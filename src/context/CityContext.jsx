import { createContext, useContext, useState } from 'react';

const CityContext = createContext(null);

export function CityProvider({ children }) {
  const [city, setCity] = useState(
    () => localStorage.getItem('selectedCity') || 'lahore'
  );

  const selectCity = (citySlug) => {
    setCity(citySlug);
    localStorage.setItem('selectedCity', citySlug);
  };

  return (
    <CityContext.Provider value={{ city, selectCity }}>
      {children}
    </CityContext.Provider>
  );
}

export const useCity = () => useContext(CityContext);
