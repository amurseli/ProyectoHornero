import './Button.css'

function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  return (
    <button className={`btn btn-${variant} btn-${size} ${className}`} {...props}>
      {children}
    </button>
  )
}

export default Button
