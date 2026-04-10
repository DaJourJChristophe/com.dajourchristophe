import type { AppEvent, ArticleView, CapturedEventName, Cleanup } from './types';
import { addListener, composeCleanups } from './dom';
import { GuardController } from './guard-controller';
import type { PageController } from './page-controller';
import { AppState, LandingState, SplashState, ToggledState } from './states';

export class AppContext {
  private readonly controller: PageController;
  private readonly guard = new GuardController();

private readonly cleanup: Cleanup;
  private state: AppState | null = null;

  constructor(controller: PageController) {
    this.controller = controller;
    this.cleanup = this.bindEventSources();
  }

  public start(): void {
    this.transitionTo(new SplashState(this, this.controller));
  }

  public stop(): void {
    this.state?.exit();
    this.cleanup();
  }

  public showArticle(view: ArticleView): void {
    this.transitionTo(new ToggledState(this, this.controller, view));
  }

  public showLanding(): void {
    this.transitionTo(new LandingState(this, this.controller));
  }

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

  private bindDocumentEvent(type: Exclude<CapturedEventName, 'resize'>): Cleanup {
    return addListener<Event>(document, type, (event): void => {
      this.dispatchEvent({ event, target: event.target, type });
    });
  }

  private dispatchEvent(appEvent: AppEvent): void {
    this.guard.handleEvent(appEvent);
    this.state?.handleEvent(appEvent);
  }

  private transitionTo(nextState: AppState): void {
    this.state?.exit();
    this.state = nextState;
    this.state.enter();
  }
}
