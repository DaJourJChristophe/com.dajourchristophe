import type { AppEvent, AppEventReceiver, NullableElement, Point } from './types';

export class HeroTracker implements AppEventReceiver {
  private readonly article: HTMLElement | null;
  private readonly banner: HTMLElement | null;

private readonly hero: HTMLElement | null;
  private readonly heroMaxX = 10;
  private readonly heroMaxY = 6;
  private readonly titleMaxX = 5;
  private readonly titleMaxY = 3;
  private readonly textMaxX = 4;
  private readonly textMaxY = 2.5;
  private readonly aboutHeroMaxX = 12;
  private readonly aboutHeroMaxY = 7;
  private readonly aboutCounterMaxX = 3;
  private readonly aboutCounterMaxY = 1.5;
  private readonly imageFrontMaxX = 8;
  private readonly imageFrontMaxY = 5;
  private readonly imageBackMaxX = 14;
  private readonly imageBackMaxY = 8;
  private readonly trackSpeed = 0.06;
  private readonly imageTrackSpeed = 0.025;
  private readonly idleDelay = 120;
  private readonly targetReturnSpeed = 0.09;
  private readonly position: Point = { x: 0, y: 0 };
  private readonly imagePosition: Point = { x: 0, y: 0 };
  private readonly target: Point = { x: 0, y: 0 };
  private frame = 0;
  private lastMoveTime = 0;
  private pointerInside = true;
  private suspended = false;
  private active = false;
  private readonly suspendSelector = [
    'button',
    'a',
    'input',
    'textarea',
    'select',
    'label',
    '.navigation',
    '.footer',
    '.banner .hero',
    '.banner .title',
    '.banner .text',
    '.article .title',
    '.article .text',
    '.article p',
    '.article .sub',
    '.article .highlight',
    '.article .button'
  ].join(', ');

  constructor() {
    this.article = document.querySelector('.article') as NullableElement<HTMLElement>;
    this.banner = document.querySelector('.banner') as NullableElement<HTMLElement>;
    this.hero = document.querySelector('.banner .hero') as NullableElement<HTMLElement>;
  }

  public start(): void {
    this.active = true;
  }

  public stop(): void {
    this.active = false;
    this.target.x = 0;
    this.target.y = 0;
    this.pointerInside = false;
    this.lastMoveTime = 0;

    if (this.frame) {
      window.cancelAnimationFrame(this.frame);
      this.frame = 0;
    }

    this.render();
  }

  public handleEvent(appEvent: AppEvent): void {
    if (!this.active || !this.article || !this.banner || !this.hero) {
      return;
    }

    switch (appEvent.type) {
      case 'pointermove':
        this.updateFromPointer(appEvent.event as PointerEvent);
        return;
      case 'pointerleave':
        this.reset();
        return;
      case 'pointerdown':
      case 'focusin':
      case 'keydown':
        this.suspend();
        return;
      case 'pointerover':
        if (this.shouldSuspend(appEvent.target)) {
          this.suspend();
        }
        return;
      case 'pointerout':
        this.resumeFromPointer(appEvent.event as PointerEvent);
        return;
      default:
        return;
    }
  }

  private readonly animate = (timestamp: number): void => {
    if (!this.article || !this.banner || !this.hero) {
      this.frame = 0;
      return;
    }

    if (!this.lastMoveTime) {
      this.lastMoveTime = timestamp;
    }

    if (!this.pointerInside || (timestamp - this.lastMoveTime) >= this.idleDelay) {
      this.target.x += (0 - this.target.x) * this.targetReturnSpeed;
      this.target.y += (0 - this.target.y) * this.targetReturnSpeed;
    }

    this.position.x += (this.target.x - this.position.x) * this.trackSpeed;
    this.position.y += (this.target.y - this.position.y) * this.trackSpeed;
    this.imagePosition.x += (this.target.x - this.imagePosition.x) * this.imageTrackSpeed;
    this.imagePosition.y += (this.target.y - this.imagePosition.y) * this.imageTrackSpeed;

    this.render();

    if (
      Math.abs(this.target.x - this.position.x) > 0.001 ||
      Math.abs(this.target.y - this.position.y) > 0.001 ||
      Math.abs(this.target.x - this.imagePosition.x) > 0.001 ||
      Math.abs(this.target.y - this.imagePosition.y) > 0.001
    ) {
      this.frame = window.requestAnimationFrame(this.animate);
    } else {
      this.frame = 0;
    }
  };

