'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HandCoins, Check, X, Send } from 'lucide-react';
import type { AdvanceRequest } from '@/lib/data';
import { employeeData } from '@/lib/data';
import { format, formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';

interface AdvanceRequestsProps {
  requests: AdvanceRequest[];
  onAction: (requestId: string, action: 'approve' | 'reject' | 'pay') => void;
}

export function AdvanceRequests({ requests, onAction }: AdvanceRequestsProps) {
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');

    const statusVariant = {
        Pending: 'secondary',
        Approved: 'default',
        Rejected: 'destructive',
        Paid: 'outline',
    } as const;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HandCoins className="w-5 h-5 text-primary" />
          Salary Advance Requests
        </CardTitle>
        <CardDescription>
          Review and process employee advance requests.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <ScrollArea className="h-[450px]">
          <div className="space-y-4 p-4">
            {requests.map((request) => {
                const employee = employeeData.find(e => e.id === request.employeeId);
                if (!employee) return null;

                return (
                    <div key={request.id} className="flex items-start gap-4 rounded-lg border p-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={employee.image} alt={employee.name} />
                            <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold">{employee.name}</span>
                                <Badge variant={statusVariant[request.status]}>{request.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{request.reason}</p>
                            <p className="font-bold text-lg">KES {request.amount.toLocaleString()}</p>
                            <div className="flex items-center justify-between mt-2">
                                <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(request.requestDate), { addSuffix: true })}
                                </p>
                                <div className="flex gap-1">
                                    {request.status === 'Pending' && (
                                        <>
                                            <Button size="sm" variant="outline" onClick={() => onAction(request.id, 'reject')}><X className="w-4 h-4" /></Button>
                                            <Button size="sm" variant="outline" onClick={() => onAction(request.id, 'approve')}><Check className="w-4 h-4" /></Button>
                                        </>
                                    )}
                                    {request.status === 'Approved' && (
                                        <Button size="sm" onClick={() => onAction(request.id, 'pay')}>
                                            <Send className="mr-2" /> Pay via M-Pesa
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
