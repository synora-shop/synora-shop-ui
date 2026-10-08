"use client";

import { Component, type ReactNode } from "react";

/**
 * One section's failure stays one section's.
 *
 * A section that throws — data of a shape it did not expect, a theme update
 * that changed a setting — took the whole page down with it: on the
 * storefront an error page in place of the shop, in the customizer a blank
 * preview. Wrapped in this (inside a Suspense boundary, which is what lets a
 * failure during the server render be retried here rather than failing the
 * response), the section draws nothing and every other section still draws.
 *
 * The error is logged, not swallowed: in the preview it reaches the browser
 * console of the merchant who caused it; on the storefront, the error report.
 */
export class SectionBoundary extends Component<{ name: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(`[section] ${this.props.name} failed to draw and was left out`, error);
  }

  componentDidUpdate(prev: { name: string; children: ReactNode }) {
    // A new draft for the section gets another chance: the merchant may just
    // have fixed what broke it.
    if (this.state.failed && prev.children !== this.props.children) this.setState({ failed: false });
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
