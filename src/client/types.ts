/**
 * Callback used to remove an event listener, cancel an animation, or tear down
 * another resource that was created during state entry.
 *
 * @returns Nothing.
 */
export type Cleanup = () => void;

/**
 * DOM lookup helper type for APIs that may fail to find an element.
 *
 * @typeParam T - Concrete DOM element type expected by the caller.
 */
export type NullableElement<T extends Element> = T | null;

/**
 * Names of article panels that can be rendered into the detail surface.
 */
export type ArticleView = 'about-me' | 'contact' | 'experience' | 'privacy' | 'services' | 'social-media' | 'terms';

/**
 * Browser events captured by the application context and redistributed to
 * active states/controllers.
 */
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

/**
 * High-level application state names used by the state machine.
 */
export enum AppStateKind {
  Splash = 'splash',
  Landing = 'landing',
  Toggled = 'toggled'
}

/**
 * Computed canvas/text geometry used by the splash signature writer.
 */
export interface SplashLayout {
  /** Left edge of the text target in canvas coordinates. */
  left: number;
  /** Top edge of the text target in canvas coordinates. */
  top: number;
  /** Text target width in canvas coordinates. */
  width: number;
  /** Text target height in canvas coordinates. */
  height: number;
  /** Left inset where ink drawing should begin. */
  inkInsetLeft: number;
  /** Right inset where ink drawing should finish. */
  inkInsetRight: number;
  /** Extra clipping pad used to avoid cutting off script swashes. */
  clipPad: number;
}

/**
 * Two-dimensional normalized cursor/vector point.
 */
export interface Point {
  /** Horizontal coordinate. */
  x: number;
  /** Vertical coordinate. */
  y: number;
}

/**
 * Required DOM handles for the client application shell.
 */
export interface AppElements {
  /** Button that opens the about-me article panel. */
  aboutMeButton: HTMLButtonElement;
  /** Article host where dynamic panels are rendered. */
  articleTarget: HTMLElement;
  /** Button that opens the experience article panel. */
  experienceButton: HTMLButtonElement;
  /** Landing CTA that opens the experience article panel. */
  openCtaButton: HTMLButtonElement;
  /** Footer button that opens the privacy policy panel. */
  privacyButton: HTMLButtonElement;
  /** Button that opens the services article panel. */
  servicesButton: HTMLButtonElement;
  /** Button that opens the social-media article panel. */
  socialMediaButton: HTMLButtonElement;
  /** Footer button that opens the terms of service panel. */
  termsButton: HTMLButtonElement;
  /** CTA button that opens the contact panel. */
  workWithMeButton: HTMLButtonElement;
  /** Navigation buttons that receive active-state styling. */
  navigationButtons: HTMLButtonElement[];
}

/**
 * Normalized event object emitted by the central application context.
 *
 * @typeParam TEvent - Native browser event type wrapped by the context event.
 */
export interface AppEvent<TEvent extends Event = Event> {
  /** Original browser event. */
  event: TEvent;
  /** Original event target, preserved for hit testing. */
  target: EventTarget | null;
  /** Normalized event name. */
  type: CapturedEventName;
}

/**
 * Object that can receive context-dispatched application events.
 */
export interface AppEventReceiver {
  /**
   * Handles one normalized context event.
   *
   * @param appEvent - Captured application event to process.
   * @returns Nothing.
   */
  handleEvent(appEvent: AppEvent): void;
}
