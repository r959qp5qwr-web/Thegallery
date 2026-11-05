// The accepted 24px line icon family (ux/INTERFACE_FOUNDATION.md §6), lifted verbatim from
// ux/reference/interface/icons.js so the product and the accepted reference set draw the same
// shapes. Rendered once in the layout; every icon is <Icon name="search" />.
export function IconSprite() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ display: "none" }} aria-hidden
      dangerouslySetInnerHTML={{ __html: `<symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5 21 21"/></symbol>
      <symbol id="i-back" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></symbol>
      <symbol id="i-close" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></symbol>
      <symbol id="i-chevron" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></symbol>
      <symbol id="i-bookmark" viewBox="0 0 24 24"><path d="M6 4h12v17l-6-4-6 4z"/></symbol>
      <symbol id="i-bookmark-on" viewBox="0 0 24 24"><path d="M6 4h12v17l-6-4-6 4z" fill="currentColor"/></symbol>
      <symbol id="i-share" viewBox="0 0 24 24"><path d="M12 4v12M8 8l4-4 4 4M5 14v6h14v-6"/></symbol>
      <symbol id="i-browse" viewBox="0 0 24 24"><path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/></symbol>
      <symbol id="i-workshops" viewBox="0 0 24 24"><path d="M4 20l4-1L19 8l-3-3L5 16z"/><path d="M14 7l3 3"/></symbol>
      <symbol id="i-makers" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></symbol>
      <symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
      <symbol id="i-image" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14"/><path d="M4 16l5-5 4 4 3-3 4 4"/><circle cx="15.5" cy="9.5" r="1.5"/></symbol>
      <symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></symbol>
      <symbol id="i-warning" viewBox="0 0 24 24"><path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.5"/></symbol>
      <symbol id="i-chat" viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/></symbol>
      <symbol id="i-mail" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12"/><path d="M3 7l9 6 9-6"/></symbol>
      <symbol id="i-phone" viewBox="0 0 24 24"><path d="M6 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L16 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 4 6a2 2 0 0 1 2-2z"/></symbol>
      <symbol id="i-globe" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c3 3 3 13 0 16M12 4c-3 3-3 13 0 16"/></symbol>
      <symbol id="i-form" viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="16"/><path d="M8 9h8M8 13h8M8 17h5"/></symbol>
      <symbol id="i-retry" viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.5-5.8"/><path d="M20 4v5h-5"/></symbol>
      <symbol id="i-drag" viewBox="0 0 24 24"><path d="M8 7h8M8 12h8M8 17h8"/></symbol>
      <symbol id="i-external" viewBox="0 0 24 24"><path d="M14 5h5v5M19 5l-8 8M17 14v5H5V7h5"/></symbol>` }} />
  );
}

export function Icon({ name, small, className }: { name: string; small?: boolean; className?: string }) {
  return (
    <svg className={["icon", small ? "sm" : "", className ?? ""].filter(Boolean).join(" ")} aria-hidden>
      <use href={`#i-${name}`} />
    </svg>
  );
}
