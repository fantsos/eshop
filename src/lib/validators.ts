import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const addressSchema = z.object({
  name: z.string().min(2).max(100),
  street: z.string().min(3).max(200),
  city: z.string().min(2).max(100),
  state: z.string().max(100).optional(),
  zip: z.string().min(2).max(20),
  country: z.string().default("GR"),
  phone: z.string().optional(),
  isDefault: z.boolean().default(false),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  comment: z.string().max(2000).optional(),
});

export const productSchema = z.object({
  nameEl: z.string().min(1).max(300),
  nameEn: z.string().min(1).max(300),
  sku: z.string().min(1).max(50),
  descriptionEl: z.string().optional(),
  descriptionEn: z.string().optional(),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  brand: z.string().optional(),
  stock: z.number().int().min(0).default(0),
  weight: z.number().optional().nullable(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

export const couponSchema = z.object({
  code: z.string().min(3).max(50),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.number().positive(),
  minOrder: z.number().positive().optional().nullable(),
  maxUses: z.number().int().positive().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type CouponInput = z.infer<typeof couponSchema>;
