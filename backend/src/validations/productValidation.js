import { z } from 'zod';

export const productSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    price: z.number().positive('Price must be greater than 0'),
    stock: z.number().int().nonnegative('Stock cannot be negative'),
    imageUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  }),
});
