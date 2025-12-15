'use client';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubTrigger,
  SidebarMenuSubContent,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  PackageSearch,
  Users,
  FileText,
  Settings,
  BarChart3,
  BrainCircuit,
  Briefcase,
  TrendingUp,
  Banknote,
  QrCode,
  BookUser,
  List,
  Truck,
  Weight,
  Warehouse,
  Thermometer,
  ShieldCheck,
  Cog,
  Shield,
  Boxes,
  Leaf,
  CreditCard,
  Wallet,
  HandCoins,
  Building,
  BookCheck,
  Users2,
  ClipboardCheck,
  Zap,
  FlaskConical,
  Grape,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import type { Employee } from '@/lib/data';
import { Separator } from '../ui/separator';
import Link from 'next/link';

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  roles: Employee['role'][];
}

const mainNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'Driver'] },
  { name: 'Dashboard', href: '/warehouse', icon: LayoutDashboard, roles: ['Warehouse'] },
  { name: 'Dashboard', href: '/security/dashboard', icon: LayoutDashboard, roles: ['Security'] },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, roles: ['Admin', 'Manager'] },
  { name: 'BI Features', href: '/bi-features', icon: BrainCircuit, roles: ['Admin', 'Manager'] },
 // { name: 'Customers', href: '/customers', icon: Users, roles: ['Admin', 'Manager'] },
  { name: 'Suppliers', href: '/suppliers', icon: Grape, roles: ['Admin', 'Manager', 'Warehouse'] },
];

const hrNavItems: NavItem[] = [
  { name: 'Employees', href: '/employees', icon: Briefcase, roles: ['Admin', 'Manager'] },
];

const accessManagementNavItems: NavItem[] = [
  { name: 'Visitor Log', href: '/visitor-management', icon: Users, roles: ['Admin', 'Manager', 'Security'] },
  { name: 'Vehicle Log', href: '/vehicle-management', icon: Truck, roles: ['Admin', 'Manager', 'Security'] },
];

const operationsNavItems: NavItem[] = [
//  { name: 'Traceability', href: '/traceability', icon: PackageSearch, roles: ['Admin', 'Manager', 'Warehouse', 'Security'] },
{ name: 'Intake', href: '/weight-capture', icon: Weight, roles: ['Admin', 'Manager', 'Warehouse', 'Driver'] },  
{ name: 'Quality Control', href: '/quality-control', icon: FlaskConical, roles: ['Admin', 'Manager', 'Warehouse'] },
{ name: 'Counting', href: '/warehouse', icon: Warehouse, roles: ['Admin', 'Manager', 'Warehouse'] },
{ name: 'Cold Room', href: '/cold-room', icon: Thermometer, roles: ['Admin', 'Manager', 'Warehouse'] },
{ name: 'Shipments', href: '/shipments', icon: Truck, roles: ['Admin', 'Manager', 'Warehouse'] },
{ name: 'Carriers', href: '/carriers', icon: Briefcase, roles: ['Admin', 'Manager'] },
{ name: 'Loading', href: '/outbound', icon: Truck, roles: ['Admin', 'Manager', 'Warehouse'] },
  
 // { name: 'Tag Management', href: '/tag-management', icon: QrCode, roles: ['Admin', 'Manager', 'Warehouse'] },
  
  { name: 'Inventory', href: '/inventory', icon: Boxes, roles: ['Admin', 'Manager', 'Warehouse'] },
//  { name: 'Produce', href: '/produce', icon: Leaf, roles: ['Admin', 'Manager', 'Warehouse'] },
  { name: 'Utility Management', href: '/utility', icon: Zap, roles: ['Admin', 'Manager'] },
];

const administrationNavItems: NavItem[] = [
  { name: 'Reports', href: '/reports', icon: FileText, roles: ['Admin', 'Manager'] },
  { name: 'Standard Procedures', href: '/sop', icon: BookCheck, roles: ['Admin', 'Manager', 'Warehouse', 'Driver', 'Security'] },
  { name: 'User Roles', href: '/user-roles', icon: ShieldCheck, roles: ['Admin'] },
 // { name: 'Branches', href: '/branches', icon: Building, roles: ['Admin'] },
 // { name: 'Client Management', href: '/clients', icon: Users2, roles: ['Admin'] },
  { name: 'Security Center', href: '/security', icon: Shield, roles: ['Admin'] },
  { name: 'Settings', href: '/settings', icon: Cog, roles: ['Admin'] },
];

