import type { AppEvent, ArticleView, CapturedEventName, Cleanup } from './types';
import { addListener, composeCleanups } from './dom';
import { GuardController } from './guard-controller';
import type { PageController } from './page-controller';
import { AppState, LandingState, SplashState, ToggledState } from './states';

const PAGE_COLORS = ['black', 'blue', 'orange', 'red', 'white'] as const;

/**
 * Central application event bus and state machine.
 */
export class AppContext {
  private readonly controller: PageController;
  private readonly guard = new GuardController();
  private readonly bodyRoot: HTMLBodyElement;
  private readonly pageRoot: HTMLElement;

  private readonly cleanup: Cleanup;
  private state: AppState | null = null;

  /**
   * Creates the context and binds global event capture.
   *
   * @param controller - Page controller used by states.
   * @param pageRoot - Root page element used for global visual effects.
   */
  constructor(controller: PageController, pageRoot: HTMLElement) {
    this.controller = controller;
    this.bodyRoot = document.body as HTMLBodyElement;
    this.pageRoot = pageRoot;
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
      addListener<PointerEvent>(document, 'pointermove', (event): void => {
        this.updatePageColor(event.clientX);
      }),
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

  /**
   * Maps the pointer position across the viewport to one of the page color bands.
   *
   * @param clientX - Horizontal pointer coordinate in viewport pixels.
   * @returns Nothing.
   */
  private updatePageColor(clientX: number): void {
    const windowWidth = Math.max(window.innerWidth, 1);
    const regionWidth = windowWidth / PAGE_COLORS.length;
    const rawIndex = Math.floor(clientX / regionWidth);
    const index = Math.max(0, Math.min(rawIndex, PAGE_COLORS.length - 1));
    const selectedColor = PAGE_COLORS[index];

    PAGE_COLORS.forEach((color) => {
      if (color !== selectedColor && this.pageRoot.classList.contains(color)) {
        this.pageRoot.classList.remove(color);
      }

      if (color !== selectedColor && this.bodyRoot.classList.contains(color)) {
        this.bodyRoot.classList.remove(color);
      }
    });

    this.pageRoot.classList.add(selectedColor);
    this.bodyRoot.classList.add(selectedColor);
  }
}
