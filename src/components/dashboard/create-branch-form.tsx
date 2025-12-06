
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
import type { Branch, Employee } from '@/lib/data';
import { useEffect } from 'react';

const formSchema = z.object({
  name: z.string().min(2, "Branch name must be at least 2 characters."),
  location: z.string().min(2, "Location is required."),
  managerId: z.string().min(1, "Please select a manager."),
  employees: z.coerce.number().min(1, "Number of employees must be at least 1."),
});

type BranchFormValues = Omit<Branch, 'id' | 'status'>;

interface CreateBranchFormProps {
  branch?: Branch | null;
  managers: Employee[];
  onSubmit: (values: BranchFormValues) => void;
}

export function CreateBranchForm({ branch, managers, onSubmit }: CreateBranchFormProps) {
  const isEditMode = !!branch;

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      location: '',
      managerId: '',
      employees: 0,
    },
  });

  useEffect(() => {
    if (isEditMode && branch) {
      form.reset({
        name: branch.name,
        location: branch.location,
        managerId: branch.managerId,
        employees: branch.employees,
      });
    }
  }, [branch, isEditMode, form]);

  const handleSubmit = (values: BranchFormValues) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Branch Name</FormLabel>
                <FormControl>
                    <Input placeholder="e.g. Nairobi HQ" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                    <Input placeholder="e.g. Nairobi, Kenya" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
                control={form.control}
                name="managerId"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Branch Manager</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Select a manager" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {managers.map(manager => (
                            <SelectItem key={manager.id} value={manager.id}>{manager.name}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField
            control={form.control}
            name="employees"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Number of Employees</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="e.g. 25" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <Button type="submit">{isEditMode ? 'Save Changes' : 'Create Branch'}</Button>
      </form>
    </Form>
  );
}
