
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Employee {
    id: string;
    name: string;
    image: string;
}

interface SopComplianceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  sopTitle?: string;
  department?: string;
  employees?: Employee[];
  readBy?: string[];
}

const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('');

export function SopComplianceDialog({
  isOpen,
  onOpenChange,
  sopTitle,
  department,
  employees = [],
  readBy = [],
}: SopComplianceDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>SOP Compliance: {department}</DialogTitle>
          <DialogDescription>
            Read status for "{sopTitle?.split(':')[0]}"
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {employees.map(employee => {
                        const hasRead = readBy.includes(employee.id);
                        return (
                            <TableRow key={employee.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={employee.image} alt={employee.name} />
                                            <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                                        </Avatar>
                                        <span>{employee.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Badge variant={hasRead ? 'default' : 'secondary'}>
                                        {hasRead ? 'Read' : 'Pending'}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
