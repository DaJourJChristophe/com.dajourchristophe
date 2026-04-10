import type { AppEvent, AppEventReceiver } from './types';

/**
 * Prevents browser defaults that conflict with the portfolio experience.
 */
export class GuardController implements AppEventReceiver {
  /**
   * Cancels context-menu, drag, and drop events.
   *
   * @param appEvent - Context-dispatched browser event.
   * @returns Nothing.
   */
  public handleEvent(appEvent: AppEvent): void {
    if (appEvent.type === 'contextmenu' || appEvent.type === 'dragstart' || appEvent.type === 'drop') {
      appEvent.event.preventDefault();
    }
  }
}
