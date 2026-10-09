import Alert from '../Alert/Alert.jsx'
import Modal from '../Modal/Modal.jsx'
import Button from '../Button/Button.jsx'
import '../../Styles/components/confirm-dialog.css'

// `error` (an ApiError) is shown inside the dialog, so the user can retry or cancel
function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  loading = false,
  variant = 'danger',
  error = null,
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={loading ? undefined : onCancel}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="confirm-dialog">
        <p>{message}</p>
        {error && (
          <Alert tone="error" messages={error.details ?? []}>
            {error.message}
          </Alert>
        )}
      </div>
    </Modal>
  )
}

export default ConfirmDialog
