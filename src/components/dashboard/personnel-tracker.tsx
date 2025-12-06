
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { UserCheck, LogIn, LogOut } from 'lucide-react';
import { employeeData, coldRoomStatusData } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

interface PersonnelTrackerProps {
  onLogPersonnel: (employeeId: string, coldRoomId: string, eventType: 'entry' | 'exit') => void;
}

export function PersonnelTracker({ onLogPersonnel }: PersonnelTrackerProps) {
  const { toast } = useToast();
  const [employeeId, setEmployeeId] = useState<string>('');
  const [coldRoomId, setColdRoomId] = useState<string>('cr-1');
  const [eventType, setEventType] = useState<'entry' | 'exit'>('entry');

  const handleSubmit = () => {
    if (!employeeId || !coldRoomId) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please select an employee and a cold room.',
      });
      return;
    }
    onLogPersonnel(employeeId, coldRoomId, eventType);
    setEmployeeId(''); // Reset for next entry
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-primary" />
          Personnel Tracker
        </CardTitle>
        <CardDescription>
          Simulate an employee badge scan to log cold room entry or exit.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Event Type</Label>
          <RadioGroup defaultValue="entry" value={eventType} onValueChange={(v) => setEventType(v as 'entry' | 'exit')} className="flex gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="entry" id="entry" />
              <Label htmlFor="entry" className="flex items-center gap-2"><LogIn /> Log Entry</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="exit" id="exit" />
              <Label htmlFor="exit" className="flex items-center gap-2"><LogOut /> Log Exit</Label>
            </div>
          </RadioGroup>
        </div>
        <div className="space-y-2">
          <Label htmlFor="employee-select">Employee</Label>
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger id="employee-select">
              <SelectValue placeholder="Select an employee" />
            </SelectTrigger>
            <SelectContent>
              {employeeData.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cold-room-select">Cold Room</Label>
          <Select value={coldRoomId} onValueChange={setColdRoomId}>
            <SelectTrigger id="cold-room-select">
              <SelectValue placeholder="Select a cold room" />
            </SelectTrigger>
            <SelectContent>
              {coldRoomStatusData.map((room) => (
                <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSubmit} className="w-full">
          Log {eventType.charAt(0).toUpperCase() + eventType.slice(1)}
        </Button>
      </CardContent>
    </Card>
  );
}
