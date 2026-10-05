export const ErrorBanner = ({ message, onRetry }) => !message ? null : (
  <div className="alert alert--err" role="alert">
    {message}{onRetry && <> {' '}<button type="button" className="link-btn link-btn--danger" onClick={onRetry}>Thử lại</button></>}
  </div>
);
export const SuccessBanner = ({ message }) => !message ? null : <div className="alert alert--ok" role="status">{message}</div>;
export const InfoNote = ({ children }) => <div className="alert alert--info">{children}</div>;
