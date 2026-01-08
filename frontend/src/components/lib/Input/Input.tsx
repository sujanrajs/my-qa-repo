import { useId, useState } from 'react';
import './Input.css';

interface InputProps {
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  label?: string;
  required?: boolean;
  error?: string;
}

export const Input = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  label,
  required = false,
  error,
}: InputProps) => {
  const id = useId();
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === 'password';
  const inputType = isPasswordType && showPassword ? 'text' : type;
  
  return (
    <div className="input-group">
      {label && (
        <label htmlFor={id} className="input-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <div className="input-wrapper">
        <input
          id={id}
          type={inputType}
          className={`input ${error ? 'input-error' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          required={required}
        />
        {isPasswordType && (
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={0}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

