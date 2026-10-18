/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'
describe('ShopFlow Landing Page', () => {
  it('disables the Browse Listings button', () => {
    render(<App />)
    const button = screen.getByRole('button', {
      name: /browse listings/i
    })
    expect(button.hasAttribute('disabled')).toBe(true)
  })
})
        
