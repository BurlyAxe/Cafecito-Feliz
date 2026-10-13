import Icon from '../Icons/Icon.jsx'
import '../../Styles/components/alert.css'

const TONE_ICONS = { error: 'alert', success: 'check', info: 'alert' }

function Alert({ tone = 'error', messages = [], children }) {
  return (
    <div className={`alert alert--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon name={TONE_ICONS[tone]} size={20} className="alert__icon" />
      <div className="alert__content">
        {messages.length > 0 && (
          <ul className="alert__list">
            {messages.map((message, index) => (
              <li key={`${index}-${message}`}>{message}</li>
            ))}
          </ul>
        )}
        {children}
      </div>
    </div>
  )
}

export default Alert
