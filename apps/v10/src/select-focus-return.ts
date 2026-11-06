// Museum-only fallback for Select 0.2.2. Uses the public TriggerView slot and
// standard DOM/ARIA, never SDK internals. The SDK retains first choice of focus.
export function attachSelectFocusReturn(trigger: HTMLElement) {
  const doc = trigger.ownerDocument;
  let open = trigger.getAttribute('aria-expanded') === 'true';
  let closingIntent = false;
  let departed = false;
  const popup = () => doc.getElementById(trigger.getAttribute('aria-controls') || '');
  const inside = (target: EventTarget | null) =>
    target instanceof Node && (trigger.contains(target) || !!popup()?.contains(target));
  const pointer = (event: PointerEvent) => {
    if (!open) return;
    // Outside dismissal must not steal focus back from a user's new destination.
    if (!inside(event.target)) departed = true;
    else if (event.button === 0) closingIntent = true;
  };
  const key = (event: KeyboardEvent) => {
    if (!open || !inside(event.target)) return;
    if (event.key === 'Tab') departed = true;
    if (['Escape', 'Enter', ' '].includes(event.key)) closingIntent = true;
  };
  const focus = (event: FocusEvent) => {
    if (open && !inside(event.target)) departed = true;
  };
  const blur = () => { if (open) departed = true; };
  const observer = new MutationObserver(() => {
    const next = trigger.getAttribute('aria-expanded') === 'true';
    if (next === open) return;
    const shouldReturn = open && !next && closingIntent && !departed;
    open = next;
    closingIntent = false;
    departed = false;
    // MutationObserver runs after React's close commit and menu unmount. Only
    // recover lost focus, not a focus destination chosen by the SDK or the user.
    if (shouldReturn && trigger.isConnected && doc.hasFocus() &&
        trigger.getAttribute('aria-disabled') !== 'true' &&
        !trigger.matches(':disabled') && trigger.tabIndex >= 0 &&
        !trigger.closest('[inert],[hidden]') && trigger.getClientRects().length &&
        (doc.activeElement === doc.body || doc.activeElement === doc.documentElement)) {
      trigger.focus({ preventScroll: true });
    }
  });
  observer.observe(trigger, { attributes: true, attributeFilter: ['aria-expanded'] });
  doc.addEventListener('pointerdown', pointer, true);
  doc.addEventListener('pointerup', pointer, true);
  doc.addEventListener('keydown', key, true);
  doc.addEventListener('focusin', focus, true);
  doc.defaultView?.addEventListener('blur', blur);
  return () => {
    observer.disconnect();
    doc.removeEventListener('pointerdown', pointer, true);
    doc.removeEventListener('pointerup', pointer, true);
    doc.removeEventListener('keydown', key, true);
    doc.removeEventListener('focusin', focus, true);
    doc.defaultView?.removeEventListener('blur', blur);
  };
}
