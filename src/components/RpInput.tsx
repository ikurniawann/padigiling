'use client'

import { useState } from 'react'
import { rp } from '@/lib/format'

interface RpInputProps {
  value: number | string
  onChange: (n: number) => void
  className?: string
  placeholder?: string
  readOnly?: boolean
  disabled?: boolean
}

export function RpInput({
  value,
  onChange,
  className = 'input',
  placeholder = '0',
  readOnly,
  disabled,
}: RpInputProps) {
  const [focused, setFocused] = useState(false)
  const num = Number(value) || 0

  return (
    <input
      type="text"
      inputMode="numeric"
      className={className}
      placeholder={placeholder}
      readOnly={readOnly}
      disabled={disabled}
      value={focused
        ? (num > 0 ? num.toLocaleString('id-ID') : '')
        : (num > 0 ? rp(num) : '')}
      onFocus={e => {
        setFocused(true)
        setTimeout(() => e.target.select(), 0)
      }}
      onBlur={() => setFocused(false)}
      onChange={e => {
        const digits = e.target.value.replace(/\D/g, '')
        onChange(digits ? Number(digits) : 0)
      }}
    />
  )
}
