import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { supabase } from '../lib/supabase'
import Panel from './ui/Panel'
import Button from './ui/Button'

type Mode = 'login' | 'signup'

function Login() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')

    const cleanEmail = email.trim().toLowerCase()

    if (!cleanEmail.endsWith('@lsu.edu')) {
      setError('Use your @lsu.edu email.')
      return
    }
    if (password.length < 6) {
      setError('Password needs at least 6 characters.')
      return
    }

    setBusy(true)

    if (mode === 'signup') {
      const { data, error: signUpError } = await supabase.auth.signUp({ email: cleanEmail, password })
      setBusy(false)
      if (signUpError) {
        setError(signUpError.message)
      } else if (!data.session) {
        // Only happens if "Confirm email" is still on in Supabase
        setNotice(`Account created. Check ${cleanEmail} to confirm, then log in.`)
        setMode('login')
      }
      // With a session, App.tsx sees the login and opens the marketplace
      return
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password })
    setBusy(false)
    if (loginError) {
      setError(
        loginError.message === 'Invalid login credentials'
          ? 'Wrong email or password. New here? Create an account below.'
          : loginError.message,
      )
    }
  }

  function switchMode() {
    setMode(mode === 'login' ? 'signup' : 'login')
    setError('')
    setNotice('')
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Panel className="w-full max-w-md">
        <h1 className="font-display text-3xl font-black tracking-wide">
          SHOP<span className="text-glow">FLOW</span>
        </h1>
        <p className="mt-2 text-sm text-muted">
          {mode === 'login'
            ? 'Buy and sell with other LSU students. Log in with your LSU email.'
            : 'Create your account with your LSU email.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@lsu.edu"
            className="w-full rounded-xl border border-white/10 bg-bg/60 px-4 py-3 text-ink placeholder:text-muted focus:border-glow focus:outline-none focus:ring-2 focus:ring-glow/40"
          />
          <input
            type="password"
            required
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={mode === 'login' ? 'Password' : 'Make a password (6+ characters)'}
            className="w-full rounded-xl border border-white/10 bg-bg/60 px-4 py-3 text-ink placeholder:text-muted focus:border-glow focus:outline-none focus:ring-2 focus:ring-glow/40"
          />
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'One sec...' : mode === 'login' ? 'Log in' : 'Create account'}
          </Button>
        </form>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        {notice && <p className="mt-4 text-sm text-verified">{notice}</p>}

        <p className="mt-6 text-center text-sm text-muted">
          {mode === 'login' ? 'New to ShopFlow?' : 'Already have an account?'}{' '}
          <button type="button" onClick={switchMode} className="font-semibold text-glow hover:underline">
            {mode === 'login' ? 'Create an account' : 'Log in'}
          </button>
        </p>
      </Panel>
    </div>
  )
}

export default Login
