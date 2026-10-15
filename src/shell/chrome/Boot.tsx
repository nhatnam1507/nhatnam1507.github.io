// Boot overlay; services/boot fills the log and hides it when done.
export function Boot() {
  return (
    <div id="boot" aria-hidden="true">
      <pre className="boot-log"></pre>
      <div className="boot-bar">
        <span></span>
      </div>
    </div>
  );
}
