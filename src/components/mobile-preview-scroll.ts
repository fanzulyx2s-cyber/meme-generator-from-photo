export function scrollPreviewIntoViewOnMobile(
  preview: Pick<HTMLElement, "scrollIntoView"> | null,
) {
  if (
    typeof window === "undefined" ||
    !preview ||
    !window.matchMedia("(max-width: 767px)").matches
  ) {
    return;
  }

  window.requestAnimationFrame(() => {
    preview.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  });
}
