// src/app/page.tsx
'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, LogIn, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { FreshTraceLogo } from '@/components/icons';
import { logActivity, ActivityTypes } from '@/lib/activity-logger';

// Wrapper component that handles search params
function LoginFormWrapper() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  return <LoginFormContent callbackUrl={callbackUrl} />;
}

// Main form component without useSearchParams
function LoginFormContent({ callbackUrl }: { callbackUrl: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Load remembered credentials (client-side only)
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    const rememberedPassword = localStorage.getItem('rememberedPassword');

    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }

    if (rememberedPassword) {
      setPassword(rememberedPassword);
      setRememberPassword(true);
    }
  }, []);

  // Function to determine redirect based on permissions - ADMIN FIRST
  const getRedirectUrl = (permissions: string[]): string => {
    // 👑 ADMIN FIRST - Highest priority
    if (permissions.some(p => p.startsWith('admin.'))) {
      return '/dashboard';
    }
    
    // Check permissions in priority order
    if (permissions.includes('vehicle_log.view') || permissions.includes('vehicle_log.manage')) {
      return '/vehicle-management';
    }
    if (permissions.includes('suppliers.weigh')) {
      return '/weight-capture';
    }
    if (permissions.includes('counting.perform')) {
      return '/warehouse';
    }
    if (permissions.includes('cold_room.view') || permissions.includes('cold_room.manage') || 
        permissions.includes('cold_room.temperature') || permissions.includes('cold_room.inventory')) {
      return '/cold-room';
    }
    if (permissions.includes('shipments.view') || permissions.includes('shipments.create') || 
        permissions.includes('shipments.update') || permissions.includes('shipments.track') || 
        permissions.includes('shipments.manifest')) {
      return '/shipments';
    }
    if (permissions.includes('qc.view') || permissions.includes('qc.perform') || 
        permissions.includes('qc.approve') || permissions.includes('qc.export')) {
      return '/quality-control';
    }
    if (permissions.includes('inventory.view') || permissions.includes('inventory.manage') || 
        permissions.includes('inventory.packaging') || permissions.includes('inventory.reports')) {
      return '/inventory';
    }
    if (permissions.includes('loading.view') || permissions.includes('loading.create') || 
        permissions.includes('loading.manage') || permissions.includes('loading.assign') || 
        permissions.includes('loading.transit')) {
      return '/outbound';
    }
    if (permissions.includes('carriers.view') || permissions.includes('carriers.manage') || 
        permissions.includes('carriers.assign') || permissions.includes('carriers.track')) {
      return '/carriers';
    }
    if (permissions.includes('utilities.view') || permissions.includes('utilities.record') || 
        permissions.includes('utilities.analyze') || permissions.includes('utilities.reports')) {
      return '/utility';
    }
    if (permissions.includes('suppliers.view') || permissions.includes('suppliers.manage') || 
        permissions.includes('suppliers.visitors')) {
      return '/suppliers';
    }
    if (permissions.some(p => p.startsWith('employees.'))) {
      return '/employees';
    }
    if (permissions.includes('customers.view') || permissions.includes('customers.manage') || 
        permissions.includes('customers.quotes') || permissions.includes('customers.invoices') || 
        permissions.includes('customers.receivables')) {
      return '/customers';
    }
    // Fallback to dashboard if user has dashboard permission or no specific permissions
    if (permissions.includes('dashboard.view') || permissions.includes('dashboard.analytics')) {
      return '/dashboard';
    }
    // Final fallback
    return '/dashboard';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (rememberMe) {
      localStorage.setItem('rememberedEmail', email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }

    if (rememberPassword) {
      localStorage.setItem('rememberedPassword', password);
    } else {
      localStorage.removeItem('rememberedPassword');
    }

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false, // Don't auto-redirect
      });

      if (result?.error) {
        const errorMessage = result.error === 'CredentialsSignin'
          ? 'Invalid email or password'
          : result.error;
        setError(errorMessage);
        toast.error(errorMessage);

        // ✅ LOG FAILED LOGIN ATTEMPT
        await logActivity({
          user: email,
          action: ActivityTypes.USER_LOGIN,
          status: 'failure',
          metadata: {
            email,
            error: errorMessage,
            timestamp: new Date().toISOString(),
            attemptType: 'credentials',
          },
        });

      } else if (result?.ok) {
        // Get session to check permissions
        const session = await getSession();
        const user = session?.user as any;
        const permissions = user?.permissions || [];
        const userName = user?.name || email;
        
        // ✅ LOG SUCCESSFUL LOGIN
        await logActivity({
          user: userName,
          action: ActivityTypes.USER_LOGIN,
          status: 'success',
          avatar: user?.image || userName.substring(0, 2).toUpperCase(),
          metadata: {
            userId: user?.id,
            email: user?.email || email,
            permissions: permissions,
            loginTime: new Date().toISOString(),
            rememberMe: rememberMe,
          },
        });
        
        // Determine where to redirect based on permissions
        const redirectUrl = getRedirectUrl(permissions);
        
        toast.success(`Welcome back, ${userName}!`);
        router.push(redirectUrl);
        router.refresh();
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = 'An error occurred. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);

      // ✅ LOG ERROR DURING LOGIN
      await logActivity({
        user: email,
        action: ActivityTypes.USER_LOGIN,
        status: 'failure',
        metadata: {
          email,
          error: error.message || 'Unknown error',
          stack: error.stack,
          timestamp: new Date().toISOString(),
        },
      });

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-2">
            <div className="w-20 h-20 bg-primary rounded-lg flex items-center justify-center">
              <FreshTraceLogo className="w-40 h-20 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Harir International</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access Harir International
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pr-10"
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  disabled={isLoading}
                />
                <Label
                  htmlFor="remember-me"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Remember me
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember-password"
                  checked={rememberPassword}
                  onCheckedChange={(checked) => setRememberPassword(checked as boolean)}
                  disabled={isLoading}
                />
                <Label
                  htmlFor="remember-password"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Remember my password
                </Label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Main page component
export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading login page...</p>
        </div>
      </div>
    }>
      <LoginFormWrapper />
    </Suspense>
  );
}