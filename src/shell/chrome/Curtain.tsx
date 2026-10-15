// The wipe that covers nav jumps (services/navigation animates it).
export function Curtain() {
  return (
    <div className="curtain" aria-hidden="true">
      <span className="curtain-cmd"></span>
    </div>
  );
}
