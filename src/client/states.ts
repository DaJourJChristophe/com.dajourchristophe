import type { AppEvent, AppEventReceiver, ArticleView } from './types';
import { AppStateKind } from './types';
import { HeroTracker } from './hero-tracker';
import type { PageController } from './page-controller';
import { SplashCanvasController } from './splash-canvas-controller';
import type { AppContext } from './app-context';

/**
 * Base class for application states.
 */
export abstract class AppState implements AppEventReceiver {
  protected readonly context: AppContext;
  protected readonly controller: PageController;

  protected readonly receivers: AppEventReceiver[] = [];

  /**
   * Creates a state bound to the application context and page controller.
   *
   * @param context - State-machine context that owns transitions.
   * @param controller - Page controller used for DOM rendering/routing.
   */
  constructor(context: AppContext, controller: PageController) {
    this.context = context;
    this.controller = controller;
  }

  public abstract readonly kind: AppStateKind;

  /**
   * Performs state entry work.
   *
   * @returns Nothing.
   */
  public abstract enter(): void;

  /**
   * Performs state cleanup work.
   *
   * @returns Nothing.
   */
  public abstract exit(): void;

  /**
   * Dispatches an event to state-owned receivers.
   *
   * @param appEvent - Captured application event.
   * @returns Nothing.
   */
  public handleEvent(appEvent: AppEvent): void {
    this.receivers.forEach((receiver) => {
      receiver.handleEvent(appEvent);
    });
  }
}

/**
 * Base state for modes that keep cursor tracking and landing navigation active.
 */
export abstract class InteractiveState extends AppState {
  protected readonly heroTracker = new HeroTracker();

  /**
   * Starts cursor tracking for interactive states.
   *
   * @returns Nothing.
   */
  public enter(): void {
    this.heroTracker.start();
    this.receivers.push(this.heroTracker);
  }

  /**
   * Stops cursor tracking for interactive states.
   *
   * @returns Nothing.
   */
  public exit(): void {
    this.heroTracker.stop();
    this.receivers.length = 0;
  }

  /**
   * Handles shared landing navigation actions.
   *
   * @param appEvent - Captured application event.
   * @returns Nothing.
   */
  public override handleEvent(appEvent: AppEvent): void {
    super.handleEvent(appEvent);

    this.controller.handleLandingEvent(appEvent, {
      onAboutMe: (): void => {
        this.context.showArticle('about-me');
      },
      onContact: (): void => {
        this.context.showArticle('contact');
      },
      onExperience: (): void => {
        this.context.showArticle('experience');
      },
      onPrivacy: (): void => {
        this.context.showArticle('privacy');
      },
      onServices: (): void => {
        this.context.showArticle('services');
      },
      onSocialMedia: (): void => {
        this.context.showArticle('social-media');
      },
      onTerms: (): void => {
        this.context.showArticle('terms');
      }
    });
  }
}

/**
 * Initial state that owns the splash signature animation.
 */
export class SplashState extends AppState {
  public readonly kind = AppStateKind.Splash;
  private readonly splashCanvas = new SplashCanvasController();
  private timeoutId = 0;

  /**
   * Starts the splash animation and schedules the landing transition.
   *
   * @returns Nothing.
   */
  public enter(): void {
    this.receivers.push(this.splashCanvas);
    this.splashCanvas.start();
    this.timeoutId = window.setTimeout((): void => {
      this.context.showLanding();
    }, 2500);
  }

  /**
   * Cancels pending splash work when leaving the state.
   *
   * @returns Nothing.
   */
  public exit(): void {
    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = 0;
    }

    this.splashCanvas.stop();
    this.receivers.length = 0;
  }
}

/**
 * State representing the base landing page with no open article panel.
 */
export class LandingState extends InteractiveState {
  public readonly kind = AppStateKind.Landing;

  /**
   * Enters landing mode and closes any open article panel.
   *
   * @returns Nothing.
   */
  public override enter(): void {
    super.enter();
    this.controller.showBodyBackground();
    this.controller.showBanner();
    this.controller.showFooter();
    this.controller.showLeftMenu();
    this.controller.showSpacer();
    this.controller.closeArticle();
  }
}

/**
 * State representing an open article panel.
 */
export class ToggledState extends InteractiveState {
  public readonly kind = AppStateKind.Toggled;
  private readonly view: ArticleView;

  /**
   * Creates an article-panel state.
   *
   * @param context - State-machine context that owns transitions.
   * @param controller - Page controller used to render panels.
   * @param view - Article view to render when entering the state.
   */
  constructor(context: AppContext, controller: PageController, view: ArticleView) {
    super(context, controller);
    this.view = view;
  }

  /**
   * Opens the configured article view.
   *
   * @returns Nothing.
   */
  public override enter(): void {
    super.enter();
    this.controller.hideBodyBackground();
    this.controller.hideBanner();
    this.controller.hideFooter();
    this.controller.hideLeftMenu();
    this.controller.hideSpacer();
    this.controller.openArticle(this.view);
  }

  /**
   * Handles article-local events and close transitions.
   *
   * @param appEvent - Captured application event.
   * @returns Nothing.
   */
  public override handleEvent(appEvent: AppEvent): void {
    super.handleEvent(appEvent);
    this.controller.handleArticleEvent(appEvent, (): void => {
      this.context.showLanding();
    });
  }
}
