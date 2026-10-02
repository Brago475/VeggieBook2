// A drop-down in the pill style: the age range and the security question.

type Option = { value: string; label: string }

type Props = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder: string
}

export function PillSelect({ id, label, value, onChange, options, placeholder }: Props) {
  return (
    <div className="pill-field">
      <label className="pill-label" htmlFor={id}>
        {label}
      </label>
      <div className="pill-wrap">
        <select
          id={id}
          className="pill-input pill-select no-icon"
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}