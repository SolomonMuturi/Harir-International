
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ShieldCheck, Smartphone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '../ui/input';
import { useToast } from '@/hooks/use-toast';

export function TwoFactorAuth() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleToggle = () => {
    if (!isEnabled) {
      setIsDialogOpen(true);
    } else {
      setIsEnabled(false);
      toast({
        title: '2FA Disabled',
        description: 'Two-factor authentication has been disabled.',
        variant: 'destructive',
      });
    }
  };

  const handleEnable = () => {
    setIsEnabled(true);
    setIsDialogOpen(false);
    toast({
      title: '2FA Enabled',
      description: 'Two-factor authentication has been successfully enabled.',
    });
  }
  
  const verificationUrl = typeof window !== 'undefined' ? `${window.location.origin}/2fa-setup` : '';

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Smartphone className="w-6 h-6 text-muted-foreground" />
              <div>
                <p className="font-medium">Authenticator App</p>
                <p className="text-sm text-muted-foreground">
                  {isEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
            <Switch checked={isEnabled} onCheckedChange={handleToggle} />
          </div>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground">
                When enabled, you will be required to enter a code from your authenticator app upon login.
            </p>
        </CardFooter>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
                <DialogDescription>
                    Scan the QR code with your authenticator app (e.g., Google Authenticator) and enter the code to verify.
                </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
                 <div className="bg-white p-4 rounded-lg">
                    <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verificationUrl)}`} 
                        alt="QR Code for 2FA setup"
                    />
                 </div>
                 <div className="w-full max-w-sm">
                    <Input placeholder="Enter 6-digit code" className="text-center text-lg tracking-widest" />
                 </div>
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleEnable}>Enable & Verify</Button>
            </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
