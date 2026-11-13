"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { User, Company } from '../firebase/schema';
import { setDbCompanyId } from '../firebase/db';
import { useCurrencyView } from '@/lib/currency/view';

interface AuthContextType {
  user: FirebaseUser | null;
  dbUser: User | null;
  dbCompany: Company | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  dbUser: null,
  dbCompany: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [dbCompany, setDbCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUser: (() => void) | undefined;
    let unsubscribeCompany: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      
      if (unsubscribeUser) {
        unsubscribeUser();
        unsubscribeUser = undefined;
      }
      if (unsubscribeCompany) {
        unsubscribeCompany();
        unsubscribeCompany = undefined;
      }

      if (firebaseUser) {
        unsubscribeUser = onSnapshot(doc(db, 'users', firebaseUser.uid), (userDoc) => {
          if (userDoc.exists()) {
            const data = userDoc.data();
            setDbUser({ uid: userDoc.id, ...data } as User);
            setDbCompanyId(data.companyId);
            
            if (unsubscribeCompany) unsubscribeCompany();
            
            unsubscribeCompany = onSnapshot(doc(db, 'companies', data.companyId), (companyDoc) => {
              if (companyDoc.exists()) {
                setDbCompany({ id: companyDoc.id, ...companyDoc.data() } as Company);
              } else {
                setDbCompany(null);
              }
              setLoading(false);
            }, (error) => {
              console.error("Error fetching company data:", error);
              setDbCompany(null);
              setLoading(false);
            });
            
          } else {
            setDbUser(null);
            setDbCompanyId(null);
            setDbCompany(null);
            setLoading(false);
          }
        }, (error) => {
          console.error("Error fetching user data:", error);
          setDbUser(null);
          setDbCompanyId(null);
          setDbCompany(null);
          setLoading(false);
        });
      } else {
        setDbUser(null);
        setDbCompanyId(null);
        setDbCompany(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeCompany) unsubscribeCompany();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, dbUser, dbCompany, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const useAppSettings = () => {
  const { dbCompany } = useAuth();
  const baseCurrencyCode = dbCompany?.currency || 'USD';
  const areaUnit = dbCompany?.areaUnit || 'sqm';
  // Inside a project shown in its contract currency, amounts (stored in the company currency) are converted
  const view = useCurrencyView();
  const showContract = !!view?.showingContract;
  const currencyCode = showContract ? view!.contractCode : baseCurrencyCode;
  const rate = showContract ? view!.rate : 1;

  const formatCurrency = (amount: number, maxFractions = 2, minFractions = 0) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: minFractions,
      maximumFractionDigits: maxFractions,
    }).format(amount / rate);
  };

  return { currencyCode, baseCurrencyCode, areaUnit, formatCurrency, currencyView: view };
};
