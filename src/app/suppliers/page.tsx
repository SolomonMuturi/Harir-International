'use client'

import { useState, useEffect } from 'react'
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
} from '@/components/layout/client-layout'
import { FreshTraceLogo } from '@/components/icons'
import { SidebarNav } from '@/components/layout/sidebar-nav'
import { Header } from '@/components/layout/header'
import type { Supplier, SupplierFormValues } from '@/lib/data'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { CreateSupplierForm } from '@/components/dashboard/create-supplier-form'
import { PlusCircle, Grape, Download, Calendar, FileDown, AlertCircle, Phone, Banknote, Users, FileCheck, ChevronRight, Edit, Trash2, Search } from 'lucide-react'
import { OverviewCard } from '@/components/dashboard/overview-card'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface DatabaseSupplier {
  id: string
  name: string
  location: string
  contact_name: string
  contact_email: string
  contact_phone: string
  produce_types: string
  status: string
  logo_url: string
  active_contracts: number
  supplier_code: string
  kra_pin: string
  vehicle_number_plate: string
  driver_name: string
  driver_id_number: string
  mpesa_paybill: string
  mpesa_account_number: string
  bank_name: string
  bank_account_number: string
  password: string
  created_at: string
}

interface DateRange {
  from: Date
  to: Date
}

