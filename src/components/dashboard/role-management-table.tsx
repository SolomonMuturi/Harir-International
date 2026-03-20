
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Pencil, PlusCircle } from 'lucide-react';
import type { Role } from '@/lib/data';

interface RoleManagementTableProps {
  roles: Role[];
}

export function RoleManagementTable({ roles }: RoleManagementTableProps) {

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            System Roles
            </CardTitle>
            <CardDescription>
            A list of all roles and their assigned permissions.
            </CardDescription>
        </div>
        <Button>
            <PlusCircle className="mr-2" />
            Add New Role
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium">{role.name}</TableCell>
                <TableCell className="text-muted-foreground">{role.description}</TableCell>
                <TableCell>
                    <div className="flex flex-wrap gap-1">
                        {role.permissions.map(permission => (
                            <Badge key={permission} variant="secondary" className="font-mono">
                                {permission}
                            </Badge>
                        ))}
                    </div>
                </TableCell>
                <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                        <Pencil className="mr-2" />
                        Edit
                    </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
