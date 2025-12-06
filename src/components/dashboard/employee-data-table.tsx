
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Briefcase } from 'lucide-react';
import type { Employee } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { StarRating } from '../ui/star-rating';

interface EmployeeDataTableProps {
  employees: Employee[];
  selectedEmployeeId?: string;
  onSelectEmployee: (employee: Employee) => void;
}

export function EmployeeDataTable({ employees, selectedEmployeeId, onSelectEmployee }: EmployeeDataTableProps) {
  
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');

  const statusVariant = {
    active: 'default',
    'on-leave': 'secondary',
    inactive: 'outline',
  } as const;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-primary" />
          Employee Roster
        </CardTitle>
        <CardDescription>
          Select an employee to view their details.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <ScrollArea className="h-[calc(100vh-20rem)]">
          <div className="p-2 space-y-2">
            {employees.map((employee) => (
              <div
                key={employee.id}
                onClick={() => onSelectEmployee(employee)}
                className={cn(
                  'flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors',
                  selectedEmployeeId === employee.id ? 'bg-muted' : 'hover:bg-muted/50'
                )}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={employee.image} alt={employee.name} />
                  <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-semibold">{employee.name}</div>
                  <div className="text-sm text-muted-foreground">{employee.role}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <StarRating rating={employee.rating} />
                    <Badge variant={statusVariant[employee.status]} className="capitalize text-xs">
                        {employee.status}
                    </Badge>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
