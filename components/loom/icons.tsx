// The kit's own icons, not stand-ins.
//
// Every path here was decoded out of "LOOM E-commerce Website UI Kit.fig" by
// scripts/figma/icons.mjs — the file stores vector geometry as a binary
// command stream (0x01 moveTo, 0x02 lineTo, 0x04 cubicTo, 0x00 end) in a blob
// table, which is why an earlier pass used lucide and looked almost but not
// quite right. Regenerate with:
//
//   node scripts/figma/icons.mjs <tree.json> public/loom/icons "^edit / search$" ...
//
// Each glyph keeps the viewBox of the frame it sat in, so a 24 here is the
// same 24 the design measured, and fills are currentColor because the kit
// draws the same heart at #2e3a59 in the header and white on a dark card.
//
// Written by hand would be the wrong call and inlining is the right one:
// these need to take their colour from the element around them, which an
// <img> cannot do.

type IconProps = { className?: string };

export function LoomChevronDown({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path transform="translate(5.99 8.288)" d="M6.01 7.425L12.02 1.415L10.607 0L6.01 4.6L1.414 0L0 1.414L6.01 7.425Z" fillRule="nonzero" />
    </svg>
  );
}

export function LoomSearchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path transform="translate(3.4854 2.9994)" d="M15.192 16.608L9.477 10.892C6.934 12.699 3.431 12.257 1.418 9.875C-0.596 7.492 -0.448 3.964 1.758 1.759C3.963 -0.448 7.491 -0.596 9.874 1.417C12.257 3.431 12.699 6.934 10.892 9.477L16.607 15.193L15.193 16.607L15.192 16.608ZM6 2.001C4.103 2 2.467 3.331 2.082 5.188C1.697 7.045 2.668 8.917 4.408 9.671C6.148 10.425 8.179 9.853 9.27 8.303C10.361 6.752 10.214 4.648 8.917 3.265L9.522 3.865L8.84 3.185L8.828 3.173C8.079 2.42 7.061 1.998 6 2.001Z" fillRule="nonzero" />
    </svg>
  );
}

export function LoomHeartOutline({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path transform="translate(2 2.9989)" d="M10 18.001C9.355 17.429 8.626 16.834 7.855 16.201L7.845 16.201C5.13 13.981 2.053 11.469 0.694 8.459C0.248 7.501 0.011 6.458 0 5.401C-0.003 3.951 0.579 2.56 1.614 1.544C2.649 0.528 4.05 -0.028 5.5 0.001C6.681 0.003 7.836 0.344 8.828 0.984C9.264 1.267 9.658 1.609 10 2.001C10.344 1.611 10.738 1.269 11.173 0.984C12.165 0.344 13.32 0.003 14.5 0.001C15.95 -0.028 17.351 0.528 18.386 1.544C19.421 2.56 20.003 3.951 20 5.401C19.99 6.46 19.753 7.504 19.306 8.464C17.947 11.474 14.871 13.985 12.156 16.201L12.146 16.209C11.374 16.838 10.646 17.433 10.001 18.009L10 18.001ZM5.5 2.001C4.569 1.989 3.67 2.346 3 2.993C2.354 3.627 1.994 4.496 2 5.401C2.011 6.172 2.186 6.931 2.512 7.629C3.154 8.928 4.019 10.103 5.069 11.101C6.06 12.101 7.2 13.069 8.186 13.883C8.459 14.108 8.737 14.335 9.015 14.562L9.19 14.705C9.457 14.923 9.733 15.149 10 15.371L10.013 15.359L10.019 15.354L10.025 15.354L10.034 15.347L10.039 15.347L10.044 15.347L10.062 15.332L10.103 15.299L10.11 15.293L10.121 15.285L10.127 15.285L10.136 15.277L10.8 14.732L10.974 14.589C11.255 14.36 11.533 14.133 11.806 13.908C12.792 13.094 13.933 12.127 14.924 11.122C15.974 10.125 16.84 8.95 17.481 7.651C17.813 6.947 17.99 6.18 18 5.401C18.004 4.499 17.644 3.633 17 3.001C16.331 2.351 15.433 1.992 14.5 2.001C13.362 1.991 12.274 2.468 11.51 3.312L10 5.052L8.49 3.312C7.726 2.468 6.638 1.991 5.5 2.001Z" fillRule="nonzero" />
    </svg>
  );
}

