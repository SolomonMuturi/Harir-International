
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HandCoins, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import type { PettyCashTransaction } from '@/lib/data';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface PettyCashCardProps {
  transactions: PettyCashTransaction[];
  onTransaction: (tx: Omit<PettyCashTransaction, 'id' | 'timestamp'>) => void;
}

export function PettyCashCard({ transactions, onTransaction }: PettyCashCardProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [recipient, setRecipient] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState<'in' | 'out'>('out');

  const handleSubmit = () => {
    if (!amount || !description) {
      toast({
        variant: 'destructive',
        title: 'Missing Fields',
        description: 'Please enter an amount and description.',
      });
      return;
    }
    if (type === 'out' && (!recipient || !phone)) {
        toast({
            variant: 'destructive',
            title: 'Missing Fields',
            description: 'Recipient name and phone number are required for cash-out.',
        });
        return;
    }

    onTransaction({
      type,
      amount: parseFloat(amount),
      description,
      recipient,
      phone,
    });

    // Reset form
    setAmount('');
    setDescription('');
    setRecipient('');
    setPhone('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HandCoins />
          New Transaction
        </CardTitle>
        <CardDescription>
          Record a new petty cash transaction. Payments will be sent via M-Pesa.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Transaction Type</Label>
                <RadioGroup defaultValue="out" value={type} onValueChange={(v) => setType(v as 'in' | 'out')} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="out" id="out" />
                        <Label htmlFor="out">Cash Out (Dispense)</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <RadioGroupItem value="in" id="in" />
                        <Label htmlFor="in">Cash In (Receive)</Label>
                    </div>
                </RadioGroup>
            </div>
             <div className="space-y-2">
                <Label htmlFor="amount">Amount (KES)</Label>
                <Input id="amount" type="number" placeholder="e.g. 500" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            {type === 'out' && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="recipient">Recipient Name</Label>
                        <Input id="recipient" placeholder="e.g. John Doe" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Recipient Phone (M-Pesa)</Label>
                        <Input id="phone" placeholder="e.g. 0712345678" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                </>
            )}
            <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" placeholder="e.g. Office supplies" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
        </div>

        <Button onClick={handleSubmit} className="w-full">
            {type === 'out' ? 'Dispense Cash via M-Pesa' : 'Record Cash In'}
        </Button>
        
        <div>
            <h3 className="text-lg font-medium mb-2">Recent Transactions</h3>
            <ScrollArea className="h-64 border rounded-md">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount (KES)</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                        <TableCell>
                            <p className="font-medium">{tx.description}</p>
                            <p className="text-xs text-muted-foreground">{tx.recipient}</p>
                        </TableCell>
                        <TableCell>
                            {tx.type === 'in' ? 
                                <ArrowUpCircle className="text-green-500" /> : 
                                <ArrowDownCircle className="text-red-500" />
                            }
                        </TableCell>
                        <TableCell className={`text-right font-mono ${tx.type === 'in' ? 'text-green-500' : 'text-red-500'}`}>
                            {tx.type === 'in' ? '+' : '-'}{tx.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
