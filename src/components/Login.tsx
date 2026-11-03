import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { supabase } from '../lib/supabase'
import Panel from './ui/Panel'
import Button from './ui/Button'

function Login() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    const cleanEmail = email.trim().toLowerCase()

    if (!cleanEmail.endsWith('@lsu.edu')) {
      setStatus('error')
      setMessage('Use your @lsu.edu email to log in.')
      return
    }

    setStatus('sending')
    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: { emailRedirectTo: window.location.origin },
    })

    if (error) {
      setStatus('error')
      setMessage(error.message)
    } else {
      setStatus('sent')
      setMessage(`Check ${cleanEmail} for your login link.`)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Panel className="w-full max-w-md">
        <h1 className="font-display text-3xl font-black tracking-wide">
          SHOP<span className="text-glow">FLOW</span>
        </h1>
        <p className="mt-2 text-sm text-muted">Buy and sell with other LSU students. Log in with your LSU email.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@lsu.edu"
            className="w-full rounded-xl border border-white/10 bg-bg/60 px-4 py-3 text-ink placeholder:text-muted focus:border-glow focus:outline-none focus:ring-2 focus:ring-glow/40"
          />
          <Button type="submit" className="w-full" disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending...' : 'Send magic link'}
          </Button>
        </form>

        {message && (
          <p className={`mt-4 text-sm ${status === 'error' ? 'text-red-400' : 'text-verified'}`}>{message}</p>
        )}
      </Panel>
    </div>
  )
}

export default Login
