'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, LogOut } from 'lucide-react';
import { Input } from '../ui/input';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function Header() {
  const { data: session } = useSession();
  const router = useRouter();

  const getInitials = (name: string = '') => {
    return name.split(' ').map(n => n[0]).join('');
  };

  const handleLogout = async () => {
    try {
      await signOut({ 
        redirect: false,
        callbackUrl: '/' // CHANGED FROM '/login' TO '/'
      });
      toast.success('Logged out successfully');
      router.push('/'); // CHANGED FROM '/login' TO '/'
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const user = session?.user;
  const userRole = (user as any)?.role || 'No Role';
  const userPermissions = (user as any)?.permissions || [];

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
              placeholder="Search..."
              className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
            />
          </div>
        </form>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={user?.image || `https://i.pravatar.cc/150?u=${user?.email}`} 
                  alt={user?.name || 'User'}
                />
                <AvatarFallback>
                  {getInitials(user?.name || user?.email || 'U')}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
                <p className="text-xs font-medium text-primary mt-1">
                  Role: {userRole}
                </p>
                {userPermissions.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {userPermissions.length} permission(s)
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-700">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}