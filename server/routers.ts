import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { hashPassword, verifyPassword, generateToken } from "./auth";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    
    register: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(2),
      }))
      .mutation(async ({ input, ctx }) => {
        // Check if user already exists
        const existingUser = await db.getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({ 
            code: 'CONFLICT', 
            message: 'Este e-mail já está cadastrado' 
          });
        }
        
        // Hash password
        const passwordHash = await hashPassword(input.password);
        
        // Create user
        const user = await db.createUser({
          email: input.email,
          passwordHash,
          name: input.name,
          role: 'user', // Default role
        });
        
        // Generate JWT token
        const token = generateToken({
          id: user.id,
          email: user.email || '',
          name: user.name || '',
          role: user.role,
        });
        
        // Set session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
        
        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        };
      }),
    
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Find user by email
        const user = await db.getUserByEmail(input.email);
        if (!user) {
          throw new TRPCError({ 
            code: 'UNAUTHORIZED', 
            message: 'E-mail ou senha incorretos' 
          });
        }
        
        // Verify password
        const isValid = await verifyPassword(input.password, user.passwordHash || '');
        if (!isValid) {
          throw new TRPCError({ 
            code: 'UNAUTHORIZED', 
            message: 'E-mail ou senha incorretos' 
          });
        }
        
        // Generate JWT token
        const token = generateToken({
          id: user.id,
          email: user.email || '',
          name: user.name || '',
          role: user.role,
        });
        
        // Set session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
        
        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        };
      }),
  }),
  
  subscription: router({
    // Get current user's subscription
    getMine: protectedProcedure.query(async ({ ctx }) => {
      const subscription = await db.getUserSubscription(ctx.user.id);
      return subscription;
    }),
    
    // Create a new Pix payment
    createPixPayment: protectedProcedure
      .input(z.object({
        planType: z.enum(['monthly', 'yearly']),
      }))
      .mutation(async ({ input, ctx }) => {
        // Check if user already has an active subscription
        const existingSubscription = await db.getUserSubscription(ctx.user.id);
        if (existingSubscription && existingSubscription.status === 'active') {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: 'Você já possui uma assinatura ativa' 
          });
        }
        
        // Get Mercado Pago access token from env
        const mpAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
        if (!mpAccessToken) {
          throw new TRPCError({ 
            code: 'INTERNAL_SERVER_ERROR', 
            message: 'Mercado Pago não configurado' 
          });
        }
        
        // Calculate amount based on plan type
        const amount = input.planType === 'monthly' ? 97.00 : 970.00;
        
        // Create payment via Mercado Pago API
        const paymentData = {
          transaction_amount: amount,
          description: `Assinatura ${input.planType === 'monthly' ? 'Mensal' : 'Anual'} - Plataforma Lia Vasconcelos`,
          payment_method_id: 'pix',
          payer: {
            email: ctx.user.email,
            first_name: ctx.user.name,
          },
        };
        
        const response = await fetch('https://api.mercadopago.com/v1/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mpAccessToken}`,
          },
          body: JSON.stringify(paymentData),
        });
        
        if (!response.ok) {
          const error = await response.text();
          console.error('Mercado Pago error:', error);
          throw new TRPCError({ 
            code: 'INTERNAL_SERVER_ERROR', 
            message: 'Erro ao criar pagamento' 
          });
        }
        
        const payment = await response.json();
        
        // Calculate expiration date (30 days for monthly, 365 for yearly)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (input.planType === 'monthly' ? 30 : 365));
        
        // Create subscription record
        const subscription = await db.createSubscription({
          userId: ctx.user.id,
          status: 'pending',
          planType: input.planType,
          amount: Math.round(amount * 100), // Store in cents
          paymentId: payment.id.toString(),
          pixCode: payment.point_of_interaction?.transaction_data?.qr_code || '',
          pixQrCode: payment.point_of_interaction?.transaction_data?.qr_code_base64 || '',
          expiresAt,
        });
        
        return {
          subscriptionId: subscription.id,
          pixCode: subscription.pixCode || '',
          pixQrCodeBase64: subscription.pixQrCode || '',
          amount,
          expiresAt: subscription.expiresAt,
        };
      }),
    
    // Webhook to receive payment confirmation from Mercado Pago
    // This should be called by Mercado Pago when payment is confirmed
    handleWebhook: publicProcedure
      .input(z.object({
        action: z.string(),
        data: z.object({
          id: z.string(),
        }),
      }))
      .mutation(async ({ input }) => {
        // Only process payment updates
        if (input.action !== 'payment.updated' && input.action !== 'payment.created') {
          return { success: true };
        }
        
        const mpAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
        if (!mpAccessToken) {
          throw new TRPCError({ 
            code: 'INTERNAL_SERVER_ERROR', 
            message: 'Mercado Pago não configurado' 
          });
        }
        
        // Get payment details from Mercado Pago
        const response = await fetch(`https://api.mercadopago.com/v1/payments/${input.data.id}`, {
          headers: {
            'Authorization': `Bearer ${mpAccessToken}`,
          },
        });
        
        if (!response.ok) {
          throw new TRPCError({ 
            code: 'INTERNAL_SERVER_ERROR', 
            message: 'Erro ao buscar pagamento' 
          });
        }
        
        const payment = await response.json();
        
        // Update subscription status if payment is approved
        if (payment.status === 'approved') {
          await db.updateSubscriptionByPaymentId(payment.id.toString(), 'active');
        }
        
        return { success: true };
      }),
  }),
  
  content: router({
    // List all content (public content for everyone, all content for logged users with active subscription)
    list: publicProcedure.query(async ({ ctx }) => {
      // If user is not logged in, return only public content
      if (!ctx.user) {
        return db.getPublicContent();
      }
      
      // If user is admin, return all content
      if (ctx.user.role === 'admin') {
        return db.getAllContent();
      }
      
      // Check if user has active subscription
      const subscription = await db.getUserSubscription(ctx.user.id);
      const hasActiveSubscription = subscription && subscription.status === 'active';
      
      // If user has active subscription, return all content
      if (hasActiveSubscription) {
        return db.getAllContent();
      }
      
      // Otherwise, return only public content
      return db.getPublicContent();
    }),
    
    // Get single content item
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const content = await db.getContentById(input.id);
        
        if (!content) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Conteúdo não encontrado' });
        }
        
        // If content is public, return it
        if (content.isPublic) {
          return content;
        }
        
        // If user is not logged in, deny access
        if (!ctx.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Login necessário' });
        }
        
        // If user is admin, return content
        if (ctx.user.role === 'admin') {
          return content;
        }
        
        // Check if user has active subscription
        const subscription = await db.getUserSubscription(ctx.user.id);
        const hasActiveSubscription = subscription && subscription.status === 'active';
        
        if (!hasActiveSubscription) {
          throw new TRPCError({ 
            code: 'FORBIDDEN', 
            message: 'Assinatura ativa necessária para acessar este conteúdo' 
          });
        }
        
        return content;
      }),
  }),
  
  admin: router({
    // Create new content
    createContent: adminProcedure
      .input(z.object({
        title: z.string(),
        description: z.string(),
        url: z.string(),
        type: z.enum(['video', 'document', 'image', 'other']),
        isPublic: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        const content = await db.createContent(input);
        return content;
      }),
    
    // Update content
    updateContent: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        url: z.string().optional(),
        type: z.enum(['video', 'document', 'image', 'other']).optional(),
        isPublic: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateContent(id, data);
        return { success: true };
      }),
    
    // Delete content
    deleteContent: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteContent(input.id);
        return { success: true };
      }),
    
    // List all users
    listUsers: adminProcedure.query(async () => {
      return db.getAllUsers();
    }),
    
    // List all subscriptions
    listSubscriptions: adminProcedure.query(async () => {
      return db.getAllSubscriptions();
    }),
  }),
});

export type AppRouter = typeof appRouter;
