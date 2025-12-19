'use client';

import { createContext, useState, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation'; // Added import for redirect
import type { Employee } from '@/lib/data';
import { employeeData } from '@/lib/data';

interface UserContextType {
  user: Employee | null;
  setUser: (user: Employee | null) => void;
  logout: () => void; // Added logout function to interface
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Employee | null>(employeeData[0]); // Default to the first employee (Admin)
  const router = useRouter(); // Initialize router for redirect

  // Add the logout function here
  const logout = () => {
    // 1. Clear the user from React state
    setUser(null);
    
    // 2. Redirect to the login page
    router.push('/login');
    
    // 3. Optional: Refresh to clear any stale state
    router.refresh();
    
    console.log('User logged out and redirected to login');
  };

  return (
    // Add logout to the value prop
    <UserContext.Provider value={{ user, setUser, logout }}>
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