
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FreshTraceLogo } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { supplierData } from '@/lib/data';

export default function SupplierLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);

    // Simulate API call and authentication
    setTimeout(() => {
        const supplier = supplierData.find(s => s.contactEmail === email && s.password === password);
        
        if (supplier) {
             toast({
                title: 'Login Successful',
                description: `Welcome back, ${supplier.name}!`,
            });
            router.push(`/suppliers/portal?supplierId=${supplier.id}`);
        } else {
            toast({
                variant: 'destructive',
                title: 'Login Failed',
                description: 'Invalid email or password. Please try again.',
            });
        }
        setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                <FreshTraceLogo className="w-12 h-12 text-primary" />
            </div>
          <CardTitle className="text-2xl">Supplier Portal Login</CardTitle>
          <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </CardContent>
        <CardContent>
          <Button className="w-full" onClick={handleLogin} disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
