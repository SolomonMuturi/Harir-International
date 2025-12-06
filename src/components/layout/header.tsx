
'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, User, ChevronDown } from 'lucide-react';
import { Input } from '../ui/input';
import { useUser } from '@/hooks/use-user';
import { employeeData, supplierData, carrierData, type Employee } from '@/lib/data';

// Create a unified list of "users" for the switcher
const allUsers: Employee[] = [
  ...employeeData,
  ...supplierData.map(s => ({ ...s, role: 'Supplier' as const, image: s.logoUrl })),
  ...carrierData.map(c => ({ ...c, role: 'Carrier' as const, image: '' })), // Carriers don't have images
];


export function Header() {
  const { user, setUser } = useUser();

  const getInitials = (name: string = '') => {
    return name.split(' ').map(n => n[0]).join('');
  }

  const handleUserChange = (id: string) => {
    const selectedUser = allUsers.find(u => u.id === id);
    setUser(selectedUser || null);
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <div className="flex items-center gap-2">
         <SidebarTrigger className="md:hidden" />
         <h1 className="font-headline text-xl font-semibold hidden md:block">Dashboard</h1>
      </div>
      
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <form className="ml-auto flex-1 sm:flex-initial">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
            />
          </div>
        </form>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
             <Button variant="outline" className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user?.image || `https://i.pravatar.cc/150?u=${user?.id}`} />
                  <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.role}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
             </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Switch User Role</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={user?.id} onValueChange={handleUserChange}>
              {allUsers.map(u => (
                <DropdownMenuRadioItem key={u.id} value={u.id}>
                    {u.name} ({u.role})
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
                <User className="mr-2"/>
                My Account
            </DropdownMenuItem>
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
