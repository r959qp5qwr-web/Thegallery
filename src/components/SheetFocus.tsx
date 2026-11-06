"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Focus behaviour for a URL-backed sheet (INTERFACE_FOUNDATION §11: sheets trap focus and
 * restore it). The sheet itself stays server-rendered and works without script; this adds what
 * only script can: focus moves into the sheet, everything behind it becomes inert, Escape
 * closes it, and focus returns to the control that opened it.
 */
export function SheetFocus({ sheetId, closeHref, returnFocusTo }:
  { sheetId: string; closeHref: string; returnFocusTo: string }) {
  const router = useRouter();
  useEffect(() => {
    const sheet = document.getElementById(sheetId);
    if (!sheet) return;
    // Everything that is not the sheet becomes inert, at every level up to the body: the page
    // header, the content, the footer and the bottom bar all sit outside the sheet's own parent.
    const behind: HTMLElement[] = [];
    for (let node: HTMLElement | null = sheet; node && node !== document.body; node = node.parentElement) {
      const parent: HTMLElement | null = node.parentElement;
      if (!parent) break;
      for (const el of Array.from(parent.children) as HTMLElement[]) {
        if (el !== node && !el.hasAttribute("inert") && !el.classList.contains("contact-scrim")
            && el.tagName !== "SCRIPT") behind.push(el);
      }
    }
    behind.forEach((el) => el.setAttribute("inert", ""));
    (sheet.querySelector<HTMLElement>("[data-autofocus]") ?? sheet).focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); router.replace(closeHref, { scroll: false }); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      behind.forEach((el) => el.removeAttribute("inert"));
      document.getElementById(returnFocusTo)?.focus();
    };
  }, [sheetId, closeHref, returnFocusTo, router]);
  return null;
}
