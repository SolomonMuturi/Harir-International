
'use client';

import { createContext, useState, useContext, ReactNode } from 'react';
import type { Employee } from '@/lib/data';
import { employeeData } from '@/lib/data';

interface UserContextType {
  user: Employee | null;
  setUser: (user: Employee | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Employee | null>(employeeData[0]); // Default to the first employee (Admin)

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
