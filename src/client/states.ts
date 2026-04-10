import type { AppEvent, AppEventReceiver, ArticleView } from './types';
import { AppStateKind } from './types';
import { HeroTracker } from './hero-tracker';
import type { PageController } from './page-controller';
import { SplashCanvasController } from './splash-canvas-controller';
import type { AppContext } from './app-context';

export abstract class AppState implements AppEventReceiver {
  protected readonly context: AppContext;
  protected readonly controller: PageController;

protected readonly receivers: AppEventReceiver[] = [];

  constructor(context: AppContext, controller: PageController) {
    this.context = context;
    this.controller = controller;
  }

  public abstract readonly kind: AppStateKind;

  public abstract enter(): void;

  public abstract exit(): void;

  public handleEvent(appEvent: AppEvent): void {
    this.receivers.forEach((receiver) => {
      receiver.handleEvent(appEvent);
    });
  }
}

export abstract class InteractiveState extends AppState {
  protected readonly heroTracker = new HeroTracker();

  public enter(): void {
    this.heroTracker.start();
    this.receivers.push(this.heroTracker);
  }

  public exit(): void {
    this.heroTracker.stop();
    this.receivers.length = 0;
  }

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

export class SplashState extends AppState {
  public readonly kind = AppStateKind.Splash;
  private readonly splashCanvas = new SplashCanvasController();
  private timeoutId = 0;

  public enter(): void {
    this.receivers.push(this.splashCanvas);
    this.splashCanvas.start();
    this.timeoutId = window.setTimeout((): void => {
      this.context.showLanding();
    }, 2500);
  }

  public exit(): void {
    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = 0;
    }

    this.splashCanvas.stop();
    this.receivers.length = 0;
  }
}

export class LandingState extends InteractiveState {
  public readonly kind = AppStateKind.Landing;

  public override enter(): void {
    super.enter();
    this.controller.closeArticle();
  }
}

export class ToggledState extends InteractiveState {
  public readonly kind = AppStateKind.Toggled;
  private readonly view: ArticleView;

  constructor(context: AppContext, controller: PageController, view: ArticleView) {
    super(context, controller);
    this.view = view;
  }

  public override enter(): void {
    super.enter();
    this.controller.openArticle(this.view);
  }

  public override handleEvent(appEvent: AppEvent): void {
    super.handleEvent(appEvent);
    this.controller.handleArticleEvent(appEvent, (): void => {
      this.context.showLanding();
    });
  }
}
