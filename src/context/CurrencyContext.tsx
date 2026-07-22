"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/config/firebase";

export interface CountryCurrency {
  country: string;
  currency: string;
  symbol: string;
  code: string;
}

export const countryCurrencyMap: CountryCurrency[] = [
  // North America
  { country: "United States", currency: "US Dollar", symbol: "$", code: "USD" },
  { country: "Canada", currency: "Canadian Dollar", symbol: "CA$", code: "CAD" },
  { country: "Mexico", currency: "Mexican Peso", symbol: "MX$", code: "MXN" },

  // Europe
  { country: "France", currency: "Euro", symbol: "€", code: "EUR" },
  { country: "Germany", currency: "Euro", symbol: "€", code: "EUR" },
  { country: "Italy", currency: "Euro", symbol: "€", code: "EUR" },
  { country: "Spain", currency: "Euro", symbol: "€", code: "EUR" },
  { country: "Portugal", currency: "Euro", symbol: "€", code: "EUR" },
  { country: "Netherlands", currency: "Euro", symbol: "€", code: "EUR" },
  { country: "Belgium", currency: "Euro", symbol: "€", code: "EUR" },
  { country: "Greece", currency: "Euro", symbol: "€", code: "EUR" },
  { country: "Austria", currency: "Euro", symbol: "€", code: "EUR" },
  { country: "United Kingdom", currency: "British Pound", symbol: "£", code: "GBP" },
  { country: "Switzerland", currency: "Swiss Franc", symbol: "CHF", code: "CHF" },
  { country: "Sweden", currency: "Swedish Krona", symbol: "kr", code: "SEK" },
  { country: "Norway", currency: "Norwegian Krone", symbol: "kr", code: "NOK" },
  { country: "Denmark", currency: "Danish Krone", symbol: "kr", code: "DKK" },
  { country: "Poland", currency: "Polish Zloty", symbol: "zł", code: "PLN" },
  { country: "Russia", currency: "Russian Ruble", symbol: "₽", code: "RUB" },

  // Africa
  { country: "Nigeria", currency: "Nigerian Naira", symbol: "₦", code: "NGN" },
  { country: "Ghana", currency: "Ghanaian Cedi", symbol: "GH₵", code: "GHS" },
  { country: "South Africa", currency: "South African Rand", symbol: "R", code: "ZAR" },
  { country: "Kenya", currency: "Kenyan Shilling", symbol: "KSh", code: "KES" },
  { country: "Ethiopia", currency: "Ethiopian Birr", symbol: "Br", code: "ETB" },
  { country: "Tanzania", currency: "Tanzanian Shilling", symbol: "TSh", code: "TZS" },
  { country: "Uganda", currency: "Ugandan Shilling", symbol: "USh", code: "UGX" },
  { country: "Egypt", currency: "Egyptian Pound", symbol: "E£", code: "EGP" },
  { country: "Morocco", currency: "Moroccan Dirham", symbol: "MAD", code: "MAD" },
  { country: "Senegal", currency: "West African CFA Franc", symbol: "CFA", code: "XOF" },
  { country: "Ivory Coast", currency: "West African CFA Franc", symbol: "CFA", code: "XOF" },
  { country: "Cameroon", currency: "Central African CFA Franc", symbol: "CFA", code: "XAF" },
  { country: "Zimbabwe", currency: "Zimbabwean Dollar", symbol: "Z$", code: "ZWL" },
  { country: "Zambia", currency: "Zambian Kwacha", symbol: "ZK", code: "ZMW" },

  // Middle East / Arab Countries
  { country: "Saudi Arabia", currency: "Saudi Riyal", symbol: "﷼", code: "SAR" },
  { country: "United Arab Emirates", currency: "UAE Dirham", symbol: "AED", code: "AED" },
  { country: "Qatar", currency: "Qatari Riyal", symbol: "QR", code: "QAR" },
  { country: "Kuwait", currency: "Kuwaiti Dinar", symbol: "KD", code: "KWD" },
  { country: "Bahrain", currency: "Bahraini Dinar", symbol: "BD", code: "BHD" },
  { country: "Oman", currency: "Omani Rial", symbol: "OMR", code: "OMR" },
  { country: "Jordan", currency: "Jordanian Dinar", symbol: "JD", code: "JOD" },
  { country: "Lebanon", currency: "Lebanese Pound", symbol: "L£", code: "LBP" },
  { country: "Iraq", currency: "Iraqi Dinar", symbol: "IQD", code: "IQD" },

  // Asia
  { country: "China", currency: "Chinese Yuan", symbol: "¥", code: "CNY" },
  { country: "Japan", currency: "Japanese Yen", symbol: "¥", code: "JPY" },
  { country: "India", currency: "Indian Rupee", symbol: "₹", code: "INR" },
  { country: "South Korea", currency: "South Korean Won", symbol: "₩", code: "KRW" },
  { country: "Singapore", currency: "Singapore Dollar", symbol: "S$", code: "SGD" },
  { country: "Malaysia", currency: "Malaysian Ringgit", symbol: "RM", code: "MYR" },
  { country: "Indonesia", currency: "Indonesian Rupiah", symbol: "Rp", code: "IDR" },
  { country: "Thailand", currency: "Thai Baht", symbol: "฿", code: "THB" },
  { country: "Philippines", currency: "Philippine Peso", symbol: "₱", code: "PHP" },
  { country: "Pakistan", currency: "Pakistani Rupee", symbol: "₨", code: "PKR" },
  { country: "Bangladesh", currency: "Bangladeshi Taka", symbol: "৳", code: "BDT" },

  // Latin America
  { country: "Brazil", currency: "Brazilian Real", symbol: "R$", code: "BRL" },
  { country: "Argentina", currency: "Argentine Peso", symbol: "AR$", code: "ARS" },
  { country: "Colombia", currency: "Colombian Peso", symbol: "COL$", code: "COP" },
  { country: "Chile", currency: "Chilean Peso", symbol: "CL$", code: "CLP" },
  { country: "Peru", currency: "Peruvian Sol", symbol: "S/.", code: "PEN" },
  { country: "Venezuela", currency: "Venezuelan Bolivar", symbol: "Bs.", code: "VES" },

  // Oceania
  { country: "Australia", currency: "Australian Dollar", symbol: "A$", code: "AUD" },
  { country: "New Zealand", currency: "New Zealand Dollar", symbol: "NZ$", code: "NZD" },
];

