import type { AppEvent, AppEventReceiver } from './types';

export class GuardController implements AppEventReceiver {
  public handleEvent(appEvent: AppEvent): void {
    if (appEvent.type === 'contextmenu' || appEvent.type === 'dragstart' || appEvent.type === 'drop') {

appEvent.event.preventDefault();
    }
  }
}
