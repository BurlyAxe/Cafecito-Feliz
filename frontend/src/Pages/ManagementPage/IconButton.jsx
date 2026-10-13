import Icon from '../../Components/Icons/Icon.jsx'

// Small button with only an icon, used in the table rows; the label is read by screen readers
function IconButton({ icon, label, onClick }) {
  return (
    <button
      type="button"
      className="icon-button"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <Icon name={icon} size={18} />
    </button>
  )
}

export default IconButton
