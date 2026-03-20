
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

// Define the type for a single data item directly in the component
type ComplianceData = {
  category: string;
  score: number;
  breakdown: { metric: string; value: number }[];
};

interface ComplianceScoreBreakdownDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  data: ComplianceData[]; // Use the defined type for the prop
}

export function ComplianceScoreBreakdownDialog({
  isOpen,
  onOpenChange,
  data,
}: ComplianceScoreBreakdownDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compliance Score Breakdown</DialogTitle>
          <DialogDescription>
            Details of the metrics contributing to each compliance category score.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {data && data.map((category) => (
              <div key={category.category}>
                <h3 className="font-semibold text-lg mb-2">
                  {category.category} -{' '}
                  <span className="text-primary">{category.score}/100</span>
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {category.breakdown.map((metric) => (
                      <TableRow key={metric.metric}>
                        <TableCell>{metric.metric}</TableCell>
                        <TableCell className="text-right font-mono">
                          {metric.value}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
