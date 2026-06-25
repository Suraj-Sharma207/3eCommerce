import { z } from 'zod';

export const addressSchema = z.object({
  body: z.object({
    recipientName: z.string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must not exceed 100 characters')
      .regex(/^[A-Za-z\s'\-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
    
    phoneNumber: z.string()
      .trim()
      .regex(/^[+\-\s0-9]{7,15}$/, 'Invalid phone number format'),
      
    label: z.enum(['Home', 'Work', 'Other'], {
      errorMap: () => ({ message: 'Label must be Home, Work, or Other' })
    }),
    
    street: z.string()
      .trim()
      .min(5, 'Address Line 1 must be at least 5 characters')
      .max(200, 'Address Line 1 must not exceed 200 characters')
      .refine(val => val.trim().length > 0, 'Address Line 1 cannot be only spaces'),
      
    addressLine2: z.string().trim().max(200, 'Address Line 2 must not exceed 200 characters').optional().nullable(),
    landmark: z.string().trim().max(100, 'Landmark must not exceed 100 characters').optional().nullable(),
    
    city: z.string()
      .trim()
      .min(2, 'City must be at least 2 characters')
      .max(80, 'City must not exceed 80 characters')
      .regex(/^[A-Za-z\s]+$/, 'City can only contain letters and spaces'),
      
    state: z.string()
      .trim()
      .min(2, 'State must be at least 2 characters')
      .max(80, 'State must not exceed 80 characters')
      .regex(/^[A-Za-z\s]+$/, 'State can only contain letters and spaces'),
      
    country: z.string()
      .trim()
      .min(2, 'Country must be at least 2 characters')
      .max(100, 'Country must not exceed 100 characters'),
      
    zipCode: z.string().trim().min(1, 'Postal Code is required').max(20, 'Postal Code must not exceed 20 characters'),
    
    isDefaultShipping: z.boolean().optional(),
    isDefaultBilling: z.boolean().optional(),
  }).superRefine((data, ctx) => {
    if (data.country === 'India') {
      if (!/^\d{6}$/.test(data.zipCode)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'India postal code must be exactly 6 digits',
          path: ['zipCode']
        });
      }
    }
  })
});