  private requestAnimation(): void {
    if (!this.frame) {
      this.frame = window.requestAnimationFrame(this.animate);
    }
  }

  private shouldSuspend(targetNode: EventTarget | null): boolean {
    return !!(targetNode instanceof Element && targetNode.closest(this.suspendSelector));
  }

  private updateFromPointer(event: PointerEvent): void {
    if (this.shouldSuspend(event.target)) {
      this.suspended = true;
      this.easeBackToOrigin();
      return;
    }

    this.suspended = false;
    this.pointerInside = true;
    this.lastMoveTime = performance.now();
    this.target.x = ((event.clientX / window.innerWidth) - 0.5) * 2;
    this.target.y = ((event.clientY / window.innerHeight) - 0.5) * 2;
    this.requestAnimation();
  }

  private reset(): void {
    if (this.suspended) {
      this.easeBackToOrigin();
      return;
    }

    this.pointerInside = false;
    this.lastMoveTime = 0;
    this.requestAnimation();
  }

  private suspend(): void {
    this.suspended = true;
    this.easeBackToOrigin();
  }

  private resumeFromPointer(event: PointerEvent): void {
    const relatedTarget = event.relatedTarget;

    if (!relatedTarget || this.shouldSuspend(relatedTarget) || this.shouldSuspend(event.target)) {
      return;
    }

    this.suspended = false;
    this.updateFromPointer(event);
  }

  private easeBackToOrigin(): void {
    this.target.x = 0;
    this.target.y = 0;
    this.pointerInside = false;
    this.lastMoveTime = 0;
    this.requestAnimation();
  }

  private render(): void {
    if (!this.article || !this.banner || !this.hero) {
      return;
    }

    this.hero.style.setProperty('--hero-track-x', `${(this.position.x * this.heroMaxX).toFixed(2)}px`);
    this.hero.style.setProperty('--hero-track-y', `${(this.position.y * this.heroMaxY).toFixed(2)}px`);
    this.banner.style.setProperty('--title-track-x', `${(this.position.x * -this.titleMaxX).toFixed(2)}px`);
    this.banner.style.setProperty('--title-track-y', `${(this.position.y * -this.titleMaxY).toFixed(2)}px`);
    this.banner.style.setProperty('--text-track-x', `${(this.position.x * this.textMaxX).toFixed(2)}px`);
    this.banner.style.setProperty('--text-track-y', `${(this.position.y * this.textMaxY).toFixed(2)}px`);
    this.article.style.setProperty('--about-hero-track-x', `${(this.position.x * this.aboutHeroMaxX).toFixed(2)}px`);
    this.article.style.setProperty('--about-hero-track-y', `${(this.position.y * this.aboutHeroMaxY).toFixed(2)}px`);
    this.article.style.setProperty('--about-hero-counter-x', `${(this.position.x * -this.aboutCounterMaxX).toFixed(2)}px`);
    this.article.style.setProperty('--about-hero-counter-y', `${(this.position.y * -this.aboutCounterMaxY).toFixed(2)}px`);
    this.article.style.setProperty('--about-image-front-x', `${(this.imagePosition.x * this.imageFrontMaxX).toFixed(2)}px`);
    this.article.style.setProperty('--about-image-front-y', `${(this.imagePosition.y * this.imageFrontMaxY).toFixed(2)}px`);
    this.article.style.setProperty('--about-image-back-x', `${(this.imagePosition.x * -this.imageBackMaxX).toFixed(2)}px`);
    this.article.style.setProperty('--about-image-back-y', `${(this.imagePosition.y * -this.imageBackMaxY).toFixed(2)}px`);
  }
}
