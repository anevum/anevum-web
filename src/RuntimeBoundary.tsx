import { Component, type ErrorInfo, type ReactNode } from "react";

export class RuntimeBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("ANEVUM runtime surface failure", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <main className="runtime-fallback" role="main" aria-labelledby="runtime-fallback-title">
        <div className="runtime-fallback-panel">
          <span>ANEVUM / RECOVERY</span>
          <h1 id="runtime-fallback-title">This surface did not resolve.</h1>
          <p>The public site is still available. Reload this surface or return to the REPLY launch entry.</p>
          <div className="runtime-fallback-actions">
            <button type="button" onClick={() => window.location.reload()}>RELOAD SURFACE</button>
            <a href="/">RETURN TO REPLY</a>
            <a href="/the-book">OPEN THE BOOK</a>
          </div>
        </div>
      </main>
    );
  }
}
