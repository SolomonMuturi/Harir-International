
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
} from '@/components/layout/client-layout';
import { FreshTraceLogo } from '@/components/icons';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import { userRolesData } from '@/lib/data';
import { RoleManagementTable } from '@/components/dashboard/role-management-table';

export default function UserRolesPage() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <FreshTraceLogo className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-headline font-bold text-sidebar-foreground">
              FreshTrace
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="p-4 md:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold tracking-tight">
                        User Role Management
                    </h2>
                    <p className="text-muted-foreground">
                        Define roles and assign permissions to control user access.
                    </p>
                </div>
                <RoleManagementTable roles={userRolesData} />
            </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
