// components/Alert.jsx
// Reusable message box for success and error feedback
export default function Alert({ type = 'success', message, onClose }) {
  if (!message) return null;
  return (
    <div className={'alert alert-' + type} role="alert">
      <span>{message}</span>
      {onClose && (
        <button type="button" className="alert-close" onClick={onClose} aria-label="Close">
          &times;
        </button>
      )}
    </div>
  );
}
