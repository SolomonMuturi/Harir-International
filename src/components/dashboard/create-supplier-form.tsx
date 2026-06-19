'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Supplier, SupplierFormValues } from '@/lib/data'
import { useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// Schema with flexible validation for create and edit modes
const formSchema = z.object({
  // Fields that can be optional during edit
  name: z.string()
    .min(2, "Supplier name must be at least 2 characters.")
    .max(100, "Supplier name must be less than 100 characters.")
    .regex(/^[a-zA-Z0-9\s&.-]+$/, "Name can only contain letters, numbers, spaces, &, ., and -")
    .optional()
    .or(z.literal('')),
  
  supplierCode: z.string()
    .min(3, "Supplier code must be 3-20 characters.")
    .max(20, "Supplier code must be less than 20 characters.")
    .regex(/^[A-Z0-9-]+$/, "Supplier code can only contain uppercase letters, numbers, and hyphens")
    .optional()
    .or(z.literal('')),
  
  contactPhone: z.string()
    .min(10, "A valid 10-digit phone number is required.")
    .max(20, "Phone number must be less than 20 digits.")
    .regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number format")
    .optional()
    .or(z.literal('')),
  
  // Optional fields
  location: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email("Invalid email format").optional().or(z.literal('')),
  produceType: z.enum(['Fuerte', 'Hass', 'FuerteHass']).optional(),
  kraPin: z.string()
    .regex(/^[A-Z]{1}\d{9}[A-Z]{1}$/, "Invalid KRA PIN format. Should be like A123456789B")
    .optional()
    .or(z.literal('')),
  
  // Payment details - conditional validation
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  mpesaPaybill: z.string().optional(),
  mpesaAccountNumber: z.string().optional(),
  
  // Vehicle details
  vehicleNumberPlate: z.string().optional(),
  driverName: z.string().optional(),
  driverIdNumber: z.string().optional(),
})
.refine(
  (data) => {
    // If M-PESA paybill is provided, account number is required
    if (data.mpesaPaybill && !data.mpesaAccountNumber) return false
    return true
  },
  {
    message: "M-PESA account number is required when paybill is provided",
    path: ["mpesaAccountNumber"]
  }
)
.refine(
  (data) => {
    // If M-PESA account number is provided, paybill is required
    if (data.mpesaAccountNumber && !data.mpesaPaybill) return false
    return true
  },
  {
    message: "M-PESA paybill is required when account number is provided",
    path: ["mpesaPaybill"]
  }
)
.refine(
  (data) => {
    // If bank name is provided, account number is required
    if (data.bankName && !data.bankAccountNumber) return false
    return true
  },
  {
    message: "Bank account number is required when bank name is provided",
    path: ["bankAccountNumber"]
  }
)
.refine(
  (data) => {
    // If bank account number is provided, bank name is required
    if (data.bankAccountNumber && !data.bankName) return false
    return true
  },
  {
    message: "Bank name is required when bank account number is provided",
    path: ["bankName"]
  }
)

interface CreateSupplierFormProps {
  supplier?: Supplier | null
  onSubmit: (values: SupplierFormValues) => void
  existingSupplierCodes?: string[]
  isEditing?: boolean
}

const OptionalLabel = ({ children }: { children: React.ReactNode }) => (
  <FormLabel>
    {children} <span className="text-muted-foreground text-xs">(Optional)</span>
  </FormLabel>
)

// Function to format phone number
const formatPhoneNumber = (phone: string): string => {
  if (!phone) return ''
  
  const cleaned = phone.replace(/[^\d+]/g, '')
  
  if (cleaned.startsWith('+')) {
    return cleaned
  }
  
  if (cleaned.startsWith('0')) {
    return '+254' + cleaned.slice(1)
  }
  
  if (cleaned.length === 9) {
    return '+254' + cleaned
  }
  
  if (cleaned.length === 10 && cleaned.startsWith('07')) {
    return '+254' + cleaned.slice(1)
  }
  
  return cleaned.startsWith('+') ? cleaned : '+' + cleaned
}

// Function to validate phone number
const validatePhoneNumber = (phone: string): { isValid: boolean; message: string; formatted: string } => {
  const formatted = formatPhoneNumber(phone)
  const cleanPhone = formatted.replace(/[^\d+]/g, '')
  
  if (cleanPhone.length < 10) {
    return { isValid: false, message: "Phone number must be at least 10 digits", formatted }
  }
  
  if (cleanPhone.length > 15) {
    return { isValid: false, message: "Phone number must be less than 15 digits", formatted }
  }
  
  if (!/^\+?[\d\s\-\(\)]+$/.test(formatted)) {
    return { isValid: false, message: "Invalid phone number format", formatted }
  }
  
  return { isValid: true, message: "Valid phone number", formatted }
}

export function CreateSupplierForm({ supplier, onSubmit, existingSupplierCodes = [], isEditing = false }: CreateSupplierFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [phoneValidation, setPhoneValidation] = useState<{ isValid: boolean; message: string; formatted: string } | null>(null)
  const { toast } = useToast()
  
  const generateSupplierCode = () => {
    const prefix = 'SUP'
    
    if (isEditing && supplier?.supplierCode) {
      return supplier.supplierCode
    }
    
    if (existingSupplierCodes.length > 0) {
      const numbers = existingSupplierCodes
        .filter(code => code.startsWith(prefix))
        .map(code => {
          const numStr = code.replace(prefix, '')
          const num = parseInt(numStr, 10)
          return isNaN(num) ? 0 : num
        })
        .filter(num => num > 0)
      
      const highestNumber = numbers.length > 0 ? Math.max(...numbers) : 0
      const nextNumber = highestNumber + 1
      const paddedNumber = nextNumber.toString().padStart(4, '0')
      return `${prefix}${paddedNumber}`
    }
    
    return 'SUP0001'
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      location: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      produceType: 'Fuerte',
      kraPin: '',
      supplierCode: generateSupplierCode(),
      bankName: '',
      bankAccountNumber: '',
      mpesaPaybill: '',
      mpesaAccountNumber: '',
      vehicleNumberPlate: '',
      driverName: '',
      driverIdNumber: '',
    },
  })

  useEffect(() => {
    if (!isEditing) {
      const newCode = generateSupplierCode()
      form.setValue('supplierCode', newCode)
    }
  }, [existingSupplierCodes])

  useEffect(() => {
    if (isEditing && supplier) {
      form.reset({
        name: supplier.name || '',
        location: supplier.location || '',
        contactName: supplier.contactName || '',
        contactPhone: supplier.contactPhone || '',
        contactEmail: supplier.contactEmail || '',
        produceType: (supplier.produceTypes?.[0] === 'Fuert' ? 'Fuerte' : supplier.produceTypes?.[0] as 'Fuerte' | 'Hass' | 'FuerteHass') || 'Fuerte',
        kraPin: supplier.kraPin || '',
        supplierCode: supplier.supplierCode || generateSupplierCode(),
        bankName: supplier.bankName || '',
        bankAccountNumber: supplier.bankAccountNumber || '',
        mpesaPaybill: supplier.mpesaPaybill || '',
        mpesaAccountNumber: supplier.mpesaAccountNumber || '',
        vehicleNumberPlate: supplier.vehicleNumberPlate || '',
        driverName: supplier.driverName || '',
        driverIdNumber: supplier.driverIdNumber || '',
      })
    }
  }, [supplier, isEditing, form])

  const handlePhoneChange = (value: string) => {
    const validation = validatePhoneNumber(value)
    setPhoneValidation(validation)
    form.setValue('contactPhone', value, { shouldValidate: true })
  }

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true)
      
      console.log('📝 Form values before transformation:', values)

      // Validate required fields for creation mode
      if (!isEditing) {
        if (!values.name?.trim()) {
          toast({
            title: 'Required Field',
            description: 'Supplier name is required',
            variant: 'destructive',
          })
          return
        }
        if (!values.contactPhone?.trim()) {
          toast({
            title: 'Required Field',
            description: 'Contact phone is required',
            variant: 'destructive',
          })
          return
        }
        if (!values.supplierCode?.trim()) {
          toast({
            title: 'Required Field',
            description: 'Supplier code is required',
            variant: 'destructive',
          })
          return
        }
      }

      // Validate phone number only if provided
      if (values.contactPhone?.trim()) {
        const phoneValidation = validatePhoneNumber(values.contactPhone)
        if (!phoneValidation.isValid) {
          toast({
            title: 'Invalid Phone Number',
            description: phoneValidation.message,
            variant: 'destructive',
          })
          return
        }
      }

      // Check for duplicate supplier code during creation
      if (!isEditing) {
        const isDuplicateCode = existingSupplierCodes.includes(values.supplierCode)
        if (isDuplicateCode) {
          toast({
            title: 'Duplicate Supplier Code',
            description: `Supplier code "${values.supplierCode}" already exists. Please use a different code.`,
            variant: 'destructive',
          })
          return
        }
      }

      const phoneValidation = validatePhoneNumber(values.contactPhone || '')
      
      const finalValues: SupplierFormValues = {
        name: values.name?.trim() || '',
        contactPhone: values.contactPhone?.trim() ? phoneValidation.formatted : '',
        supplierCode: values.supplierCode?.trim() || '',
        
        // Optional fields
        contactName: values.contactName?.trim() || '',
        status: 'Active',
        location: values.location?.trim() || '',
        contactEmail: values.contactEmail?.trim() || '',
        produceTypes: values.produceType ? [values.produceType] : ['Fuerte'],
        kraPin: values.kraPin?.trim() || '',
        
        // Payment details
        bankName: values.bankName?.trim() || '',
        bankAccountNumber: values.bankAccountNumber?.trim() || '',
        mpesaPaybill: values.mpesaPaybill?.trim() || '',
        mpesaAccountNumber: values.mpesaAccountNumber?.trim() || '',
        
        // Vehicle details
        vehicleNumberPlate: values.vehicleNumberPlate?.trim() || '',
        driverName: values.driverName?.trim() || '',
        driverIdNumber: values.driverIdNumber?.trim() || '',
      }

      console.log('📤 Calling parent onSubmit with final values:', finalValues)
      await onSubmit(finalValues)

    } catch (error) {
      console.error('❌ Error in form submission:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit form. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Edit Mode Alert */}
        {isEditing && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <span className="font-semibold">Note:</span> Fill in only the fields you want to update. Leave fields blank to keep their current values.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {/* Left Column - Supplier Details */}
          <div className="space-y-6">
            <div>
              <h3 className="text-md font-medium mb-4">Supplier Details</h3>
              <div className="space-y-4">
                {/* Name Field */}
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isEditing ? "Supplier Name" : "Supplier Name"}  {!isEditing && <span className="text-destructive">*</span>}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter supplier name" 
                        {...field} 
                      />
                    </FormControl>
                    {isEditing && <FormDescription>Leave blank to keep current name</FormDescription>}
                    <FormMessage />
                  </FormItem>
                )} />
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Supplier Code */}
                  <FormField control={form.control} name="supplierCode" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isEditing ? "Supplier Code" : "Supplier Code"}  {!isEditing && <span className="text-destructive">*</span>}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="" 
                          {...field} 
                          readOnly={isEditing}
                          className={isEditing ? "bg-muted" : "bg-muted"}
                        />
                      </FormControl>
                      <FormDescription>
                        {isEditing ? "Cannot be changed" : "Auto-generated"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  {/* KRA PIN */}
                  <FormField control={form.control} name="kraPin" render={({ field }) => (
                    <FormItem>
                      <OptionalLabel>KRA PIN</OptionalLabel>
                      <FormControl>
                        <Input placeholder="A123456789B" {...field} />
                      </FormControl>
                      <FormDescription>
                        Format: A123456789B
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                
                {/* Location */}
                <FormField control={form.control} name="location" render={({ field }) => (
                  <FormItem>
                    <OptionalLabel>Location</OptionalLabel>
                    <FormControl>
                      <Input placeholder="Enter location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Contact Name */}
                  <FormField control={form.control} name="contactName" render={({ field }) => (
                    <FormItem>
                      <OptionalLabel>Primary Contact Name</OptionalLabel>
                      <FormControl>
                        <Input placeholder="Enter contact name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  {/* Contact Phone */}
                  <FormField control={form.control} name="contactPhone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone {!isEditing && <span className="text-destructive">*</span>}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="tel" 
                            placeholder="0712345678" 
                            {...field}
                            onChange={(e) => handlePhoneChange(e.target.value)}
                            className="pr-10"
                          />
                          {phoneValidation && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              {phoneValidation.isValid ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      {phoneValidation && (
                        <FormDescription className={phoneValidation.isValid ? "text-green-600" : "text-red-600"}>
                          {phoneValidation.message}
                        </FormDescription>
                      )}
                      {isEditing && <FormDescription>Leave blank to keep current phone</FormDescription>}
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                
                {/* Contact Email */}
                <FormField control={form.control} name="contactEmail" render={({ field }) => (
                  <FormItem>
                    <OptionalLabel>Contact Email</OptionalLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                
                {/* Produce Type */}
                <FormField control={form.control} name="produceType" render={({ field }) => (
                  <FormItem>
                    <OptionalLabel>Produce Type</OptionalLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select produce type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Fuerte">Fuerte Avocados</SelectItem>
                        <SelectItem value="Hass">Hass Avocados</SelectItem>
                        <SelectItem value="FuerteHass">Fuerte and Hass Avocados</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>
            
            {/* Vehicle Details */}
            <div>
              <h3 className="text-md font-medium mb-4">Vehicle Details (Optional)</h3>
              <div className="space-y-4">
                <FormField control={form.control} name="vehicleNumberPlate" render={({ field }) => (
                  <FormItem>
                    <OptionalLabel>Vehicle Number Plate</OptionalLabel>
                    <FormControl>
                      <Input placeholder="KAA 123A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="driverName" render={({ field }) => (
                    <FormItem>
                      <OptionalLabel>Driver Name</OptionalLabel>
                      <FormControl>
                        <Input placeholder="Enter driver name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="driverIdNumber" render={({ field }) => (
                    <FormItem>
                      <OptionalLabel>Driver ID Number</OptionalLabel>
                      <FormControl>
                        <Input placeholder="Enter ID number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Payment Details */}
          <div className="space-y-6">
            <div>
              <h3 className="text-md font-medium mb-4">Payment Details</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Provide at least one payment method.
              </p>
              
              {/* Bank Details Section */}
              <div className="space-y-4 mb-6 p-4 border rounded-md">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Bank Details</h4>
                </div>
                <div className="space-y-3">
                  <FormField control={form.control} name="bankName" render={({ field }) => (
                    <FormItem>
                      <OptionalLabel>Bank Name</OptionalLabel>
                      <FormControl>
                        <Input placeholder="e.g., Equity Bank, KCB" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="bankAccountNumber" render={({ field }) => (
                    <FormItem>
                      <OptionalLabel>Account Number</OptionalLabel>
                      <FormControl>
                        <Input placeholder="e.g., 1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>
              
              {/* OR Separator */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">OR</span>
                </div>
              </div>
              
              {/* M-Pesa Details Section */}
              <div className="space-y-4 p-4 border rounded-md">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">M-Pesa Details</h4>
                </div>
                <div className="space-y-3">
                  <FormField control={form.control} name="mpesaPaybill" render={({ field }) => (
                    <FormItem>
                      <OptionalLabel>M-Pesa Paybill/Business Number</OptionalLabel>
                      <FormControl>
                        <Input placeholder="e.g., 123456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="mpesaAccountNumber" render={({ field }) => (
                    <FormItem>
                      <OptionalLabel>M-Pesa Account Number</OptionalLabel>
                      <FormControl>
                        <Input placeholder="e.g., Supplier Name or Account Number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>
              
              {/* Payment Summary */}
              {!isEditing && (
                <Alert className="mt-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <span className="font-semibold">Note:</span> Provide at least one payment method to complete supplier setup.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>
        
        {/* Form Submission */}
        <div className="flex justify-end items-center pt-4 border-t">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Supplier'}
          </Button>
        </div>
      </form>
    </Form>
  )
}