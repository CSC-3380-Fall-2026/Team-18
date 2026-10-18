import type { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost'
}

const styles = {
  primary: 'bg-ink text-bg hover:shadow-[0_0_24px_rgb(238_243_255/0.6)]',
  ghost: 'border border-neon/60 text-ink hover:bg-neon/15 hover:shadow-[0_0_18px_rgb(47_107_255/0.5)]',
}

function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-full px-6 py-2.5 font-display text-sm font-bold transition ${styles[variant]} ${className}`}
      {...props}
    />
  )
}

export default Button
