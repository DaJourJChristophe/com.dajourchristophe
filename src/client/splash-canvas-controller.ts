import type { AppEvent, AppEventReceiver, NullableElement, SplashLayout } from './types';

/**
 * Controls the splash signature animation.
 */
export class SplashCanvasController implements AppEventReceiver {
  private readonly canvas: HTMLCanvasElement | null;
  private readonly clip: HTMLElement | null;

  private readonly text: HTMLElement | null;
  private readonly context: CanvasRenderingContext2D | null;
  private currentProgress = 0;
  private startTime = 0;
  private readonly delay = 70;
  private readonly duration = 1250;
  private frame = 0;
  private frameFallback = 0;
  private layout: SplashLayout | null = null;
  private started = false;
  private readonly textStyle: (CSSStyleDeclaration & { webkitClipPath: string }) | null;

  constructor() {
    this.canvas = document.getElementById('splash-canvas') as NullableElement<HTMLCanvasElement>;
    this.clip = document.getElementById('splash-signature-clip') as NullableElement<HTMLElement>;
    this.text = document.getElementById('splash-signature-text') as NullableElement<HTMLElement>;
    this.context = this.canvas ? this.canvas.getContext('2d') : null;
    this.textStyle = this.text ? this.text.style as CSSStyleDeclaration & { webkitClipPath: string } : null;
  }

  /**
   * Starts the animation after required font resources are ready or a short fallback delay passes.
   *
   * @returns Nothing.
   */
  public start(): void {
    if (!this.canvas || !this.clip || !this.text || !this.context || this.started) {
      return;
    }

    this.started = true;

    const begin = (): void => {
      this.resize();
      this.draw(0.001);
      this.frame = window.requestAnimationFrame(this.animate);
    };

    if (document.fonts && document.fonts.ready) {
      void Promise.race([
        Promise.all([
          document.fonts.ready,
          document.fonts.load('136px "Meow Script"'),
          document.fonts.load('136px "Segoe Script"')
        ]),
        new Promise<void>(function waitForFont(resolve): void {
          window.setTimeout(resolve, 350);
        })
      ]).then(begin).catch(begin);
    } else {
      begin();
    }
  }

  /**
   * Stops the animation and cancels all pending frame/timer work.
   *
   * @returns Nothing.
   */
  public stop(): void {
    this.started = false;
    this.startTime = 0;

    if (this.frame) {
      window.cancelAnimationFrame(this.frame);
      this.frame = 0;
    }

    if (this.frameFallback) {
      window.clearTimeout(this.frameFallback);
      this.frameFallback = 0;
    }
  }

  /**
   * Responds to context-dispatched events used by the splash controller.
   *
   * @param appEvent - Captured application event.
   * @returns Nothing.
   */
  public handleEvent(appEvent: AppEvent): void {
    if (appEvent.type === 'resize') {
      this.resize();
    }
  }

  /**
   * Advances the signature animation on each animation frame.
   *
   * @param timestamp - Animation timestamp supplied by the browser.
   * @returns Nothing.
   */
  private readonly animate = (timestamp: number): void => {
    if (!this.started) {
      return;
    }

    if (this.frameFallback) {
      window.clearTimeout(this.frameFallback);
      this.frameFallback = 0;
    }

    if (!this.startTime) {
      this.startTime = timestamp;
    }

    this.currentProgress = Math.max(0, Math.min((timestamp - this.startTime - this.delay) / this.duration, 1));
    this.draw(this.currentProgress);

    if (this.currentProgress < 1) {
      this.frame = window.requestAnimationFrame(this.animate);
      this.frameFallback = window.setTimeout((): void => {
        if (this.frame) {
          window.cancelAnimationFrame(this.frame);
          this.frame = 0;
          this.animate(performance.now());
        }
      }, 34);
    } else {
      this.frame = 0;
      this.draw(1);
    }
  };

  /**
   * Applies cubic easing to the signature progress.
   *
   * @param progress - Linear progress from `0` to `1`.
   * @returns Eased progress from `0` to `1`.
   */
  private ease(progress: number): number {
    return 1 - Math.pow(1 - progress, 3);
  }

  /**
   * Recomputes canvas dimensions and signature layout geometry.
   *
   * @returns Nothing.
   */
  private resize(): void {
    if (!this.canvas || !this.clip || !this.text) {
      return;
    }

    const splashParent = this.canvas.parentElement;

    if (!splashParent) {
      return;
    }

    const splashRect = splashParent.getBoundingClientRect();
    const textRect = this.text.getBoundingClientRect();
    const textStyles = window.getComputedStyle(this.text);

    this.canvas.width = Math.max(320, Math.round(splashRect.width));
    this.canvas.height = Math.max(120, Math.round(splashRect.height));
    this.clip.style.width = 'auto';
    this.clip.style.width = `${textRect.width.toFixed(2)}px`;

    this.layout = {
      left: (this.canvas.width - textRect.width) / 2,
      top: (this.canvas.height - textRect.height) / 2,
      width: textRect.width,
      height: textRect.height,
      inkInsetLeft: parseFloat(textStyles.paddingLeft) || 0,
      inkInsetRight: parseFloat(textStyles.paddingRight) || 0,
      clipPad: Math.max(28, textRect.height * 0.24)
    };

    this.draw(this.currentProgress);
  }

  /**
   * Draws the moving pen cue and updates signature text clipping.
   *
   * @param progress - Current animation progress from `0` to `1`.
   * @returns Nothing.
   */
  private draw(progress: number): void {
    if (!this.layout || !this.canvas || !this.clip || !this.textStyle || !this.context) {
      return;
    }

    const eased = this.ease(progress);
    const inkWidth = Math.max(0, this.layout.width - this.layout.inkInsetLeft - this.layout.inkInsetRight);
    const revealWidth = inkWidth * eased;
    const penX = this.layout.left + this.layout.inkInsetLeft + revealWidth;
    const penSwing = Math.sin((eased * Math.PI * 2.8) - 0.4);
    const penY = this.layout.top + (this.layout.height * 0.46) + (penSwing * this.layout.height * 0.055);
    const visibleWidth = Math.min(
      this.layout.width,
      this.layout.inkInsetLeft + revealWidth + this.layout.inkInsetRight + this.layout.clipPad
    );
    const rightInset = Math.max(0, this.layout.width - visibleWidth);

    this.clip.style.width = `${this.layout.width.toFixed(2)}px`;
    this.textStyle.clipPath = `inset(0px ${rightInset.toFixed(2)}px 0px 0px)`;
    this.textStyle.webkitClipPath = `inset(0px ${rightInset.toFixed(2)}px 0px 0px)`;
    this.textStyle.opacity = progress > 0.78 ? '1' : (0.88 + (progress * 0.12)).toFixed(3);

    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.save();
    this.context.globalAlpha = 0.92;
    this.context.fillStyle = '#111';
    this.context.beginPath();
    this.context.arc(penX, penY, Math.max(1.4, this.layout.height * 0.016), 0, Math.PI * 2);
    this.context.fill();
    this.context.restore();
  }
}
