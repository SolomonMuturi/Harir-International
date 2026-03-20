
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
import { Checkbox } from '@/components/ui/checkbox';
import { Wallet, Send } from 'lucide-react';
import type { Employee } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from '../ui/input';
import { useUser } from '@/hooks/use-user';
import { useToast } from '@/hooks/use-toast';


interface PayrollTableProps {
  employees: Employee[];
  onSubmitForApproval: (employeeIds: string[], totalAmount: number) => void;
}

export function PayrollTable({ employees, onSubmitForApproval }: PayrollTableProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [casualPayRates, setCasualPayRates] = useState<Record<string, number>>({
      'emp-6': 2000 // Default daily rate for Peter Kamau
  });

  const handleSelectAll = (checked: boolean, employeeList: Employee[]) => {
    if (checked) {
      setSelectedEmployees(employeeList.map(e => e.id));
    } else {
      setSelectedEmployees(prev => prev.filter(id => !employeeList.some(e => e.id === id)));
    }
  };

  const handleSelectEmployee = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedEmployees(prev => [...prev, id]);
    } else {
      setSelectedEmployees(prev => prev.filter(eId => eId !== id));
    }
  };

  const salariedEmployees = employees.filter(e => e.contract === 'Full-time' || e.contract === 'Part-time');
  const casualEmployees = employees.filter(e => e.contract === 'Contract');
  
  const calculateTotalAmount = () => {
    return selectedEmployees.reduce((total, id) => {
      const employee = employees.find(e => e.id === id);
      if (!employee) return total;
      
      const isCasual = employee.contract === 'Contract';
      const grossPay = isCasual ? (casualPayRates[employee.id] || 0) : employee.salary;
      const deductions = isCasual ? 0 : grossPay * 0.15;
      const netPay = grossPay - deductions;
      
      return total + netPay;
    }, 0);
  };
  
  const handleSubmission = () => {
    const totalAmount = calculateTotalAmount();
    if (user?.role !== 'Admin') {
      onSubmitForApproval(selectedEmployees, totalAmount);
    } else {
      // Admin direct payment simulation
       toast({
        title: 'Payroll Run Initialized',
        description: `Processing M-Pesa payments for ${selectedEmployees.length} employees. Total: KES ${totalAmount.toLocaleString()}`,
      });
      setTimeout(() => {
           toast({
              title: 'Payroll Run Successful',
              description: `M-Pesa payments for ${selectedEmployees.length} employees have been sent successfully.`,
          });
      }, 3000);
    }
    setSelectedEmployees([]);
  };


  const renderTable = (employeeList: Employee[], type: 'salaried' | 'casual') => {
      const currentSelected = employeeList.filter(e => selectedEmployees.includes(e.id));
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={employeeList.length > 0 && currentSelected.length === employeeList.length}
                  onCheckedChange={(checked) => handleSelectAll(Boolean(checked), employeeList)}
                />
              </TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Contract</TableHead>
              <TableHead className="text-right">Gross Pay (KES)</TableHead>
              <TableHead className="text-right">Deductions (KES)</TableHead>
              <TableHead className="text-right">Net Pay (KES)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employeeList.map((employee) => {
                const grossPay = type === 'salaried' ? employee.salary : (casualPayRates[employee.id] || 0);
                const deductions = type === 'salaried' ? grossPay * 0.15 : 0; // Simplified 15% deduction for salaried
                const netPay = grossPay - deductions;

                return (
                    <TableRow key={employee.id}>
                        <TableCell>
                        <Checkbox
                            checked={selectedEmployees.includes(employee.id)}
                            onCheckedChange={(checked) => handleSelectEmployee(employee.id, Boolean(checked))}
                        />
                        </TableCell>
                        <TableCell className="font-medium">{employee.name}</TableCell>
                        <TableCell>{employee.contract}</TableCell>
                        <TableCell className="text-right">
                           {type === 'salaried' ? grossPay.toLocaleString() : (
                               <Input 
                                 type="number"
                                 className="h-8 w-32 ml-auto text-right"
                                 placeholder="Enter pay"
                                 value={casualPayRates[employee.id] || ''}
                                 onChange={(e) => setCasualPayRates(prev => ({...prev, [employee.id]: Number(e.target.value)}))}
                               />
                           )}
                        </TableCell>
                        <TableCell className="text-right font-mono">{deductions.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono font-bold">{netPay.toLocaleString()}</TableCell>
                    </TableRow>
                )
            })}
          </TableBody>
        </Table>
      );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary" />
          Run Payroll
        </CardTitle>
        <CardDescription>
          Select employees to include in this payroll run.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0">
         <Tabs defaultValue="salaried">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="salaried">Salaried Employees</TabsTrigger>
            <TabsTrigger value="casuals">Casuals</TabsTrigger>
          </TabsList>
          <TabsContent value="salaried">
            {renderTable(salariedEmployees, 'salaried')}
          </TabsContent>
          <TabsContent value="casuals">
            {renderTable(casualEmployees, 'casual')}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="justify-end border-t pt-4">
        <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{selectedEmployees.length} employee(s) selected</span>
            <Button onClick={handleSubmission} disabled={selectedEmployees.length === 0}>
                <Send className="mr-2" />
                {user?.role === 'Admin' ? 'Pay Selected via M-Pesa' : 'Submit for Approval'}
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
