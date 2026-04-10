void (function (): void {
  'use strict';

  type Cleanup = () => void;
  type NullableElement<T extends Element> = T | null;
  type ArticleView = 'about-me' | 'contact' | 'experience' | 'privacy' | 'services' | 'social-media' | 'terms';
  type CapturedEventName =
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

  enum AppStateKind {
    Splash = 'splash',
    Landing = 'landing',
    Toggled = 'toggled'
  }

  interface SplashLayout {
    left: number;
    top: number;
    width: number;
    height: number;
    inkInsetLeft: number;
    inkInsetRight: number;
    clipPad: number;
  }

  interface Point {
    x: number;
    y: number;
  }

  interface AppElements {
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

  interface AppEvent<TEvent extends Event = Event> {
    event: TEvent;
    target: EventTarget | null;
    type: CapturedEventName;
  }

  interface AppEventReceiver {
    handleEvent(appEvent: AppEvent): void;
  }

  function addListener<TEvent extends Event>(
    target: EventTarget,
    type: string,
    listener: (event: TEvent) => void
  ): Cleanup {
    const eventListener = listener as EventListener;

    target.addEventListener(type, eventListener);

    return function cleanup(): void {
      target.removeEventListener(type, eventListener);
    };
  }

  function composeCleanups(...cleanups: Cleanup[]): Cleanup {
    return function cleanup(): void {
      cleanups.slice().reverse().forEach((teardown) => {
        teardown();
      });
    };
  }

  function resolveElements(): AppElements | null {
    const articleTarget = document.getElementById('article') as NullableElement<HTMLElement>;
    const openCtaButton = document.getElementById('open-cta') as NullableElement<HTMLButtonElement>;
    const workWithMeButton = document.getElementById('work-with-me-cta') as NullableElement<HTMLButtonElement>;
    const experienceButton = document.getElementById('experience-cta') as NullableElement<HTMLButtonElement>;
    const servicesButton = document.getElementById('services-cta') as NullableElement<HTMLButtonElement>;
    const aboutMeButton = document.getElementById('about-me-cta') as NullableElement<HTMLButtonElement>;
    const socialMediaButton = document.getElementById('social-media-cta') as NullableElement<HTMLButtonElement>;
    const termsButton = document.getElementById('terms-cta') as NullableElement<HTMLButtonElement>;
    const privacyButton = document.getElementById('privacy-cta') as NullableElement<HTMLButtonElement>;

    if (
      !articleTarget ||
      !openCtaButton ||
      !workWithMeButton ||
      !experienceButton ||
      !servicesButton ||
      !aboutMeButton ||
      !socialMediaButton ||
      !termsButton ||
      !privacyButton
    ) {
      return null;
    }

    return {
      aboutMeButton,
      articleTarget,
      experienceButton,
      openCtaButton,
      privacyButton,
      servicesButton,
      socialMediaButton,
      termsButton,
      workWithMeButton,
      navigationButtons: [experienceButton, servicesButton, aboutMeButton, socialMediaButton]
    };
  }

  function isElementTarget(target: EventTarget | null): target is Element {
    return target instanceof Element;
  }

  function isNodeTarget(target: EventTarget | null): target is Node {
    return target instanceof Node;
  }

  function hitsElement(target: EventTarget | null, element: Element): boolean {
    return isNodeTarget(target) && element.contains(target);
  }

  class GuardController implements AppEventReceiver {
    public handleEvent(appEvent: AppEvent): void {
      if (appEvent.type === 'contextmenu' || appEvent.type === 'dragstart' || appEvent.type === 'drop') {
        appEvent.event.preventDefault();
      }
    }
  }

  class SplashCanvasController implements AppEventReceiver {
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

    public handleEvent(appEvent: AppEvent): void {
      if (appEvent.type === 'resize') {
        this.resize();
      }
    }

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

    private ease(progress: number): number {
      return 1 - Math.pow(1 - progress, 3);
    }

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

  class HeroTracker implements AppEventReceiver {
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

  class PageController {
    private readonly elements: AppElements;

    constructor(elements: AppElements) {
      this.elements = elements;
    }

    public closeArticle(): void {
      this.clearActiveButtons();
      this.elements.articleTarget.classList.remove('open');
    }

    public openArticle(view: ArticleView): void {
      this.renderView(view);
      this.clearActiveButtons();

      const activeButton = this.getActiveButton(view);

      if (activeButton && activeButton.parentElement) {
        activeButton.parentElement.classList.add('active');
      }

      this.elements.articleTarget.classList.add('open');
    }

    public handleLandingEvent(
      appEvent: AppEvent,
      handlers: {
        onAboutMe: () => void;
        onContact: () => void;
        onExperience: () => void;
        onPrivacy: () => void;
        onServices: () => void;
        onSocialMedia: () => void;
        onTerms: () => void;
      }
    ): void {
      if (appEvent.type !== 'click') {
        return;
      }

      if (hitsElement(appEvent.target, this.elements.openCtaButton) || hitsElement(appEvent.target, this.elements.experienceButton)) {
        appEvent.event.preventDefault();
        handlers.onExperience();
        return;
      }

      if (hitsElement(appEvent.target, this.elements.workWithMeButton)) {
        appEvent.event.preventDefault();
        handlers.onContact();
        return;
      }

      if (hitsElement(appEvent.target, this.elements.servicesButton)) {
        appEvent.event.preventDefault();
        handlers.onServices();
        return;
      }

      if (hitsElement(appEvent.target, this.elements.aboutMeButton)) {
        appEvent.event.preventDefault();
        handlers.onAboutMe();
        return;
      }

      if (hitsElement(appEvent.target, this.elements.socialMediaButton)) {
        appEvent.event.preventDefault();
        handlers.onSocialMedia();
        return;
      }

      if (hitsElement(appEvent.target, this.elements.termsButton)) {
        appEvent.event.preventDefault();
        handlers.onTerms();
        return;
      }

      if (hitsElement(appEvent.target, this.elements.privacyButton)) {
        appEvent.event.preventDefault();
        handlers.onPrivacy();
      }
    }

    public handleArticleEvent(appEvent: AppEvent, onClose: () => void): void {
      if (appEvent.type !== 'click' || !isElementTarget(appEvent.target)) {
        return;
      }

      if (appEvent.target.closest('#close')) {
        appEvent.event.preventDefault();
        onClose();
        return;
      }

      if (appEvent.target.closest('#copy-email')) {
        appEvent.event.preventDefault();

        if (navigator.clipboard && navigator.clipboard.writeText) {
          void navigator.clipboard.writeText('contact@dajourchristophe.com');
        }

        return;
      }

      if (appEvent.target.closest('#get-in-touch-cta') || appEvent.target.closest('#services-contact-cta')) {
        appEvent.event.preventDefault();
        this.openArticle('contact');
      }
    }

    private clearActiveButtons(): void {
      this.elements.navigationButtons.forEach((button) => {
        const parent = button.parentElement;

        if (parent && parent.classList.contains('active')) {
          parent.classList.remove('active');
        }
      });
    }

    private getActiveButton(view: ArticleView): HTMLButtonElement | null {
      switch (view) {
        case 'about-me':
          return this.elements.aboutMeButton;
        case 'experience':
          return this.elements.experienceButton;
        case 'services':
          return this.elements.servicesButton;
        case 'social-media':
          return this.elements.socialMediaButton;
        default:
          return null;
      }
    }

    private renderView(view: ArticleView): void {
      switch (view) {
        case 'about-me':
          this.renderAboutMeSection();
          return;
        case 'contact':
          this.renderContactSection();
          return;
        case 'experience':
          this.renderExperienceSection();
          return;
        case 'privacy':
          this.renderLegalSection('privacy');
          return;
        case 'services':
          this.renderServicesSection();
          return;
        case 'social-media':
          this.renderSocialMediaSection();
          return;
        case 'terms':
          this.renderLegalSection('terms');
          return;
      }
    }

    private renderContactSection(): void {
      this.elements.articleTarget.innerHTML = `
<section class="section contact">
  <button class="button" id="close">
    x
  </button>
  <div class="shell">
    <label class="eyebrow"><span class="dot"></span> CONTACT</label>
    <h2 class="hero">Let's Build<br>Something</h2>
    <p class="lede">I'm always open to meaningful projects and technical challenges that create real-world impact.</p>
    <div class="contact-row">
      <label class="meta">EMAIL</label>
      <div class="email-line">
        <a class="email" href="mailto:contact@dajourchristophe.com">contact@dajourchristophe.com</a>
        <button class="copy-button" id="copy-email" aria-label="Copy email address">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
            <path d="M288 96C252.7 96 224 124.7 224 160L224 192L192 192C156.7 192 128 220.7 128 256L128 480C128 515.3 156.7 544 192 544L416 544C451.3 544 480 515.3 480 480L480 448L512 448C547.3 448 576 419.3 576 384L576 160C576 124.7 547.3 96 512 96L288 96zM288 160L512 160L512 384L480 384L480 256C480 220.7 451.3 192 416 192L288 192L288 160zM192 256L416 256L416 480L192 480L192 256z"/>
          </svg>
        </button>
      </div>
    </div>
    <div class="detail-grid">
      <div class="column">
        <label class="meta">HOW TO REACH OUT</label>
        <ul class="bullet-list">
          <li class="bullet-item">Send a brief overview of what you're working on, the problem you're trying to solve, and what you're looking for.</li>
          <li class="bullet-item">What's the project or goal?</li>
          <li class="bullet-item">What stage are you in?</li>
          <li class="bullet-item">What kind of support are you looking for?</li>
          <li class="bullet-item">Any relevant details or constraints.</li>
        </ul>
      </div>
      <div class="column expectations">
        <label class="meta">WHAT TO EXPECT</label>
        <ul class="expect-list">
          <li class="expect-item">
            <span class="icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                <path d="M320 96C196.3 96 96 196.3 96 320C96 443.7 196.3 544 320 544C443.7 544 544 443.7 544 320C544 196.3 443.7 96 320 96zM320 160C408.3 160 480 231.7 480 320C480 408.3 408.3 480 320 480C231.7 480 160 408.3 160 320C160 231.7 231.7 160 320 160zM288 224L288 336L368 384L400 328.6L352 300.6L352 224L288 224z"/>
              </svg>
            </span>
            <div class="copy">
              <strong>RESPONSE TIME</strong>
              <p>I aim to respond within 3-5 business days.</p>
            </div>
          </li>
          <li class="expect-item">
            <span class="icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                <path d="M320 96L376.6 205.4L496 224L410 308.6L429.7 428L320 370.2L210.3 428L230 308.6L144 224L263.4 205.4L320 96z"/>
              </svg>
            </span>
            <div class="copy">
              <strong>PROJECT FIT</strong>
              <p>I focus on technically ambitious and impactful work.</p>
            </div>
          </li>
          <li class="expect-item">
            <span class="icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                <path d="M288 128C288 110.3 302.3 96 320 96C337.7 96 352 110.3 352 128L352 192L416 192C433.7 192 448 206.3 448 224C448 241.7 433.7 256 416 256L352 256L352 320L416 320C468.9 320 512 363.1 512 416C512 468.9 468.9 512 416 512L384 512C366.3 512 352 497.7 352 480C352 462.3 366.3 448 384 448L416 448C433.7 448 448 433.7 448 416C448 398.3 433.7 384 416 384L352 384L352 480C352 497.7 337.7 512 320 512C302.3 512 288 497.7 288 480L288 384L224 384C171.1 384 128 340.9 128 288C128 235.1 171.1 192 224 192L256 192C273.7 192 288 206.3 288 224C288 241.7 273.7 256 256 256L224 256C206.3 256 192 270.3 192 288C192 305.7 206.3 320 224 320L288 320L288 256L224 256C206.3 256 192 241.7 192 224C192 206.3 206.3 192 224 192L288 192L288 128z"/>
              </svg>
            </span>
            <div class="copy">
              <strong>COLLABORATION</strong>
              <p>Clear communication, high standards, and great execution.</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
    <label class="footer-note">SERIOUS INQUIRIES. CLEAR COMMUNICATION. REAL IMPACT.</label>
  </div>
</section>
`;
    }

    private renderAboutMeSection(): void {
      this.elements.articleTarget.innerHTML = `
<section class="section about-me">
  <button class="button" id="close">x</button>
  <ul class="list">
    <li class="list-item">
      <hr>
      <h1 class="title">
        Hey, I'm<br><span class="highlight">Da'Jour J. Christophe</span>
        <span class="sub">Engineering intelligence from first principles</span>
      </h1>
      <p class="text">
        I engineer adaptive systems that learn, evolve, and perform under real-world constraints. My work combines deep technical rigor with first-principles thinking, building intelligence from the ground up, not from assumptions.
        <br><br>
        Prior to his military service, Christophe worked as a <strong>Software Engineer at Drexel University</strong> in Philadelphia, where he designed and developed software systems in a production environment. Building on this experience, he later enlisted in the United States Air Force and served for over eight years.
        <br><br>
        After his transition back to civilian life, he transformed that experience into a defining inflection point, leveraging <strong>more than a decade of experience in software design and engineering</strong> to pivot into Data Science. Today, his work focuses on <strong style="color: #000; background-color: #efefef;">experimental, low-latency, end-to-end meta-learning architectures</strong>, with an emphasis on building adaptive systems that operate efficiently in dynamic environments.
      </p>
      <a class="link" id="get-in-touch-cta">Let's Build</a>
    </li>
    <li class="list-item">
      <figure class="fig">
        <img class="img" src="../assets/img/profile2.jpg" alt="#" />
        <img class="img" src="../assets/img/profile2.jpg" alt="#" />
      </figure>
      <span class="quote" style="color: #111"><em>"I don't follow systems. I design them."</em><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #333;">- Da'Jour J. Christophe</span></span>
    </li>
  </ul>
  <label class="label">UNMATCHED</label>
  <label class="label">UNMATCHED</label>
  <label class="label">UNMATCHED</label>
  <label class="label">UNMATCHED</label>
  <label class="label">UNMATCHED</label>
</section>
`;
    }

    private renderServicesSection(): void {
      this.elements.articleTarget.innerHTML = `
<section class="section services">
  <button class="button" id="close">
    x
  </button>
  <div class="header">
    <label>SERIVCES</label>
    <ul class="list">
      <li class="list-item">
        <h2 class="hero">
          Technical disciplines.<br>Real-world <em>impact</em>.
        </h2>
      </li>
      <li class="list-item">
        <p class="text">I work at the intersection of data, algorithms, and performance<br>to build systems that are intelligent, scalable, and built last.</p>
      </li>
    </ul>
  </div>
  <div class="content">
    <ul class="list">
      <li class="list-item">
        <ul class="list">
          <li class="list-item"><strong>01</strong></li>
          <li class="list-item"></li>
          <li class="list-item"><strong>SYSTEM DESIGN</strong></li>
          <li class="list-item"><p class="text">Designing scalable distributed systems with a focus on reliability, efficiency, and long-term adaptability.</p></li>
          <li class="list-item">
            <button class="button">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                <path d="M598.6 342.6C611.1 330.1 611.1 309.8 598.6 297.3L470.6 169.3C458.1 156.8 437.8 156.8 425.3 169.3C412.8 181.8 412.8 202.1 425.3 214.6L498.7 288L64 288C46.3 288 32 302.3 32 320C32 337.7 46.3 352 64 352L498.7 352L425.3 425.4C412.8 437.9 412.8 458.2 425.3 470.7C437.8 483.2 458.1 483.2 470.6 470.7L598.6 342.7z" />
              </svg>
            </button>
          </li>
        </ul>
      </li>
      <li class="list-item">
        <ul class="list">
          <li class="list-item"><strong>02</strong></li>
          <li class="list-item"></li>
          <li class="list-item"><strong>MACHINE LEARNING</strong></li>
          <li class="list-item"><p class="text">Building and deploying models that extract signals from complex data and improve with real-world feedback.</p></li>
          <li class="list-item">
            <button class="button">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                <path d="M598.6 342.6C611.1 330.1 611.1 309.8 598.6 297.3L470.6 169.3C458.1 156.8 437.8 156.8 425.3 169.3C412.8 181.8 412.8 202.1 425.3 214.6L498.7 288L64 288C46.3 288 32 302.3 32 320C32 337.7 46.3 352 64 352L498.7 352L425.3 425.4C412.8 437.9 412.8 458.2 425.3 470.7C437.8 483.2 458.1 483.2 470.6 470.7L598.6 342.7z" />
              </svg>
            </button>
          </li>
        </ul>
      </li>
      <li class="list-item">
        <ul class="list">
          <li class="list-item"><strong>03</strong></li>
          <li class="list-item"></li>
          <li class="list-item"><strong>PERFORMANCE ENGINEERING</strong></li>
          <li class="list-item"><p class="text">Optimizing critical paths, reducing latency, and pushing systems to their theoretical limits.</p></li>
          <li class="list-item">
            <button class="button">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                <path d="M598.6 342.6C611.1 330.1 611.1 309.8 598.6 297.3L470.6 169.3C458.1 156.8 437.8 156.8 425.3 169.3C412.8 181.8 412.8 202.1 425.3 214.6L498.7 288L64 288C46.3 288 32 302.3 32 320C32 337.7 46.3 352 64 352L498.7 352L425.3 425.4C412.8 437.9 412.8 458.2 425.3 470.7C437.8 483.2 458.1 483.2 470.6 470.7L598.6 342.7z" />
              </svg>
            </button>
          </li>
        </ul>
      </li>
    </ul>
  </div>
  <div class="footer">
    <ul class="list">
      <li class="list-item">
        <span>CLEAR THINKING. COMPLEX SYSTEMS. MEASURABLE RESULTS.</span>
      </li>
      <li class="list-item">
        <button id="services-contact-cta">
          <span>Lets' Build Something</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
            <path d="M416 224C398.3 224 384 209.7 384 192C384 174.3 398.3 160 416 160L576 160C593.7 160 608 174.3 608 192L608 352C608 369.7 593.7 384 576 384C558.3 384 544 369.7 544 352L544 269.3L374.6 438.7C362.1 451.2 341.8 451.2 329.3 438.7L224 333.3L86.6 470.6C74.1 483.1 53.8 483.1 41.3 470.6C28.8 458.1 28.8 437.8 41.3 425.3L201.3 265.3C213.8 252.8 234.1 252.8 246.6 265.3L352 370.7L498.7 224L416 224z" />
          </svg>
        </button>
      </li>
    </ul>
  </div>
</section>
`;
    }

    private renderSocialMediaSection(): void {
      this.elements.articleTarget.innerHTML = `
<section class="section social-media">
  <button class="button" id="close">
    x
  </button>
  <div class="shell">
    <label class="eyebrow"><span class="dot"></span> SOCIAL</label>
    <h2 class="hero">Connect<br>With Me</h2>
    <p class="lede">A few places I share ideas, build in public, and connect with the community.</p>
    <ul class="social-list">
      <li class="social-item"><a class="social-link" href="https://www.instagram.com" target="_blank" rel="noreferrer"><span class="icon-box">IG</span><span class="name">Instagram</span><span class="arrow">&#8599;</span></a></li>
      <li class="social-item"><a class="social-link" href="https://www.facebook.com" target="_blank" rel="noreferrer"><span class="icon-box">f</span><span class="name">Facebook</span><span class="arrow">&#8599;</span></a></li>
      <li class="social-item"><a class="social-link" href="https://www.linkedin.com" target="_blank" rel="noreferrer"><span class="icon-box">in</span><span class="name">LinkedIn</span><span class="arrow">&#8599;</span></a></li>
      <li class="social-item"><a class="social-link" href="https://github.com" target="_blank" rel="noreferrer"><span class="icon-box">GH</span><span class="name">GitHub</span><span class="arrow">&#8599;</span></a></li>
    </ul>
    <label class="footer-note">BUILDING IN PUBLIC. SHARING THE JOURNEY.</label>
  </div>
</section>
`;
    }

    private renderExperienceSection(): void {
      this.elements.articleTarget.innerHTML = `
<section class="section experience">
  <button class="button" id="close">
    x
  </button>
  <div class="panel">
    <div class="copy">
      <div class="copy-inner">
        <label class="eyebrow"><span class="dot"></span> PROJECT SPOTLIGHT</label>
        <h2 class="hero">CYCLE<br>PHILLY</h2>
        <h3 class="subhero">Building a Smarter, More Connected<br>Bike Share System</h3>
        <p class="text">A data-driven exploration of Philadelphia's bike share ecosystem. I analyzed usage patterns, station performance, and infrastructure gaps to uncover insights that can drive smarter expansion and improve rider experience.</p>
        <p class="text">The result is an interactive system that turns complex mobility data into clear, actionable decisions for a more connected city.</p>
        <a class="cta" href="#" aria-label="View Cycle Philly case study"><span>View Case Study</span><span>&#8599;</span></a>
      </div>
      <span class="watermark">CYCLE PHILLY</span>
    </div>
    <div class="visual">
      <span class="meta">DATA &bull; MOBILITY &bull; IMPACT</span>
    </div>
  </div>
</section>
`;
    }

    private renderLegalSection(kind: 'terms' | 'privacy'): void {
      const isTerms = kind === 'terms';
      const title = isTerms ? 'Terms of Service' : 'Privacy Policy';
      const eyebrow = isTerms ? 'TERMS' : 'PRIVACY';
      const updated = 'Last updated: April 8, 2026';
      const intro = isTerms
        ? 'These terms govern use of this site, project inquiries, and any collaboration that may follow. They are written to set expectations clearly and keep communication straightforward.'
        : 'This policy explains what information may be collected through this site, how it is used, and the principles that guide how contact and inquiry information is handled.';

      this.elements.articleTarget.innerHTML = `
<section class="section legal">
  <button class="button" id="close">x</button>
  <div class="shell">
    <label class="eyebrow"><span class="dot"></span> ${eyebrow}</label>
    <div class="header">
      <h2 class="hero">${title}</h2>
      <span class="updated">${updated}</span>
    </div>
    <p class="lede">${intro}</p>
    <div class="content">
      <div class="legal-block"><h3>${isTerms ? 'Use of this site' : 'Information you provide'}</h3><p>${isTerms ? 'This site is intended to present professional work, services, and ways to get in touch.' : 'If you choose to make contact, information such as your name, email address, organization, and message details may be received solely for the purpose of reviewing and responding to your inquiry.'}</p></div>
      <div class="legal-block"><h3>${isTerms ? 'Project inquiries' : 'How information is used'}</h3><p>${isTerms ? 'Submitting a message or inquiry does not create a client relationship, partnership, or guarantee of availability.' : 'Contact information is used to reply to inquiries, evaluate project fit, and continue relevant conversations.'}</p></div>
      <div class="legal-block"><h3>${isTerms ? 'Intellectual property' : 'Retention and security'}</h3><p>${isTerms ? 'Unless otherwise noted, the content, writing, visuals, and project materials presented here remain the property of their respective owner.' : 'Reasonable care is taken to handle inquiry information responsibly and retain it only as long as needed.'}</p></div>
      <div class="legal-block"><h3>${isTerms ? 'No warranty' : 'Third-party services'}</h3><p>${isTerms ? 'This site and its contents are provided as-is for general information.' : 'External links and embedded services may have their own privacy practices.'}</p></div>
    </div>
    <div class="footer-note">
      <span>For questions about these policies, email <a href="mailto:contact@dajourchristophe.com">contact@dajourchristophe.com</a>.</span>
    </div>
  </div>
</section>
`;
    }
  }

  abstract class AppState implements AppEventReceiver {
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

  abstract class InteractiveState extends AppState {
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

  class SplashState extends AppState {
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

  class LandingState extends InteractiveState {
    public readonly kind = AppStateKind.Landing;

    public override enter(): void {
      super.enter();
      this.controller.closeArticle();
    }
  }

  class ToggledState extends InteractiveState {
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

  class AppContext {
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

  const elements = resolveElements();

  if (!elements) {
    const guard = new GuardController();

    composeCleanups(
      addListener<Event>(document, 'contextmenu', (event): void => {
        guard.handleEvent({ event, target: event.target, type: 'contextmenu' });
      }),
      addListener<Event>(document, 'dragstart', (event): void => {
        guard.handleEvent({ event, target: event.target, type: 'dragstart' });
      }),
      addListener<Event>(document, 'drop', (event): void => {
        guard.handleEvent({ event, target: event.target, type: 'drop' });
      })
    );

    const splashCanvas = new SplashCanvasController();

    splashCanvas.start();
    addListener<UIEvent>(window, 'resize', (event): void => {
      splashCanvas.handleEvent({ event, target: event.target, type: 'resize' });
    });
  } else {
    const controller = new PageController(elements);
    const app = new AppContext(controller);

    app.start();
  }
}());
