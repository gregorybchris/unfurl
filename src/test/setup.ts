import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom doesn't implement ResizeObserver; stub it so components that observe
// element size (e.g. GraphView) can mount in tests.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Unmount React trees and reset jsdom between tests.
afterEach(() => {
  cleanup()
})
