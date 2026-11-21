// context/CurrencyContext.jsx — Lesotho Maloti (M) & South African Rand (R) Currency Switcher
import { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
  // Lesotho Maloti (M) is pegged 1:1 with South African Rand (R)
  const [currency, setCurrencyState] = useState(() => {
    return localStorage.getItem('batloung_currency') || 'R';
  });

  const setCurrency = (curr) => {
    setCurrencyState(curr);
    localStorage.setItem('batloung_currency', curr);
  };

  const formatMoney = (amount) => {
    const val = Number(amount || 0).toFixed(2);
    return `${currency} ${val}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatMoney }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
