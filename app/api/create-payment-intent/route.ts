import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'
import { createPaymentIntent, createStripeCustomer, PRICING_PLANS, PricingPlan } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const { plan, userId } = await req.json()

    if (!plan || !userId) {
      return NextResponse.json({ error: 'Missing plan or userId' }, { status: 400 })
    }

    if (!(plan in PRICING_PLANS)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const supabase = createSupabaseClient()
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create or get Stripe customer
    let customerId = profile.stripe_customer_id
    
    if (!customerId) {
      const customer = await createStripeCustomer(
        profile.email,
        profile.full_name || undefined
      )
      customerId = customer.id

      // Update profile with Stripe customer ID
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)
    }

    const selectedPlan = PRICING_PLANS[plan as PricingPlan]

    // Create payment intent
    const paymentIntent = await createPaymentIntent(
      selectedPlan.price,
      selectedPlan.currency,
      customerId,
      {
        user_id: userId,
        subscription_type: plan,
        plan_name: selectedPlan.name,
      }
    )

    // Create payment record
    await supabase
      .from('payments')
      .insert({
        user_id: userId,
        stripe_payment_intent_id: paymentIntent.id,
        stripe_customer_id: customerId,
        subscription_type: plan,
        amount: selectedPlan.price,
        currency: selectedPlan.currency,
        status: 'pending',
      })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    console.error('Payment intent creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}