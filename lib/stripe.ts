import Stripe from 'stripe'
import { loadStripe } from '@stripe/stripe-js'

// Server-side Stripe instance
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    })
  : null

// Client-side Stripe instance
export const getStripe = () => {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    console.warn('Stripe publishable key not found')
    return null
  }
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
}

// Pricing configuration
export const PRICING_PLANS = {
  job_hunt_2w: {
    name: '2-Week Job Hunt',
    price: 999, // $9.99 in cents
    currency: 'usd',
    interval: null, // One-time payment
    features: {
      resumes: 10,
      ats_analyses: 25,
      edit_enabled: true,
    },
    duration_days: 14,
  },
  premium_1m: {
    name: '1-Month Premium',
    price: 1999, // $19.99 in cents
    currency: 'usd',
    interval: null, // One-time payment
    features: {
      resumes: 25,
      ats_analyses: 50,
      edit_enabled: true,
    },
    duration_days: 30,
  },
  job_seeker_3m: {
    name: '3-Month Job Seeker',
    price: 4999, // $49.99 in cents (17% discount)
    currency: 'usd',
    interval: null, // One-time payment
    features: {
      resumes: 75,
      ats_analyses: 150,
      edit_enabled: true,
    },
    duration_days: 90,
  },
} as const

export type PricingPlan = keyof typeof PRICING_PLANS

// Helper to format price for display
export const formatPrice = (price: number, currency: string = 'usd') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(price / 100)
}

// Helper to create Stripe customer
export const createStripeCustomer = async (email: string, name?: string) => {
  return await stripe.customers.create({
    email,
    ...(name && { name }),
  })
}

// Helper to create payment intent
export const createPaymentIntent = async (
  amount: number,
  currency: string = 'usd',
  customerId?: string,
  metadata?: Record<string, string>
) => {
  return await stripe.paymentIntents.create({
    amount,
    currency,
    ...(customerId && { customer: customerId }),
    automatic_payment_methods: {
      enabled: true,
    },
    ...(metadata && { metadata }),
  })
}