export function LoomHeartFill({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path transform="translate(2 2.9991)" d="M0 5.401C0 3.951 0.582 2.562 1.617 1.547C2.651 0.531 4.051 -0.026 5.5 0.001C7.217 -0.008 8.856 0.72 10 2.001C11.144 0.72 12.783 -0.008 14.5 0.001C15.949 -0.026 17.349 0.531 18.383 1.547C19.418 2.562 20 3.951 20 5.401C20 10.757 13.621 14.801 10 18.001C6.387 14.774 0 10.761 0 5.401Z" fillRule="nonzero" />
    </svg>
  );
}

export function LoomUserIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path transform="translate(4 3)" d="M3 5C3 2.239 5.239 0 8 0C10.761 0 13 2.239 13 5C13 7.761 10.761 10 8 10C5.239 10 3 7.761 3 5ZM8 8C9.657 8 11 6.657 11 5C11 3.343 9.657 2 8 2C6.343 2 5 3.343 5 5C5 6.657 6.343 8 8 8Z" fillRule="nonzero" />
      <path transform="translate(4 3)" d="M2.343 13.343C0.843 14.843 0 16.878 0 19L2 19C2 17.409 2.632 15.883 3.757 14.757C4.883 13.632 6.409 13 8 13C9.591 13 11.117 13.632 12.243 14.757C13.368 15.883 14 17.409 14 19L16 19C16 16.878 15.157 14.843 13.657 13.343C12.157 11.843 10.122 11 8 11C5.878 11 3.843 11.843 2.343 13.343Z" fillRule="nonzero" />
    </svg>
  );
}

export function LoomPhoneIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path transform="translate(4 4)" d="M14.997 16C6.466 16.012 -0.009 9.459 0 1.003C0 0.45 0.448 0 1 0L3.639 0C4.135 0 4.556 0.364 4.629 0.854C4.803 2.029 5.145 3.173 5.644 4.251L5.747 4.473C5.89 4.781 5.793 5.147 5.517 5.345C4.699 5.929 4.387 7.104 5.024 8.02C5.823 9.171 6.83 10.178 7.98 10.977C8.897 11.613 10.072 11.301 10.656 10.484C10.853 10.207 11.22 10.11 11.528 10.253L11.749 10.355C12.827 10.854 13.971 11.197 15.146 11.371C15.636 11.444 16 11.865 16 12.36L16 15C16 15.552 15.551 16 14.999 16L14.997 16Z" fillRule="nonzero" />
    </svg>
  );
}

export function LoomRefreshIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path transform="translate(4 3.9999)" d="M0 16L0 9L7 9L3.783 12.22C4.893 13.355 6.412 13.996 8 14C10.539 13.996 12.802 12.394 13.648 10L13.666 10C13.781 9.675 13.867 9.34 13.925 9L15.937 9C15.433 13 12.032 16 8 16L7.99 16C5.869 16.006 3.833 15.164 2.337 13.66L0 16ZM2.074 7L0.062 7C0.566 3.002 3.965 0.002 7.995 0L8 0C10.122 -0.007 12.158 0.836 13.654 2.34L16 0L16 7L9 7L12.222 3.78C11.111 2.644 9.589 2.002 8 2C5.461 2.004 3.198 3.606 2.352 6L2.334 6C2.219 6.325 2.132 6.66 2.075 7L2.074 7Z" fillRule="nonzero" />
    </svg>
  );
}

export function LoomArrowShortRight({ className }: IconProps) {
  return (
    <svg viewBox="0 0 50 50" fill="currentColor" className={className} aria-hidden="true">
      <path transform="matrix(0.7071 -0.7071 0.7071 0.7071 4.376 27.9463)" d="M25.354 14.583L17.896 22.063L20.833 25L33.333 12.5L20.833 0L17.896 2.937L25.354 10.417L0 10.417L0 14.583L25.354 14.583Z" fillRule="nonzero" />
    </svg>
  );
}

