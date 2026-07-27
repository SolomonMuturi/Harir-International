import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
} from '@/components/layout/client-layout';
import { FreshViewLogo } from '@/components/icons';
import { Header } from '@/components/layout/header';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { OrangesModule } from '@/components/modules/oranges-module';

export default function OrangesPage() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <FreshViewLogo className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold text-sidebar-foreground">
              Harir International
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        <Header />
        <main className="min-h-screen bg-[#0f172a] p-4 md:p-6 lg:p-8">
          <div className="w-full">
            <OrangesModule />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
