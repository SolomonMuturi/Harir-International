"use client";

import { useState } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
} from '@/components/layout/client-layout';
import { FreshViewLogo } from '@/components/icons';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import { sopData, allSopEmployeeData, type SOP } from '@/lib/sop-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Edit, BookOpen, Clock, Users, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUser } from '@/hooks/use-user';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('');

const statusConfig = {
    'Completed': { icon: CheckCircle, color: 'text-green-500', label: 'Completed' },
    'In Progress': { icon: Clock, color: 'text-yellow-500', label: 'In Progress' },
    'Not Started': { icon: Circle, color: 'text-muted-foreground', label: 'Not Started' },
};

export default function SOPPage() {
  const { user } = useUser();
  const [sops, setSops] = useState(sopData);
  const [selectedSop, setSelectedSop] = useState<SOP>(sops[0]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSop, setEditingSop] = useState<SOP | null>(null);

  const handleMarkAsRead = (sopId: string) => {
    const userId = user?.id || 'emp-1';
    
    const newSops = sops.map(sop => {
      if (sop.id === sopId && !sop.readBy.includes(userId)) {
        const newReadBy = [...sop.readBy, userId];
        let newStatus: SOP['status'] = 'In Progress';
        if (newReadBy.length === allSopEmployeeData.length) {
          newStatus = 'Completed';
        }
        return { ...sop, readBy: newReadBy, status: newStatus };
      }
      return sop;
    });
    setSops(newSops);

    if (selectedSop.id === sopId) {
      const updatedSop = newSops.find(s => s.id === sopId);
      if (updatedSop) {
        setSelectedSop(updatedSop);
      }
    }
  };

  const handleEditClick = () => {
    setEditingSop({ ...selectedSop });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingSop) return;
    
    const updatedSops = sops.map(sop => 
      sop.id === editingSop.id ? { ...editingSop, lastModified: new Date().toISOString() } : sop
    );
    
    setSops(updatedSops);
    setSelectedSop({ ...editingSop, lastModified: new Date().toISOString() });
    setIsEditModalOpen(false);
    setEditingSop(null);
  };

  const handleSectionChange = (index: number, field: 'title' | 'steps', value: any) => {
    if (!editingSop) return;
    
    const newSections = [...editingSop.sections];
    if (field === 'title') {
      newSections[index] = { ...newSections[index], title: value };
    } else if (field === 'steps') {
      newSections[index] = { ...newSections[index], steps: value };
    }
    
    setEditingSop({ ...editingSop, sections: newSections });
  };

  const handleStepChange = (sectionIndex: number, stepIndex: number, field: 'action' | 'detail', value: string) => {
    if (!editingSop) return;
    
    const newSections = [...editingSop.sections];
    const newSteps = [...newSections[sectionIndex].steps];
    newSteps[stepIndex] = { ...newSteps[stepIndex], [field]: value };
    newSections[sectionIndex] = { ...newSections[sectionIndex], steps: newSteps };
    
    setEditingSop({ ...editingSop, sections: newSections });
  };

  const addSection = () => {
    if (!editingSop) return;
    
    const newSections = [
      ...editingSop.sections,
      { title: 'New Section', steps: [{ action: 'New Step', detail: 'Step details' }] }
    ];
    
    setEditingSop({ ...editingSop, sections: newSections });
  };

  const removeSection = (index: number) => {
    if (!editingSop) return;
    
    const newSections = editingSop.sections.filter((_, i) => i !== index);
    setEditingSop({ ...editingSop, sections: newSections });
  };

  const addStep = (sectionIndex: number) => {
    if (!editingSop) return;
    
    const newSections = [...editingSop.sections];
    newSections[sectionIndex].steps.push({ action: 'New Step', detail: 'Step details' });
    
    setEditingSop({ ...editingSop, sections: newSections });
  };

  const removeStep = (sectionIndex: number, stepIndex: number) => {
    if (!editingSop) return;
    
    const newSections = [...editingSop.sections];
    newSections[sectionIndex].steps = newSections[sectionIndex].steps.filter((_, i) => i !== stepIndex);
    
    setEditingSop({ ...editingSop, sections: newSections });
  };

  const getReadByAvatars = (readByIds: string[]) => {
    return readByIds.map(id => allSopEmployeeData.find(emp => emp.id === id)).filter(Boolean);
  };
  
  const completionPercentage = (selectedSop.readBy.length / allSopEmployeeData.length) * 100;
  const hasUserRead = user ? selectedSop.readBy.includes(user.id) : false;

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <FreshViewLogo className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-headline font-bold text-sidebar-foreground">
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
        <main className="p-4 md:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                 <div className="mb-6">
                    <h2 className="text-2xl font-bold tracking-tight">
                        Standard Operating Procedures (SOPs)
                    </h2>
                    <p className="text-muted-foreground">
                        A central knowledge base for all company procedures.
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <div className="col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>All SOPs</CardTitle>
                            </CardHeader>
                            <CardContent className="p-2 space-y-1">
                                {sops.map(sop => {
                                    const StatusIcon = statusConfig[sop.status].icon;
                                    return (
                                        <button 
                                            key={sop.id} 
                                            onClick={() => setSelectedSop(sop)}
                                            className={cn(
                                                "w-full text-left p-3 rounded-md transition-colors",
                                                selectedSop.id === sop.id ? 'bg-muted' : 'hover:bg-muted/50'
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold truncate pr-2">{sop.title}</p>
                                                <StatusIcon className={cn("w-4 h-4 flex-shrink-0", statusConfig[sop.status].color)} />
                                            </div>
                                            <p className="text-xs text-muted-foreground">{statusConfig[sop.status].label}</p>
                                        </button>
                                    )
                                })}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="col-span-1 md:col-span-2 lg:col-span-3">
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl flex items-center gap-2">
                                            <BookOpen />
                                            {selectedSop.title}
                                        </CardTitle>
                                        <CardDescription className="mt-1">
                                            Last Modified: {formatDistanceToNow(new Date(selectedSop.lastModified), { addSuffix: true })}
                                        </CardDescription>
                                    </div>
                                    <Button variant="outline" onClick={handleEditClick}>
                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="prose prose-sm max-w-none text-foreground dark:prose-invert">
                                <p className="lead">{selectedSop.objective}</p>
                                {selectedSop.sections.map((section, index) => (
                                    <div key={index} className="mt-6">
                                        <h3>{section.title}</h3>
                                        <ul className="list-disc pl-5 space-y-2">
                                            {section.steps.map((step, stepIndex) => (
                                                <li key={stepIndex}>
                                                    <strong>{step.action}:</strong> {step.detail}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </CardContent>
                            <CardFooter className="flex flex-col items-start gap-4 border-t pt-6">
                                 <div className="w-full">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-semibold flex items-center gap-2"><Users className="h-4 w-4" /> Readership</h4>
                                        <span className="text-sm text-muted-foreground">{selectedSop.readBy.length} of {allSopEmployeeData.length} employees</span>
                                    </div>
                                    <Progress value={completionPercentage} />
                                    <TooltipProvider>
                                      <div className="flex items-center gap-2 mt-2">
                                          <div className="flex -space-x-2">
                                              {getReadByAvatars(selectedSop.readBy).slice(0, 7).map(emp => (
                                                emp && <Tooltip key={emp.id}>
                                                  <TooltipTrigger>
                                                    <Avatar className="h-8 w-8 border-2 border-background">
                                                        <AvatarImage src={emp?.image} />
                                                        <AvatarFallback>{getInitials(emp?.name || '')}</AvatarFallback>
                                                    </Avatar>
                                                  </TooltipTrigger>
                                                  <TooltipContent>
                                                    <p>{emp?.name} - Read</p>
                                                  </TooltipContent>
                                                </Tooltip>
                                              ))}
                                          </div>
                                          {selectedSop.readBy.length > 7 && (
                                              <span className="text-xs text-muted-foreground">+{selectedSop.readBy.length - 7} more</span>
                                          )}
                                      </div>
                                    </TooltipProvider>
                                </div>
                                <Button onClick={() => handleMarkAsRead(selectedSop.id)} disabled={hasUserRead}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    {hasUserRead ? 'Read' : 'Mark as Read'}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </main>
      </SidebarInset>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit SOP</DialogTitle>
            <DialogDescription>
              Make changes to the SOP content. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          
          {editingSop && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="sop-title">Title</Label>
                <Input 
                  id="sop-title" 
                  value={editingSop.title} 
                  onChange={(e) => setEditingSop({ ...editingSop, title: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sop-objective">Objective</Label>
                <Textarea 
                  id="sop-objective" 
                  value={editingSop.objective} 
                  onChange={(e) => setEditingSop({ ...editingSop, objective: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Sections</Label>
                  <Button variant="outline" size="sm" onClick={addSection}>
                    <Plus className="h-4 w-4 mr-1" /> Add Section
                  </Button>
                </div>
                
                {editingSop.sections.map((section, sectionIndex) => (
                  <Card key={sectionIndex}>
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 space-y-2">
                          <Label htmlFor={`section-${sectionIndex}-title`}>Section Title</Label>
                          <Input 
                            id={`section-${sectionIndex}-title`}
                            value={section.title} 
                            onChange={(e) => handleSectionChange(sectionIndex, 'title', e.target.value)}
                          />
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => removeSection(sectionIndex)}
                          className="mt-6"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label>Steps</Label>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => addStep(sectionIndex)}
                          >
                            <Plus className="h-4 w-4 mr-1" /> Add Step
                          </Button>
                        </div>
                        
                        {section.steps.map((step, stepIndex) => (
                          <div key={stepIndex} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start p-3 border rounded-md">
                            <div className="md:col-span-4 space-y-1">
                              <Label className="text-xs">Action</Label>
                              <Input 
                                value={step.action} 
                                onChange={(e) => handleStepChange(sectionIndex, stepIndex, 'action', e.target.value)}
                                placeholder="Action"
                              />
                            </div>
                            <div className="md:col-span-7 space-y-1">
                              <Label className="text-xs">Detail</Label>
                              <Input 
                                value={step.detail} 
                                onChange={(e) => handleStepChange(sectionIndex, stepIndex, 'detail', e.target.value)}
                                placeholder="Detail"
                              />
                            </div>
                            <div className="md:col-span-1 flex items-end justify-end">
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={() => removeStep(sectionIndex, stepIndex)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}