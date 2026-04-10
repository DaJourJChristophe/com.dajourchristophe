import type { AppEvent, ArticleView, CapturedEventName, Cleanup } from './types';
import { addListener, composeCleanups } from './dom';
import { GuardController } from './guard-controller';
import type { PageController } from './page-controller';
import { AppState, LandingState, SplashState, ToggledState } from './states';

/**
 * Central application event bus and state machine.
 */
export class AppContext {
  private readonly controller: PageController;
  private readonly guard = new GuardController();

  private readonly cleanup: Cleanup;
  private state: AppState | null = null;

  /**
   * Creates the context and binds global event capture.
   *
   * @param controller - Page controller used by states.
   */
  constructor(controller: PageController) {
    this.controller = controller;
    this.cleanup = this.bindEventSources();
  }

  /**
   * Starts the application in the splash state.
   *
   * @returns Nothing.
   */
  public start(): void {
    this.transitionTo(new SplashState(this, this.controller));
  }

  /**
   * Stops the current state and removes global event listeners.
   *
   * @returns Nothing.
   */
  public stop(): void {
    this.state?.exit();
    this.cleanup();
  }

  /**
   * Transitions to an article-panel state.
   *
   * @param view - Article view to render.
   * @returns Nothing.
   */
  public showArticle(view: ArticleView): void {
    this.transitionTo(new ToggledState(this, this.controller, view));
  }

  /**
   * Transitions to the landing state.
   *
   * @returns Nothing.
   */
  public showLanding(): void {
    this.transitionTo(new LandingState(this, this.controller));
  }

  /**
   * Binds all global event sources used by the context.
   *
   * @returns Cleanup callback that removes all listeners.
   */
  private bindEventSources(): Cleanup {
    return composeCleanups(
      this.bindDocumentEvent('click'),
      this.bindDocumentEvent('contextmenu'),
      this.bindDocumentEvent('dragstart'),
      this.bindDocumentEvent('drop'),
      this.bindDocumentEvent('focusin'),
      this.bindDocumentEvent('keydown'),
      this.bindDocumentEvent('pointerdown'),
      this.bindDocumentEvent('pointerleave'),
      this.bindDocumentEvent('pointermove'),
      this.bindDocumentEvent('pointerout'),
      this.bindDocumentEvent('pointerover'),
      addListener<UIEvent>(window, 'resize', (event): void => {
        this.dispatchEvent({ event, target: event.target, type: 'resize' });
      })
    );
  }

  /**
   * Binds one document-level event and normalizes it into an `AppEvent`.
   *
   * @param type - Captured document event type.
   * @returns Cleanup callback for the listener.
   */
  private bindDocumentEvent(type: Exclude<CapturedEventName, 'resize'>): Cleanup {
    return addListener<Event>(document, type, (event): void => {
      this.dispatchEvent({ event, target: event.target, type });
    });
  }

  /**
   * Dispatches a captured event to the guard and active state.
   *
   * @param appEvent - Captured application event.
   * @returns Nothing.
   */
  private dispatchEvent(appEvent: AppEvent): void {
    this.guard.handleEvent(appEvent);
    this.state?.handleEvent(appEvent);
  }

  /**
   * Exits the current state and enters the next state.
   *
   * @param nextState - State instance to activate.
   * @returns Nothing.
   */
  private transitionTo(nextState: AppState): void {
    this.state?.exit();
    this.state = nextState;
    this.state.enter();
  }
}
