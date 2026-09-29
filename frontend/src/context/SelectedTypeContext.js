"use client";

import React, { createContext, useState, useContext } from "react";

const SelectedTypeContext = createContext();

export const SelectedTypeProvider = ({ children }) => {
  const [selectedType, setSelectedType] = useState(null); // "pipeline" | "polygon" | null

  return (
    <SelectedTypeContext.Provider value={{ selectedType, setSelectedType }}>
      {children}
    </SelectedTypeContext.Provider>
  );
};

export const useSelectedType = () => useContext(SelectedTypeContext);
