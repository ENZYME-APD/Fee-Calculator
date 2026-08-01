"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { User, Company } from '../firebase/schema';
import { setDbCompanyId } from '../firebase/db';

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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setDbUser({ uid: userDoc.id, ...data } as User);
            setDbCompanyId(data.companyId);
            
            const companyDoc = await getDoc(doc(db, 'companies', data.companyId));
            if (companyDoc.exists()) {
              setDbCompany({ id: companyDoc.id, ...companyDoc.data() } as Company);
            } else {
              setDbCompany(null);
            }
          } else {
            setDbUser(null);
            setDbCompanyId(null);
            setDbCompany(null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setDbUser(null);
          setDbCompanyId(null);
          setDbCompany(null);
        }
      } else {
        setDbUser(null);
        setDbCompanyId(null);
        setDbCompany(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
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
  const currencyCode = dbCompany?.currency || 'USD';
  const areaUnit = dbCompany?.areaUnit || 'sqm';

  const formatCurrency = (amount: number, maxFractions = 2, minFractions = 0) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: minFractions,
      maximumFractionDigits: maxFractions,
    }).format(amount);
  };

  return { currencyCode, areaUnit, formatCurrency };
};
