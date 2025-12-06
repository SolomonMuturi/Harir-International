
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud, Image as ImageIcon, Palette, Building, User, Mail, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Separator } from '../ui/separator';

export function BrandingSettings() {
  const { toast } = useToast();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#22c55e'); // Default to green-500
  const [backgroundColor, setBackgroundColor] = useState('#0f172a'); // Default to slate-900

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = () => {
    toast({
      title: 'Branding Settings Saved',
      description: 'Your logo and color scheme have been updated.',
    });
    // In a real app, you would apply these colors to the theme.
    // For this prototype, we just show a toast.
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding & Appearance</CardTitle>
        <CardDescription>
          Customize the look and feel of your application for a multi-tenant experience.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-2">
          <Label>Company Logo</Label>
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 rounded-md border border-dashed flex items-center justify-center bg-muted/50">
              {logoPreview ? (
                <Image src={logoPreview} alt="Logo preview" layout="fill" objectFit="contain" />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <Button asChild variant="outline">
                <label htmlFor="logo-upload" className="cursor-pointer">
                    <UploadCloud className="mr-2" />
                    Upload Logo
                    <Input id="logo-upload" type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                </label>
            </Button>
          </div>
        </div>

        <div className="space-y-4">
            <Label className="flex items-center gap-2"><Palette /> Color Scheme</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="primary-color">Primary Color</Label>
                    <Input id="primary-color" type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="background-color">Background Color</Label>
                    <Input id="background-color" type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} />
                </div>
            </div>
        </div>

        <Separator />

        <div className="space-y-4">
            <Label className="flex items-center gap-2"><Building /> Client Details</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="company-name" className="flex items-center gap-2 text-sm"><Building className="w-4 h-4 text-muted-foreground"/>Company Name</Label>
                    <Input id="company-name" placeholder="Your Company Name" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="contact-person" className="flex items-center gap-2 text-sm"><User className="w-4 h-4 text-muted-foreground"/>Contact Person</Label>
                    <Input id="contact-person" placeholder="e.g. Jane Doe" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="contact-email" className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-muted-foreground"/>Email Address</Label>
                    <Input id="contact-email" type="email" placeholder="e.g. contact@yourcompany.com" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="contact-phone" className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-muted-foreground"/>Phone Number</Label>
                    <Input id="contact-phone" type="tel" placeholder="e.g. +254 712 345 678" />
                </div>
            </div>
        </div>

      </CardContent>
      <CardFooter className="justify-end">
        <Button onClick={handleSaveChanges}>Save Changes</Button>
      </CardFooter>
    </Card>
  );
}
