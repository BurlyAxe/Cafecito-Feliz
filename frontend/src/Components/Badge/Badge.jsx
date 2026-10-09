import '../../Styles/components/badge.css'

function Badge({ tone = 'neutral', children, ...rest }) {
  return (
    <span className={`badge badge--${tone}`} {...rest}>
      {children}
    </span>
  )
}

export default Badge
