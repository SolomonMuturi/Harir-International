
'use client';

import { 
    Package, Users, FileText, Settings, BarChart3, BrainCircuit, Briefcase, TrendingUp, Banknote, QrCode, BookUser, List, Truck, 
    Weight, Warehouse, Thermometer, ShieldCheck, Cog, Shield, Boxes, Leaf, CreditCard, Wallet, HandCoins, Building, 
    BookCheck, Users2, ClipboardCheck, MessageSquare, Phone, Mail
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

type Activity = {
  id: string;
  type: 'Order' | 'Shipment' | 'Invoice' | 'Payment' | 'Meeting' | 'Call' | 'Email' | 'Note';
  title: string;
  description: string;
  date: string;
  user: string;
};

interface ActivityTimelineProps {
  activities: Activity[];
}

const iconMap: Record<Activity['type'], React.ReactNode> = {
    Order: <Package className="h-4 w-4" />,
    Shipment: <Truck className="h-4 w-4" />,
    Invoice: <FileText className="h-4 w-4" />,
    Payment: <Banknote className="h-4 w-4" />,
    Meeting: <Users className="h-4 w-4" />,
    Call: <Phone className="h-4 w-4" />,
    Email: <Mail className="h-4 w-4" />,
    Note: <MessageSquare className="h-4 w-4" />,
};

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
            <div className="relative pl-6 space-y-6">
                <div className="absolute left-0 top-0 h-full w-0.5 bg-border" />
                {activities.map((activity, index) => (
                    <div key={activity.id} className="relative flex items-start gap-4">
                        <div className="absolute -left-2.5 top-1.5 w-5 h-5 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                           <div className="w-3 h-3 rounded-full bg-primary" />
                        </div>
                        <div className="flex-grow">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-muted rounded-full text-muted-foreground">{iconMap[activity.type]}</div>
                                <p className="font-semibold">{activity.title}</p>
                            </div>
                            <p className="text-sm text-muted-foreground ml-9">{activity.description}</p>
                            <p className="text-xs text-muted-foreground ml-9 mt-1">
                                {formatDistanceToNow(new Date(activity.date), { addSuffix: true })} by {activity.user}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
