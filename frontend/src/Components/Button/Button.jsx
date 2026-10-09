import Icon from '../Icons/Icon.jsx'
import '../../Styles/components/button.css'

function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  fullWidth = false,
  type = 'button',
  className = '',
  disabled,
  children,
  ...rest
}) {
  const classes = [
    'button',
    `button--${variant}`,
    size === 'sm' ? 'button--sm' : '',
    fullWidth ? 'button--full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classes} disabled={disabled || loading} {...rest}>
      {icon && !loading && <Icon name={icon} size={size === 'sm' ? 16 : 18} />}
      {loading ? 'Procesando…' : children}
    </button>
  )
}

export default Button
