// The page's single toast; services/toast writes its content and toggles `.is-on`.
export function Toast() {
  return <div className="toast" role="status" aria-live="polite"></div>;
}
