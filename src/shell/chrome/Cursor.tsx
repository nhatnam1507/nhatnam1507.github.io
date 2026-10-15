// Custom cursor ring (services/cursor moves it; hidden without a fine pointer).
export function Cursor() {
  return (
    <div className="cursor" aria-hidden="true">
      <span></span>
    </div>
  );
}