export function LoomCartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 21 21" fill="currentColor" className={className} aria-hidden="true">
      <path transform="translate(7 17.5)" d="M0.75 0.875C0.75 0.806 0.806 0.75 0.875 0.75L0.875 2.75C1.911 2.75 2.75 1.911 2.75 0.875L0.75 0.875ZM0.875 0.75C0.944 0.75 1 0.806 1 0.875L-1 0.875C-1 1.911 -0.161 2.75 0.875 2.75L0.875 0.75ZM1 0.875C1 0.944 0.944 1 0.875 1L0.875 -1C-0.161 -1 -1 -0.161 -1 0.875L1 0.875ZM0.875 1C0.806 1 0.75 0.944 0.75 0.875L2.75 0.875C2.75 -0.161 1.911 -1 0.875 -1L0.875 1Z" fillRule="nonzero" />
      <path transform="translate(16.625 17.5)" d="M0.75 0.875C0.75 0.806 0.806 0.75 0.875 0.75L0.875 2.75C1.911 2.75 2.75 1.911 2.75 0.875L0.75 0.875ZM0.875 0.75C0.944 0.75 1 0.806 1 0.875L-1 0.875C-1 1.911 -0.161 2.75 0.875 2.75L0.875 0.75ZM1 0.875C1 0.944 0.944 1 0.875 1L0.875 -1C-0.161 -1 -1 -0.161 -1 0.875L1 0.875ZM0.875 1C0.806 1 0.75 0.944 0.75 0.875L2.75 0.875C2.75 -0.161 1.911 -1 0.875 -1L0.875 1Z" fillRule="nonzero" />
      <path transform="translate(0.875 0.875)" d="M0 -1C-0.552 -1 -1 -0.552 -1 0C-1 0.552 -0.552 1 0 1L0 -1ZM3.5 0L4.481 -0.196C4.387 -0.664 3.977 -1 3.5 -1L3.5 0ZM5.845 11.716L6.826 11.521L6.826 11.52L5.845 11.716ZM7.595 13.125L7.595 12.125C7.589 12.125 7.582 12.125 7.576 12.125L7.595 13.125ZM16.1 13.125L16.119 12.125C16.113 12.125 16.106 12.125 16.1 12.125L16.1 13.125ZM17.85 11.716L18.831 11.911L18.832 11.904L17.85 11.716ZM19.25 4.375L20.232 4.562C20.288 4.27 20.21 3.967 20.02 3.738C19.831 3.508 19.548 3.375 19.25 3.375L19.25 4.375ZM4.375 3.375C3.823 3.375 3.375 3.823 3.375 4.375C3.375 4.927 3.823 5.375 4.375 5.375L4.375 3.375ZM0 1L3.5 1L3.5 -1L0 -1L0 1ZM2.519 0.196L4.864 11.913L6.826 11.52L4.481 -0.196L2.519 0.196ZM4.864 11.911C4.99 12.544 5.334 13.113 5.837 13.517L7.091 11.96C6.954 11.849 6.86 11.694 6.826 11.521L4.864 11.911ZM5.837 13.517C6.34 13.922 6.969 14.137 7.614 14.125L7.576 12.125C7.4 12.129 7.228 12.07 7.091 11.96L5.837 13.517ZM7.595 14.125L16.1 14.125L16.1 12.125L7.595 12.125L7.595 14.125ZM16.081 14.125C16.726 14.137 17.355 13.922 17.858 13.517L16.604 11.96C16.467 12.07 16.295 12.129 16.119 12.125L16.081 14.125ZM17.858 13.517C18.361 13.113 18.705 12.544 18.831 11.911L16.869 11.521C16.835 11.694 16.741 11.849 16.604 11.96L17.858 13.517ZM18.832 11.904L20.232 4.562L18.268 4.188L16.868 11.529L18.832 11.904ZM19.25 3.375L4.375 3.375L4.375 5.375L19.25 5.375L19.25 3.375Z" fillRule="nonzero" />
    </svg>
  );
}

/** The phone header's menu button — `tabler-icon-menu-2`, three 16px bars. */
export function LoomMenuIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path transform="translate(4 6)" d="M0 -1C-0.552 -1 -1 -0.552 -1 0C-1 0.552 -0.552 1 0 1L0 -1ZM16 1C16.552 1 17 0.552 17 0C17 -0.552 16.552 -1 16 -1L16 1ZM0 5C-0.552 5 -1 5.448 -1 6C-1 6.552 -0.552 7 0 7L0 5ZM16 7C16.552 7 17 6.552 17 6C17 5.448 16.552 5 16 5L16 7ZM0 11C-0.552 11 -1 11.448 -1 12C-1 12.552 -0.552 13 0 13L0 11ZM16 13C16.552 13 17 12.552 17 12C17 11.448 16.552 11 16 11L16 13ZM0 1L16 1L16 -1L0 -1L0 1ZM0 7L16 7L16 5L0 5L0 7ZM0 13L16 13L16 11L0 11L0 13Z" fillRule="nonzero" />
    </svg>
  );
}
