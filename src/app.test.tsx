import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './app'

beforeEach(() => {
  // keep the manual d3 animation loop from actually running during the test
  vi.stubGlobal('requestAnimationFrame', () => 0)
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('App', () => {
  it('renders the graph view svg', () => {
    const { container } = render(<App />)
    expect(container.querySelector('svg')).not.toBeNull()
  })
})
