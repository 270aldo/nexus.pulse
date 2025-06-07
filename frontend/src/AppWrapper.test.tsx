import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AppWrapper } from './AppWrapper'

describe('AppWrapper', () => {
  it('renders without crashing', () => {
    const { container } = render(<AppWrapper />)
    expect(container).toBeTruthy()
  })
})
