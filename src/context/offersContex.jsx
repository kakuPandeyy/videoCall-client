import React, { createContext, useContext, useState,  } from "react";


const offerContext = createContext(null);

export const  OfferProvider = ({ children }) => {

    const [availableOffers,setAvailableOffers]= useState()

 

  return (
    <OfferProvider.Provider value={{availableOffers,setAvailableOffers}}>
      {children}
    </OfferProvider.Provider>
  );
};

export const useOffers = () => useContext(offerContext);
