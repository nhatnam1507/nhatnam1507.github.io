// Fixed layers behind the page: the WebGL canvas (shell/scene draws on it) and the grid, vignette and grain.
export function Backdrop() {
  return (
    <>
      <canvas id="webgl" aria-hidden="true"></canvas>
      <div className="fx-grid" aria-hidden="true"></div>
      <div className="fx-vignette" aria-hidden="true"></div>
      <div className="fx-noise" aria-hidden="true"></div>
    </>
  );
}
