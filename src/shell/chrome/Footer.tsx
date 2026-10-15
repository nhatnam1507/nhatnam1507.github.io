// Page footer; the year comes from the build-time `now`, like every other date.
export function Footer({ now }: { now: Date }) {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <span>
          © <span className="js-year">{now.getFullYear()}</span> Nam Nguyen Nhat
        </span>
        <span className="muted">three.js · gsap · github pages</span>
        <span className="eof">[EOF]</span>
      </div>
    </footer>
  );
}
