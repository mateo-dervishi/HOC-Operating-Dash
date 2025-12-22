# Newsletter Integration Guide

This guide explains how to connect the newsletter signup form on the main House of Clarence website to the Supabase database.

## Prerequisites

1. Supabase project with the `newsletter_subscribers` table (created via migration `002_lead_source_tracking.sql`)
2. Environment variables configured on the main website

## Environment Variables

Add these to your main website's `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://cjfgkfubyebrlzzrlvtf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## API Route

Create this file at `app/api/newsletter/route.ts` on the main website:

```typescript
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { email, utm_source, utm_medium, utm_campaign } = await request.json();

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if already subscribed
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id, is_active')
      .eq('email', normalizedEmail)
      .single();

    if (existing) {
      if (existing.is_active) {
        return NextResponse.json(
          { message: 'Already subscribed' },
          { status: 200 }
        );
      } else {
        // Reactivate subscription
        await supabase
          .from('newsletter_subscribers')
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .eq('id', existing.id);

        return NextResponse.json(
          { message: 'Subscription reactivated' },
          { status: 200 }
        );
      }
    }

    // Insert new subscriber
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email: normalizedEmail,
        source: 'website_newsletter',
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
      });

    if (error) {
      console.error('Newsletter signup error:', error);
      return NextResponse.json(
        { error: 'Failed to subscribe' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Successfully subscribed' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Newsletter API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Newsletter Form Component

Update your newsletter form component to call this API:

```tsx
'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          utm_source: searchParams.get('utm_source'),
          utm_medium: searchParams.get('utm_medium'),
          utm_campaign: searchParams.get('utm_campaign'),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Thank you for subscribing!');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Failed to subscribe. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white"
          disabled={status === 'loading'}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-6 py-3 bg-white text-black rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50"
        >
          {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
        </button>
      </div>
      
      {message && (
        <p className={`text-sm ${status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
          {message}
        </p>
      )}
    </form>
  );
}
```

## UTM Tracking

The system automatically captures UTM parameters from the URL. Example URLs:

- `https://house-of-clarence.uk/?utm_source=instagram&utm_medium=social&utm_campaign=winter_launch`
- `https://house-of-clarence.uk/?utm_source=google&utm_medium=cpc`

These parameters are stored with each subscriber and visible in the dashboard.

## Automatic Account Linking

When a newsletter subscriber creates an account, the system automatically:

1. Detects the matching email
2. Marks them as `converted_to_account = true`
3. Links their `profile_id` to the subscriber record
4. Records the conversion timestamp

This happens via a database trigger defined in the migration.

## Dashboard Integration

Newsletter subscribers appear in the Operations Dashboard:

1. **Lead Sources panel** - Shows breakdown of leads by source
2. **Newsletter Only section** - Shows subscribers who haven't created accounts
3. **Conversion tracking** - Shows newsletter → account conversion rate

## Testing

1. Visit your website with UTM parameters: `?utm_source=test&utm_campaign=debug`
2. Submit the newsletter form
3. Check Supabase `newsletter_subscribers` table
4. Verify in dashboard under Lead Sources

