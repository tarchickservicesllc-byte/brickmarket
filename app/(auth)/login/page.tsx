import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirectTo?: string }>
}) {
  const params = await searchParams
  const errorMsg = params.error === 'invalid' ? 'Incorrect email or password.' : params.error === 'server' ? 'Something went wrong. Try again.' : null

  async function loginAction(formData: FormData) {
    'use server'
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      redirect('/login?error=invalid')
    }
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-brick">🧱 BrickMarket</Link>
          <p className="mt-2 text-gray-500">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-4">
          {errorMsg && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{errorMsg}</div>
          )}
          <form action={loginAction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brick/30 text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brick/30 text-sm"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-brick hover:bg-brick-dark text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              Sign in
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-brick font-medium hover:underline">Sign up free</Link>
        </p>
      </div>
    </div>
  )
}
