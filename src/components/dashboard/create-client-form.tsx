
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Client, ClientFormValues } from '@/lib/data';
import { useEffect } from 'react';

const formSchema = z.object({
  name: z.string().min(2, "Client name must be at least 2 characters."),
  contactName: z.string().min(2, "Contact name is required."),
  contactEmail: z.string().email("Please enter a valid email."),
  subscriptionTier: z.enum(['Starter', 'Professional', 'Enterprise']),
  status: z.enum(['Active', 'Suspended', 'New']),
});

interface CreateClientFormProps {
  client?: Client | null;
  onSubmit: (values: ClientFormValues) => void;
}

export function CreateClientForm({ client, onSubmit }: CreateClientFormProps) {
  const isEditMode = !!client;

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      contactName: '',
      contactEmail: '',
      subscriptionTier: 'Starter',
      status: 'New',
    },
  });

  useEffect(() => {
    if (isEditMode && client) {
      form.reset({
        name: client.name,
        contactName: client.contactName,
        contactEmail: client.contactEmail,
        subscriptionTier: client.subscriptionTier,
        status: client.status,
      });
    }
  }, [client, isEditMode, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Global Exporters Ltd." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contactName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Person</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Alice Johnson" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contactEmail"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Contact Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="e.g. alice@globalexporters.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="subscriptionTier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subscription Tier</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a tier" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Starter">Starter</SelectItem>
                    <SelectItem value="Professional">Professional</SelectItem>
                    <SelectItem value="Enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {isEditMode && (
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        <Button type="submit">{isEditMode ? 'Save Changes' : 'Create Client'}</Button>
      </form>
    </Form>
  );
}
