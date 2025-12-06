
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Thermometer, Save, PlusCircle, Trash2, Settings, Pencil } from 'lucide-react';
import type { ColdRoomStatus } from '@/lib/data';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

interface ColdRoomSettingsProps {
  initialData: ColdRoomStatus[];
  onSave: (data: ColdRoomStatus[]) => void;
}

export function ColdRoomSettings({ initialData, onSave }: ColdRoomSettingsProps) {
  const [rooms, setRooms] = useState<ColdRoomStatus[]>(initialData);
  const [zoneTypes, setZoneTypes] = useState<string[]>(['Fruit', 'Vegetable', 'Flower']);
  const [isZoneManagerOpen, setIsZoneManagerOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<{ index: number; value: string } | null>(null);
  const [newZone, setNewZone] = useState('');

  const handleRoomChange = (id: string, field: keyof ColdRoomStatus, value: string | number) => {
    setRooms(prev => prev.map(room => (room.id === id ? { ...room, [field]: value } : room)));
  };
  
  const handleAddNew = () => {
    const newRoom: ColdRoomStatus = {
        id: `cr-${Date.now()}`,
        name: 'New Cold Room',
        temperature: 4.0,
        humidity: 90,
        status: 'Optimal',
        zoneType: 'Fruit',
    };
    setRooms(prev => [...prev, newRoom]);
  };

  const handleRemove = (id: string) => {
    setRooms(prev => prev.filter(room => room.id !== id));
  };

  const handleAddZoneType = () => {
    if (newZone && !zoneTypes.includes(newZone)) {
      setZoneTypes(prev => [...prev, newZone]);
      setNewZone('');
    }
  };

  const handleUpdateZoneType = () => {
    if (editingZone) {
      const updatedZoneTypes = [...zoneTypes];
      updatedZoneTypes[editingZone.index] = editingZone.value;
      setZoneTypes(updatedZoneTypes);
      setEditingZone(null);
    }
  };

  const handleDeleteZoneType = (index: number) => {
    setZoneTypes(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <Dialog open={isZoneManagerOpen} onOpenChange={setIsZoneManagerOpen}>
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Thermometer />
                Cold Room Configuration
              </CardTitle>
              <CardDescription>
                Manage the settings and target parameters for each cold room in your facility.
              </CardDescription>
            </div>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="mr-2" />
                Manage Zone Types
              </Button>
            </DialogTrigger>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room Name</TableHead>
                  <TableHead>Target Temp (°C)</TableHead>
                  <TableHead>Target Humidity (%)</TableHead>
                  <TableHead>Zone Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell>
                      <Input value={room.name} onChange={(e) => handleRoomChange(room.id, 'name', e.target.value)} />
                    </TableCell>
                    <TableCell>
                      <Input type="number" value={room.temperature} onChange={(e) => handleRoomChange(room.id, 'temperature', parseFloat(e.target.value))} />
                    </TableCell>
                    <TableCell>
                      <Input type="number" value={room.humidity} onChange={(e) => handleRoomChange(room.id, 'humidity', parseInt(e.target.value, 10))} />
                    </TableCell>
                    <TableCell>
                        <Select value={room.zoneType} onValueChange={(value) => handleRoomChange(room.id, 'zoneType', value)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {zoneTypes.map(zone => (
                                  <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleRemove(room.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button variant="outline" className="mt-4" onClick={handleAddNew}>
                <PlusCircle className="mr-2" />
                Add New Cold Room
            </Button>
          </CardContent>
          <CardFooter className="justify-end">
            <Button onClick={() => onSave(rooms)}>
                <Save className="mr-2" />
                Save Changes
            </Button>
          </CardFooter>
        </Card>
        
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Manage Zone Types</DialogTitle>
                <DialogDescription>Add, edit, or remove the available zone types for your cold rooms.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                {zoneTypes.map((zone, index) => (
                    <div key={index} className="flex items-center gap-2">
                        {editingZone?.index === index ? (
                            <Input 
                                value={editingZone.value}
                                onChange={(e) => setEditingZone({ index, value: e.target.value })}
                            />
                        ) : (
                            <p className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm">{zone}</p>
                        )}
                        
                        {editingZone?.index === index ? (
                            <Button size="sm" onClick={handleUpdateZoneType}>
                                <Save className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button size="sm" variant="outline" onClick={() => setEditingZone({ index, value: zone })}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                        )}
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteZoneType(index)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                <div className="flex items-center gap-2 pt-4 border-t">
                    <Input 
                        placeholder="Add new zone type..."
                        value={newZone}
                        onChange={(e) => setNewZone(e.target.value)}
                    />
                    <Button onClick={handleAddZoneType}><PlusCircle className="mr-2" /> Add</Button>
                </div>
            </div>
            <Button variant="outline" onClick={() => setIsZoneManagerOpen(false)}>Done</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
