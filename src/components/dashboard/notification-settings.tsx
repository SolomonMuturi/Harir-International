
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Bell } from 'lucide-react';
import type { Employee } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export type NotificationPreferences = {
  [employeeId: string]: {
    inApp: boolean;
    sms: boolean;
    whatsApp: boolean;
  };
};

interface NotificationSettingsProps {
  employees: Employee[];
  initialPreferences: NotificationPreferences;
  onSaveChanges: (preferences: NotificationPreferences) => void;
}

export function NotificationSettings({ employees, initialPreferences, onSaveChanges }: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState(initialPreferences);

  const handleToggle = (employeeId: string, channel: 'inApp' | 'sms' | 'whatsApp') => {
    setPreferences(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [channel]: !prev[employeeId][channel],
      },
    }));
  };
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Manage alert settings for each user across different channels.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead className="text-center">In-App</TableHead>
              <TableHead className="text-center">SMS</TableHead>
              <TableHead className="text-center">WhatsApp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                     <Avatar>
                        <AvatarImage src={`https://i.pravatar.cc/150?u=${employee.id}`} />
                        <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-sm text-muted-foreground">{employee.role}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={preferences[employee.id]?.inApp || false}
                    onCheckedChange={() => handleToggle(employee.id, 'inApp')}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={preferences[employee.id]?.sms || false}
                    onCheckedChange={() => handleToggle(employee.id, 'sms')}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={preferences[employee.id]?.whatsApp || false}
                    onCheckedChange={() => handleToggle(employee.id, 'whatsApp')}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="justify-end">
        <Button onClick={() => onSaveChanges(preferences)}>Save Changes</Button>
      </CardFooter>
    </Card>
  );
}

