export type Cleanup = () => void;
export type NullableElement<T extends Element> = T | null;
export type ArticleView = 'about-me' | 'contact' | 'experience' | 'privacy' | 'services' | 'social-media' | 'terms';
export type CapturedEventName =
  | 'click'
  | 'contextmenu'
  | 'dragstart'
  | 'drop'
  | 'focusin'
  | 'keydown'
  | 'pointerdown'
  | 'pointerleave'
  | 'pointermove'
  | 'pointerout'
  | 'pointerover'
  | 'resize';

export enum AppStateKind {
  Splash = 'splash',
  Landing = 'landing',
  Toggled = 'toggled'
}

export interface SplashLayout {
  left: number;
  top: number;
  width: number;
  height: number;
  inkInsetLeft: number;
  inkInsetRight: number;
  clipPad: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface AppElements {
  aboutMeButton: HTMLButtonElement;
  articleTarget: HTMLElement;
  experienceButton: HTMLButtonElement;
  openCtaButton: HTMLButtonElement;
  privacyButton: HTMLButtonElement;
  servicesButton: HTMLButtonElement;
  socialMediaButton: HTMLButtonElement;
  termsButton: HTMLButtonElement;
  workWithMeButton: HTMLButtonElement;
  navigationButtons: HTMLButtonElement[];
}

export interface AppEvent<TEvent extends Event = Event> {
  event: TEvent;
  target: EventTarget | null;
  type: CapturedEventName;
}

export interface AppEventReceiver {
  handleEvent(appEvent: AppEvent): void;
}
