// GA4 events from the functional plan. Does nothing until the GA tag is on the page (PUBLIC_GA_ID set at build).
type Gtag = (command: 'event', name: string, params?: Record<string, string | number>) => void;

export type EventName = 'pdf_download' | 'custom_pdf' | 'print_game' | 'game_started' | 'game_finished';

export function track(name: EventName, params: Record<string, string | number> = {}) {
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (typeof gtag === 'function') gtag('event', name, params);
}
