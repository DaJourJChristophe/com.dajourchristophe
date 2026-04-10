"use strict";
void (function () {
    'use strict';
    let AppStateKind;
    (function (AppStateKind) {
        AppStateKind["Splash"] = "splash";
        AppStateKind["Landing"] = "landing";
        AppStateKind["Toggled"] = "toggled";
    })(AppStateKind || (AppStateKind = {}));
    function addListener(target, type, listener) {
        const eventListener = listener;
        target.addEventListener(type, eventListener);
        return function cleanup() {
            target.removeEventListener(type, eventListener);
        };
    }
    function composeCleanups(...cleanups) {
        return function cleanup() {
            cleanups.slice().reverse().forEach((teardown) => {
                teardown();
            });
        };
    }
    function resolveElements() {
        const articleTarget = document.getElementById('article');
        const openCtaButton = document.getElementById('open-cta');
        const workWithMeButton = document.getElementById('work-with-me-cta');
        const experienceButton = document.getElementById('experience-cta');
        const servicesButton = document.getElementById('services-cta');
        const aboutMeButton = document.getElementById('about-me-cta');
        const socialMediaButton = document.getElementById('social-media-cta');
        const termsButton = document.getElementById('terms-cta');
        const privacyButton = document.getElementById('privacy-cta');
        if (!articleTarget ||
            !openCtaButton ||
            !workWithMeButton ||
            !experienceButton ||
            !servicesButton ||
            !aboutMeButton ||
            !socialMediaButton ||
            !termsButton ||
            !privacyButton) {
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
    function isElementTarget(target) {
        return target instanceof Element;
    }
    function isNodeTarget(target) {
        return target instanceof Node;
    }
    function hitsElement(target, element) {
        return isNodeTarget(target) && element.contains(target);
    }
    class GuardController {
        handleEvent(appEvent) {
            if (appEvent.type === 'contextmenu' || appEvent.type === 'dragstart' || appEvent.type === 'drop') {
                appEvent.event.preventDefault();
            }
        }
    }
    class SplashCanvasController {
        canvas;
        clip;
        text;
        context;
        currentProgress = 0;
        startTime = 0;
        delay = 70;
        duration = 1250;
        frame = 0;
        frameFallback = 0;
        layout = null;
        started = false;
        textStyle;
        constructor() {
            this.canvas = document.getElementById('splash-canvas');
            this.clip = document.getElementById('splash-signature-clip');
            this.text = document.getElementById('splash-signature-text');
            this.context = this.canvas ? this.canvas.getContext('2d') : null;
            this.textStyle = this.text ? this.text.style : null;
        }
        start() {
            if (!this.canvas || !this.clip || !this.text || !this.context || this.started) {
                return;
            }
            this.started = true;
            const begin = () => {
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
                    new Promise(function waitForFont(resolve) {
                        window.setTimeout(resolve, 350);
                    })
                ]).then(begin).catch(begin);
            }
            else {
                begin();
            }
        }
        stop() {
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
        handleEvent(appEvent) {
            if (appEvent.type === 'resize') {
                this.resize();
            }
        }
        animate = (timestamp) => {
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
                this.frameFallback = window.setTimeout(() => {
                    if (this.frame) {
                        window.cancelAnimationFrame(this.frame);
                        this.frame = 0;
                        this.animate(performance.now());
                    }
                }, 34);
            }
            else {
                this.frame = 0;
                this.draw(1);
            }
        };
        ease(progress) {
            return 1 - Math.pow(1 - progress, 3);
        }
        resize() {
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
        draw(progress) {
            if (!this.layout || !this.canvas || !this.clip || !this.textStyle || !this.context) {
                return;
            }
            const eased = this.ease(progress);
            const inkWidth = Math.max(0, this.layout.width - this.layout.inkInsetLeft - this.layout.inkInsetRight);
            const revealWidth = inkWidth * eased;
            const penX = this.layout.left + this.layout.inkInsetLeft + revealWidth;
            const penSwing = Math.sin((eased * Math.PI * 2.8) - 0.4);
            const penY = this.layout.top + (this.layout.height * 0.46) + (penSwing * this.layout.height * 0.055);
            const visibleWidth = Math.min(this.layout.width, this.layout.inkInsetLeft + revealWidth + this.layout.inkInsetRight + this.layout.clipPad);
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
    class HeroTracker {
        article;
        banner;
        hero;
        heroMaxX = 10;
        heroMaxY = 6;
        titleMaxX = 5;
        titleMaxY = 3;
        textMaxX = 4;
        textMaxY = 2.5;
        aboutHeroMaxX = 12;
        aboutHeroMaxY = 7;
        aboutCounterMaxX = 3;
        aboutCounterMaxY = 1.5;
        imageFrontMaxX = 8;
        imageFrontMaxY = 5;
        imageBackMaxX = 14;
        imageBackMaxY = 8;
        trackSpeed = 0.06;
        imageTrackSpeed = 0.025;
        idleDelay = 120;
        targetReturnSpeed = 0.09;
        position = { x: 0, y: 0 };
        imagePosition = { x: 0, y: 0 };
        target = { x: 0, y: 0 };
        frame = 0;
        lastMoveTime = 0;
        pointerInside = true;
        suspended = false;
        active = false;
        suspendSelector = [
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
            this.article = document.querySelector('.article');
            this.banner = document.querySelector('.banner');
            this.hero = document.querySelector('.banner .hero');
        }
        start() {
            this.active = true;
        }
        stop() {
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
        handleEvent(appEvent) {
            if (!this.active || !this.article || !this.banner || !this.hero) {
                return;
            }
            switch (appEvent.type) {
                case 'pointermove':
                    this.updateFromPointer(appEvent.event);
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
                    this.resumeFromPointer(appEvent.event);
                    return;
                default:
                    return;
            }
        }
        animate = (timestamp) => {
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
            if (Math.abs(this.target.x - this.position.x) > 0.001 ||
                Math.abs(this.target.y - this.position.y) > 0.001 ||
                Math.abs(this.target.x - this.imagePosition.x) > 0.001 ||
                Math.abs(this.target.y - this.imagePosition.y) > 0.001) {
                this.frame = window.requestAnimationFrame(this.animate);
            }
            else {
                this.frame = 0;
            }
        };
        requestAnimation() {
            if (!this.frame) {
                this.frame = window.requestAnimationFrame(this.animate);
            }
        }
        shouldSuspend(targetNode) {
            return !!(targetNode instanceof Element && targetNode.closest(this.suspendSelector));
        }
        updateFromPointer(event) {
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
        reset() {
            if (this.suspended) {
                this.easeBackToOrigin();
                return;
            }
            this.pointerInside = false;
            this.lastMoveTime = 0;
            this.requestAnimation();
        }
        suspend() {
            this.suspended = true;
            this.easeBackToOrigin();
        }
        resumeFromPointer(event) {
            const relatedTarget = event.relatedTarget;
            if (!relatedTarget || this.shouldSuspend(relatedTarget) || this.shouldSuspend(event.target)) {
                return;
            }
            this.suspended = false;
            this.updateFromPointer(event);
        }
        easeBackToOrigin() {
            this.target.x = 0;
            this.target.y = 0;
            this.pointerInside = false;
            this.lastMoveTime = 0;
            this.requestAnimation();
        }
        render() {
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
        elements;
        constructor(elements) {
            this.elements = elements;
        }
        closeArticle() {
            this.clearActiveButtons();
            this.elements.articleTarget.classList.remove('open');
        }
        openArticle(view) {
            this.renderView(view);
            this.clearActiveButtons();
            const activeButton = this.getActiveButton(view);
            if (activeButton && activeButton.parentElement) {
                activeButton.parentElement.classList.add('active');
            }
            this.elements.articleTarget.classList.add('open');
        }
        handleLandingEvent(appEvent, handlers) {
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
        handleArticleEvent(appEvent, onClose) {
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
        clearActiveButtons() {
            this.elements.navigationButtons.forEach((button) => {
                const parent = button.parentElement;
                if (parent && parent.classList.contains('active')) {
                    parent.classList.remove('active');
                }
            });
        }
        getActiveButton(view) {
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
        renderView(view) {
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
        renderContactSection() {
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
        renderAboutMeSection() {
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
        renderServicesSection() {
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
        renderSocialMediaSection() {
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
        renderExperienceSection() {
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
        renderLegalSection(kind) {
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
    class AppState {
        context;
        controller;
        receivers = [];
        constructor(context, controller) {
            this.context = context;
            this.controller = controller;
        }
        handleEvent(appEvent) {
            this.receivers.forEach((receiver) => {
                receiver.handleEvent(appEvent);
            });
        }
    }
    class InteractiveState extends AppState {
        heroTracker = new HeroTracker();
        enter() {
            this.heroTracker.start();
            this.receivers.push(this.heroTracker);
        }
        exit() {
            this.heroTracker.stop();
            this.receivers.length = 0;
        }
        handleEvent(appEvent) {
            super.handleEvent(appEvent);
            this.controller.handleLandingEvent(appEvent, {
                onAboutMe: () => {
                    this.context.showArticle('about-me');
                },
                onContact: () => {
                    this.context.showArticle('contact');
                },
                onExperience: () => {
                    this.context.showArticle('experience');
                },
                onPrivacy: () => {
                    this.context.showArticle('privacy');
                },
                onServices: () => {
                    this.context.showArticle('services');
                },
                onSocialMedia: () => {
                    this.context.showArticle('social-media');
                },
                onTerms: () => {
                    this.context.showArticle('terms');
                }
            });
        }
    }
    class SplashState extends AppState {
        kind = AppStateKind.Splash;
        splashCanvas = new SplashCanvasController();
        timeoutId = 0;
        enter() {
            this.receivers.push(this.splashCanvas);
            this.splashCanvas.start();
            this.timeoutId = window.setTimeout(() => {
                this.context.showLanding();
            }, 2500);
        }
        exit() {
            if (this.timeoutId) {
                window.clearTimeout(this.timeoutId);
                this.timeoutId = 0;
            }
            this.splashCanvas.stop();
            this.receivers.length = 0;
        }
    }
    class LandingState extends InteractiveState {
        kind = AppStateKind.Landing;
        enter() {
            super.enter();
            this.controller.closeArticle();
        }
    }
    class ToggledState extends InteractiveState {
        kind = AppStateKind.Toggled;
        view;
        constructor(context, controller, view) {
            super(context, controller);
            this.view = view;
        }
        enter() {
            super.enter();
            this.controller.openArticle(this.view);
        }
        handleEvent(appEvent) {
            super.handleEvent(appEvent);
            this.controller.handleArticleEvent(appEvent, () => {
                this.context.showLanding();
            });
        }
    }
    class AppContext {
        controller;
        guard = new GuardController();
        cleanup;
        state = null;
        constructor(controller) {
            this.controller = controller;
            this.cleanup = this.bindEventSources();
        }
        start() {
            this.transitionTo(new SplashState(this, this.controller));
        }
        stop() {
            this.state?.exit();
            this.cleanup();
        }
        showArticle(view) {
            this.transitionTo(new ToggledState(this, this.controller, view));
        }
        showLanding() {
            this.transitionTo(new LandingState(this, this.controller));
        }
        bindEventSources() {
            return composeCleanups(this.bindDocumentEvent('click'), this.bindDocumentEvent('contextmenu'), this.bindDocumentEvent('dragstart'), this.bindDocumentEvent('drop'), this.bindDocumentEvent('focusin'), this.bindDocumentEvent('keydown'), this.bindDocumentEvent('pointerdown'), this.bindDocumentEvent('pointerleave'), this.bindDocumentEvent('pointermove'), this.bindDocumentEvent('pointerout'), this.bindDocumentEvent('pointerover'), addListener(window, 'resize', (event) => {
                this.dispatchEvent({ event, target: event.target, type: 'resize' });
            }));
        }
        bindDocumentEvent(type) {
            return addListener(document, type, (event) => {
                this.dispatchEvent({ event, target: event.target, type });
            });
        }
        dispatchEvent(appEvent) {
            this.guard.handleEvent(appEvent);
            this.state?.handleEvent(appEvent);
        }
        transitionTo(nextState) {
            this.state?.exit();
            this.state = nextState;
            this.state.enter();
        }
    }
    const elements = resolveElements();
    if (!elements) {
        const guard = new GuardController();
        composeCleanups(addListener(document, 'contextmenu', (event) => {
            guard.handleEvent({ event, target: event.target, type: 'contextmenu' });
        }), addListener(document, 'dragstart', (event) => {
            guard.handleEvent({ event, target: event.target, type: 'dragstart' });
        }), addListener(document, 'drop', (event) => {
            guard.handleEvent({ event, target: event.target, type: 'drop' });
        }));
        const splashCanvas = new SplashCanvasController();
        splashCanvas.start();
        addListener(window, 'resize', (event) => {
            splashCanvas.handleEvent({ event, target: event.target, type: 'resize' });
        });
    }
    else {
        const controller = new PageController(elements);
        const app = new AppContext(controller);
        app.start();
    }
}());
//# sourceMappingURL=index.js.map