interface CurrencyContextType {
  country: string;
  currency: string;
  symbol: string;
  code: string;
  setCountry: (country: string) => void;
  saveCountry: (country: string) => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<CountryCurrency>(
    countryCurrencyMap[0] // Default: United States
  );

  // Load country from Firestore when user logs in
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (!user) {
      // Avoid resetting to USA instantly if the user is just reloading or transitioning.
      // We can leave the last selected country in memory, or if you strictly want to reset,
      // only do so when we are sure there is no active session.
      return;
    }

    try {
      const hospitalDoc = await getDoc(doc(db, "Hospitals", user.uid));
      if (hospitalDoc.exists()) {
        const savedCountry = hospitalDoc.data().country;
        if (savedCountry) {
          const found = countryCurrencyMap.find((c) => c.country === savedCountry);
          if (found) {
            setSelected(found);
          }
        }
      }
    } catch (error) {
      console.error("Error loading country preference:", error);
    }
  });

  return () => unsubscribe();
}, []);

  const setCountry = (countryName: string) => {
    const found = countryCurrencyMap.find((c) => c.country === countryName);
    if (found) setSelected(found);
  };

  // Save country to Firestore so it persists across sessions
  const saveCountry = async (countryName: string) => {
    const found = countryCurrencyMap.find((c) => c.country === countryName);
    if (!found) return;
    setSelected(found);

    try {
      const { auth: firebaseAuth } = await import("@/config/firebase");
      const user = firebaseAuth.currentUser;
      if (!user) return;
      await updateDoc(doc(db, "Hospitals", user.uid), {
        country: countryName,
      });
    } catch (error) {
      console.error("Error saving country preference:", error);
    }
  };

  return (
    <CurrencyContext.Provider
      value={{
        country: selected.country,
        currency: selected.currency,
        symbol: selected.symbol,
        code: selected.code,
        setCountry,
        saveCountry,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("useCurrency must be used within a CurrencyProvider");
  return context;
}