interface SupplierStats {
  total: number
  active: number
  inactive: number
  onboarding: number
  totalContracts: number
  withBankDetails: number
  withMpesaDetails: number
  completeProfiles: number
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null)
  const [isLoadingDelete, setIsLoadingDelete] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [stats, setStats] = useState<SupplierStats>({
    total: 0,
    active: 0,
    inactive: 0,
    onboarding: 0,
    totalContracts: 0,
    withBankDetails: 0,
    withMpesaDetails: 0,
    completeProfiles: 0,
  })
  const { toast } = useToast()

  // Fetch suppliers from database with date filtering
  const fetchSuppliers = async (startDate?: Date, endDate?: Date) => {
    try {
      setIsLoading(true)
      
      let url = '/api/suppliers'
      const params = new URLSearchParams()
      
      const fromDate = startDate || dateRange.from
      const toDate = endDate || dateRange.to
      
      params.append('startDate', format(fromDate, 'yyyy-MM-dd'))
      params.append('endDate', format(toDate, 'yyyy-MM-dd'))
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }
      
      const response = await fetch(url)
      if (response.ok) {
        const data: DatabaseSupplier[] = await response.json()
        const convertedSuppliers: Supplier[] = data.map(supplier => ({
          id: supplier.id,
          name: supplier.name,
          location: supplier.location,
          contactName: supplier.contact_name,
          contactEmail: supplier.contact_email,
          contactPhone: supplier.contact_phone,
          produceTypes: supplier.produce_types 
            ? (typeof supplier.produce_types === 'string' 
                ? JSON.parse(supplier.produce_types)
                : supplier.produce_types)
            : [],
          status: supplier.status as 'Active' | 'Inactive' | 'Onboarding',
          logoUrl: supplier.logo_url,
          activeContracts: supplier.active_contracts,
          supplierCode: supplier.supplier_code,
          kraPin: supplier.kra_pin,
          vehicleNumberPlate: supplier.vehicle_number_plate,
          driverName: supplier.driver_name,
          driverIdNumber: supplier.driver_id_number,
          mpesaPaybill: supplier.mpesa_paybill,
          mpesaAccountNumber: supplier.mpesa_account_number,
          bankName: supplier.bank_name,
          bankAccountNumber: supplier.bank_account_number,
          createdAt: supplier.created_at,
        }))
        
        setSuppliers(convertedSuppliers)
        setFilteredSuppliers(convertedSuppliers)
        
        // Calculate stats
        const total = convertedSuppliers.length
        const active = convertedSuppliers.filter(s => s.status === 'Active').length
        const inactive = convertedSuppliers.filter(s => s.status === 'Inactive').length
        const onboarding = convertedSuppliers.filter(s => s.status === 'Onboarding').length
        const totalContracts = convertedSuppliers.reduce((acc, s) => acc + (s.activeContracts || 0), 0)
        const withBankDetails = convertedSuppliers.filter(s => s.bankName && s.bankAccountNumber).length
        const withMpesaDetails = convertedSuppliers.filter(s => s.mpesaPaybill && s.mpesaAccountNumber).length
        const completeProfiles = convertedSuppliers.filter(s => 
          s.name && 
          s.contactPhone && 
          s.supplierCode &&
          (s.bankName && s.bankAccountNumber) || (s.mpesaPaybill && s.mpesaAccountNumber)
        ).length
        
        setStats({
          total,
          active,
          inactive,
          onboarding,
          totalContracts,
          withBankDetails,
          withMpesaDetails,
          completeProfiles,
        })
      } else {
        throw new Error('Failed to fetch suppliers')
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
      toast({
        title: 'Error',
        description: 'Failed to load suppliers',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchSuppliers()
  }, [])

  // Fetch when date range changes
  useEffect(() => {
    if (!isLoading) {
      fetchSuppliers(dateRange.from, dateRange.to)
    }
  }, [dateRange])

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSuppliers(suppliers)
    } else {
      const query = searchQuery.toLowerCase().trim()
      const filtered = suppliers.filter(supplier => 
        supplier.name.toLowerCase().includes(query) ||
        supplier.contactPhone?.toLowerCase().includes(query) ||
        supplier.contactEmail?.toLowerCase().includes(query) ||
        supplier.location?.toLowerCase().includes(query) ||
        supplier.supplierCode?.toLowerCase().includes(query) ||
        supplier.status.toLowerCase().includes(query)
      )
      setFilteredSuppliers(filtered)
    }
  }, [searchQuery, suppliers])

  const isEditDialogOpen = !!editingSupplier

  // Get existing supplier codes for sequential generation
  const existingSupplierCodes = suppliers.map(s => s.supplierCode)

  // Handle download report
  const handleDownloadReport = async (formatType: 'csv' | 'html') => {
    if (filteredSuppliers.length === 0) {
      toast({
        title: 'No Data',
        description: 'No suppliers found for the selected date range and search criteria.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsGeneratingReport(true)
      
      const params = new URLSearchParams({
        startDate: format(dateRange.from, 'yyyy-MM-dd'),
        endDate: format(dateRange.to, 'yyyy-MM-dd'),
        format: formatType
      })
      
      const url = `/api/suppliers?${params.toString()}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to generate ${formatType.toUpperCase()} report`)
      }
      
      if (formatType === 'html') {
        const html = await response.text()
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
        const urlObj = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = urlObj
        link.setAttribute('download', `suppliers_report_${format(dateRange.from, 'yyyy-MM-dd')}_to_${format(dateRange.to, 'yyyy-MM-dd')}.html`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(urlObj)
      } else {
        const csv = await response.text()
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const urlObj = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = urlObj
        link.setAttribute('download', `suppliers_${format(dateRange.from, 'yyyy-MM-dd')}_to_${format(dateRange.to, 'yyyy-MM-dd')}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(urlObj)
      }
      
      toast({
        title: 'Report Downloaded',
        description: `${formatType.toUpperCase()} report has been downloaded successfully.`,
      })
    } catch (error: any) {
      console.error(`Error downloading ${formatType} report:`, error)
      toast({
        title: 'Error',
        description: error.message || `Failed to download ${formatType.toUpperCase()} report`,
        variant: 'destructive',
      })
    } finally {
      setIsGeneratingReport(false)
    }
  }

  // Handle date range change
  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range)
  }

  // Handle add supplier
  const handleAddSupplier = async (values: SupplierFormValues) => {
    try {
      console.log('🔄 Creating new supplier with locked name-phone combination:', values)
      
      const apiData = {
        name: values.name || '',
        location: values.location || '',
        contact_name: values.contactName || '',
        contact_email: values.contactEmail || '',
        contact_phone: values.contactPhone || '',
        produce_types: values.produceTypes || [],
        status: 'Active',
        supplier_code: values.supplierCode || '',
        kra_pin: values.kraPin || '',
        bank_name: values.bankName || '',
        bank_account_number: values.bankAccountNumber || '',
        mpesa_paybill: values.mpesaPaybill || '',
        mpesa_account_number: values.mpesaAccountNumber || '',
        vehicle_number_plate: values.vehicleNumberPlate || '',
        driver_name: values.driverName || '',
        driver_id_number: values.driverIdNumber || '',
        password: '',
        logo_url: '',
        active_contracts: 0,
      }

      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || responseData.details?.[0] || 'Failed to create supplier')
      }

      await fetchSuppliers()

      toast({
        title: 'Supplier Created',
        description: `${values.name} has been successfully added with locked name-phone combination.`,
      })
      
      setIsCreateDialogOpen(false)
    } catch (error: any) {
      console.error('❌ Error creating supplier:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to create supplier',
        variant: 'destructive',
      })
    }
  }

  // Handle update supplier
  const handleUpdateSupplier = async (values: SupplierFormValues) => {
    if (!editingSupplier) return
    
    try {
      console.log('🔄 Updating supplier:', values)
      
      // Build API data with only non-empty values (partial update)
      const apiData: any = {
        status: editingSupplier.status || 'Active',
      }
      
      // Add fields only if they have values
      if (values.name?.trim()) apiData.name = values.name.trim()
      if (values.location?.trim()) apiData.location = values.location.trim()
      if (values.contactName?.trim()) apiData.contact_name = values.contactName.trim()
      if (values.contactEmail?.trim()) apiData.contact_email = values.contactEmail.trim()
      if (values.contactPhone?.trim()) apiData.contact_phone = values.contactPhone.trim()
      if (values.produceTypes?.length) apiData.produce_types = values.produceTypes
      if (values.supplierCode?.trim()) apiData.supplier_code = values.supplierCode.trim()
      if (values.kraPin?.trim()) apiData.kra_pin = values.kraPin.trim()
      if (values.bankName?.trim()) apiData.bank_name = values.bankName.trim()
      if (values.bankAccountNumber?.trim()) apiData.bank_account_number = values.bankAccountNumber.trim()
      if (values.mpesaPaybill?.trim()) apiData.mpesa_paybill = values.mpesaPaybill.trim()
      if (values.mpesaAccountNumber?.trim()) apiData.mpesa_account_number = values.mpesaAccountNumber.trim()
      if (values.vehicleNumberPlate?.trim()) apiData.vehicle_number_plate = values.vehicleNumberPlate.trim()
      if (values.driverName?.trim()) apiData.driver_name = values.driverName.trim()
      if (values.driverIdNumber?.trim()) apiData.driver_id_number = values.driverIdNumber.trim()

      const response = await fetch(`/api/suppliers?id=${editingSupplier.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || responseData.details?.[0] || 'Failed to update supplier')
      }

      await fetchSuppliers()

      toast({
        title: 'Supplier Updated',
        description: `${values.name || editingSupplier.name}'s details have been updated successfully.`,
      })
      
      setEditingSupplier(null)
    } catch (error: any) {
      console.error('❌ Error updating supplier:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to update supplier',
        variant: 'destructive',
      })
    }
  }

  const openEditDialog = (supplier: Supplier) => {
    setEditingSupplier(supplier)
  }

  const closeEditDialog = () => {
    setEditingSupplier(null)
  }

  const handleDeleteSupplier = (supplier: Supplier) => {
    setSupplierToDelete(supplier)
  }

  const confirmDeleteSupplier = async () => {
    if (!supplierToDelete) return

    try {
      setIsLoadingDelete(true)
      const response = await fetch(`/api/suppliers?id=${supplierToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to delete supplier')
      }

      await fetchSuppliers()

      toast({
        title: 'Supplier Deleted',
        description: `${supplierToDelete.name} has been successfully deleted.`,
      })

      setSupplierToDelete(null)
    } catch (error: any) {
      console.error('Error deleting supplier:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete supplier',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingDelete(false)
    }
  }

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
      case 'Inactive':
        return <Badge variant="destructive">Inactive</Badge>
      case 'Onboarding':
        return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">Onboarding</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Clear search
  const clearSearch = () => {
    setSearchQuery('')
  }

  if (isLoading) {
    return (
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <FreshTraceLogo className="w-8 h-8 text-primary" />
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
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Supplier Management
                </h2>
                <p className="text-muted-foreground">
                  Loading suppliers...
                </p>
              </div>
              <Button disabled>
                <PlusCircle className="mr-2" />
                Add Supplier
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 animate-pulse rounded-lg"></div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <FreshTraceLogo className="w-8 h-8 text-primary" />
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight">
                  Supplier Management
                </h2>
              </div>
              <p className="text-muted-foreground">
                Manage and update your suppliers information
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Date Range Picker */}
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="ml-auto">
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'dd/MM/yy')} - {format(dateRange.to, 'dd/MM/yy')}
                        </>
                      ) : (
                        format(dateRange.from, 'dd/MM/yy')
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        handleDateRangeChange({ from: range.from, to: range.to })
                        setIsDatePickerOpen(false)
                      }
                    }}
                    numberOfMonths={2}
                  />
                  <div className="p-3 border-t">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newRange = {
                            from: subDays(new Date(), 7),
                            to: new Date(),
                          }
                          handleDateRangeChange(newRange)
                          setIsDatePickerOpen(false)
                        }}
                      >
                        Last 7 days
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newRange = {
                            from: subDays(new Date(), 30),
                            to: new Date(),
                          }
                          handleDateRangeChange(newRange)
                          setIsDatePickerOpen(false)
                        }}
                      >
                        Last 30 days
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newRange = {
                            from: startOfDay(new Date()),
                            to: endOfDay(new Date()),
                          }
                          handleDateRangeChange(newRange)
                          setIsDatePickerOpen(false)
                        }}
                      >
                        Today
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newRange = {
                            from: subDays(new Date(), 365),
                            to: new Date(),
                          }
                          handleDateRangeChange(newRange)
                          setIsDatePickerOpen(false)
                        }}
                      >
                        Last Year
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Download Report Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={isGeneratingReport}>
                    {isGeneratingReport ? (
                      <>
                        <span className="mr-2">Generating...</span>
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Download Report
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleDownloadReport('csv')}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Download as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownloadReport('html')}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Download as HTML
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Add Supplier Button */}
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2" />
                    Add Supplier
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Create New Supplier</DialogTitle>
                    <DialogDescription>
                      Add a new supplier to the system. All required fields must be filled in.
                    </DialogDescription>
                  </DialogHeader>
                  <CreateSupplierForm 
                    onSubmit={handleAddSupplier}
                    existingSupplierCodes={existingSupplierCodes}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.active} active • {stats.inactive} inactive
                </p>
                <Progress value={(stats.active / stats.total) * 100 || 0} className="h-2 mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
                <FileCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalContracts}</div>
                <p className="text-xs text-muted-foreground">
                  Across all suppliers
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bank Details</CardTitle>
                <Banknote className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.withBankDetails}</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((stats.withBankDetails / stats.total) * 100) || 0}% of suppliers
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">M-PESA Details</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.withMpesaDetails}</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((stats.withMpesaDetails / stats.total) * 100) || 0}% of suppliers
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Report Summary */}
          <div className="mb-6 p-4 bg-muted/50 border rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">Report Summary</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Showing suppliers registered from {format(dateRange.from, 'dd/MM/yyyy')} to {format(dateRange.to, 'dd/MM/yyyy')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {filteredSuppliers.length} supplier(s) found • {stats.completeProfiles} complete profiles
                </p>
              </div>
              <div className="text-right">
                <div className="flex flex-col gap-1">
                  <p className="text-sm">
                    <span className="font-medium">Active:</span> {stats.active}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Contracts:</span> {stats.totalContracts}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Profile Completion:</span> {Math.round((stats.completeProfiles / stats.total) * 100) || 0}%
                  </p>
                </div>
              </div>
            </div>
            <Separator className="my-3" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="font-medium">Payment Methods</p>
                <p className="text-muted-foreground">
                  Bank: {stats.withBankDetails} • M-PESA: {stats.withMpesaDetails}
                </p>
              </div>
              <div>
                <p className="font-medium">Status Distribution</p>
                <p className="text-muted-foreground">
                  Active: {stats.active} • Inactive: {stats.inactive} • Onboarding: {stats.onboarding}
                </p>
              </div>
              <div>
                <p className="font-medium">Date Range</p>
                <p className="text-muted-foreground">
                  {format(dateRange.from, 'MMM dd, yyyy')} - {format(dateRange.to, 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
          </div>

          {/* Supplier Table - Simplified with Search, Edit and Delete buttons */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">All Suppliers</h3>
                <p className="text-sm text-muted-foreground">
                  Overview of all produce suppliers. Click a row for more details.
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                Showing {filteredSuppliers.length} supplier{filteredSuppliers.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search suppliers by name, phone, email, location, code, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                  onClick={clearSearch}
                >
                  <span className="sr-only">Clear search</span>
                  <span className="text-muted-foreground hover:text-foreground">✕</span>
                </Button>
              )}
            </div>
            
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier Name</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSuppliers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          {searchQuery ? (
                            <div className="flex flex-col items-center gap-2">
                              <Search className="h-8 w-8 text-muted-foreground/50" />
                              <p>No suppliers found matching "{searchQuery}"</p>
                              <Button variant="link" onClick={clearSearch} className="text-sm">
                                Clear search
                              </Button>
                            </div>
                          ) : (
                            'No suppliers found for the selected date range'
                          )}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSuppliers.map((supplier) => (
                        <TableRow 
                          key={supplier.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => openEditDialog(supplier)}
                        >
                          <TableCell className="font-medium">{supplier.name}</TableCell>
                          <TableCell>{supplier.contactPhone || 'N/A'}</TableCell>
                          <TableCell>{getStatusBadge(supplier.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => openEditDialog(supplier)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteSupplier(supplier)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => !open && closeEditDialog()}>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Edit Supplier</DialogTitle>
              <DialogDescription>
                Update supplier details. Fill in only the fields you want to change.
              </DialogDescription>
            </DialogHeader>
            <CreateSupplierForm
              supplier={editingSupplier}
              onSubmit={handleUpdateSupplier}
              existingSupplierCodes={existingSupplierCodes.filter(code => code !== editingSupplier?.supplierCode)}
              isEditing={true}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!supplierToDelete} onOpenChange={(open) => !open && setSupplierToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{supplierToDelete?.name}</strong>? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex justify-end gap-2">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteSupplier}
                disabled={isLoadingDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isLoadingDelete ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarInset>
    </SidebarProvider>
  )
}