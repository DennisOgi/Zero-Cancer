import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { forwardRef, useId, useState } from 'react'

import { Input } from '@/components/shared/ui/input'

interface PasswordInputProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  onBlur?: () => void
  name?: string
  error?: string
  disabled?: boolean
  className?: string
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      placeholder = 'Enter your password',
      value,
      onChange,
      onBlur,
      name,
      error,
      disabled = false,
      className = '',
    },
    ref,
  ) => {
    const id = useId()
    const [isVisible, setIsVisible] = useState<boolean>(false)

    const toggleVisibility = () => setIsVisible((prevState) => !prevState)

    return (
      <div className={`relative ${className}`}>
        <Input
          ref={ref}
          id={id}
          name={name}
          className={`pe-9 ${error ? 'border-red-500' : ''}`}
          placeholder={placeholder}
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
        />
        <button
          className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          onClick={toggleVisibility}
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          aria-pressed={isVisible}
          aria-controls={id}
          disabled={disabled}
        >
          {isVisible ? (
            <EyeOffIcon size={16} aria-hidden="true" />
          ) : (
            <EyeIcon size={16} aria-hidden="true" />
          )}
        </button>
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      </div>
    )
  },
)

PasswordInput.displayName = 'PasswordInput'

export default PasswordInput