const financialNavItems: NavItem[] = [
//  { name: 'Dashboard', href: '/financials', icon: LayoutDashboard, roles: ['Admin', 'Manager'] },
//  { name: 'Payroll', href: '/payroll', icon: Wallet, roles: ['Admin', 'Manager'] },
//  { name: 'Petty Cash', href: '/financials/petty-cash', icon: HandCoins, roles: ['Admin', 'Manager'] },
//  { name: 'Accounts Receivable', href: '/financials/accounts-receivable', icon: BookUser, roles: ['Admin', 'Manager'] },
//  { name: 'Invoices', href: '/financials/invoices', icon: List, roles: ['Admin', 'Manager'] },
//  { name: 'General Ledger', href: '/financials/ledger', icon: FileText, roles: ['Admin'] },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const userRole = user?.role || 'Admin'; // Default to Admin if no user

  const hasAccess = (roles: Employee['role'][]) => roles.includes(userRole);

  const visibleMainNav = mainNavItems.filter(item => hasAccess(item.roles));
  const visibleHrNav = hrNavItems.filter(item => hasAccess(item.roles));
  const visibleAccessNav = accessManagementNavItems.filter(item => hasAccess(item.roles));
  const visibleOperationsNav = operationsNavItems.filter(item => hasAccess(item.roles));
  const visibleAdminNav = administrationNavItems.filter(item => hasAccess(item.roles));
  const visibleFinancialNav = financialNavItems.filter(item => hasAccess(item.roles));
  
  const NavGroup = ({ title, items }: { title: string, items: NavItem[] }) => {
    if (items.length === 0) return null;
    return (
        <div className="p-2">
            <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight text-sidebar-foreground">
                {title}
            </h2>
            <SidebarMenu>
                {items.map(item => (
                    <SidebarMenuItem key={`${item.name}-${item.href}`}>
                        <SidebarMenuButton
                            isActive={pathname === item.href}
                            asChild
                            tooltip={item.name}
                            variant={pathname === item.href ? 'secondary' : 'ghost'}
                            className="w-full justify-start"
                        >
                            <Link href={item.href}>
                            <item.icon className="mr-2 h-4 w-4" />
                            <span>{item.name}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </div>
    );
  };
  
  const SubNavGroup = ({ title, items, icon: Icon }: { title: string, items: NavItem[], icon: React.ElementType }) => {
    if (items.length === 0) return null;

    const isAnyItemActive = items.some(item => pathname.startsWith(item.href));

    return (
        <SidebarMenuItem>
            <SidebarMenuSub open={isAnyItemActive}>
            <SidebarMenuSubTrigger>
                <SidebarMenuButton
                isActive={isAnyItemActive}
                variant={isAnyItemActive ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                tooltip={title}
                >
                <Icon className="mr-2 h-4 w-4" />
                <span>{title}</span>
                </SidebarMenuButton>
            </SidebarMenuSubTrigger>
            <SidebarMenuSubContent>
                {items.map((item) => (
                <SidebarMenuSubItem key={`${item.name}-${item.href}`}>
                    <SidebarMenuSubButton
                    isActive={pathname === item.href}
                    asChild
                    >
                    <Link href={item.href}>
                        <span>{item.name}</span>
                    </Link>
                    </SidebarMenuSubButton>
                </SidebarMenuSubItem>
                ))}
            </SidebarMenuSubContent>
            </SidebarMenuSub>
        </SidebarMenuItem>
    );
  };

  return (
    <div className="space-y-2">
        <NavGroup title="Main" items={visibleMainNav} />
        <NavGroup title="HR" items={visibleHrNav} />
        <NavGroup title="Access Control" items={visibleAccessNav} />
        <Separator />
        
        <NavGroup title="Operations" items={visibleOperationsNav} />
        
        <Separator />
        <NavGroup title="Financials" items={visibleFinancialNav} />
        <Separator />
        <NavGroup title="Administration" items={visibleAdminNav} />
    </div>
  );
}