

void function()
{
  'use strict';

  function preventDefault(event)
  {
    event.preventDefault();
  }

  function setupSplashCanvas()
  {
    var canvas = document.getElementById('splash-canvas');
    var clip = document.getElementById('splash-signature-clip');
    var text = document.getElementById('splash-signature-text');
    var context;
    var currentProgress = 0;
    var startTime = 0;
    var delay = 70;
    var duration = 1250;
    var frame = 0;
    var frameFallback = 0;
    var layout;

    if (!canvas || !clip || !text || !canvas.getContext) {
      return;
    }

    context = canvas.getContext('2d');

    function ease(progress)
    {
      return 1 - Math.pow(1 - progress, 3);
    }

    function draw(progress)
    {
      var eased = ease(progress);
      var inkWidth = Math.max(0, layout.width - layout.inkInsetLeft - layout.inkInsetRight);
      var revealWidth = inkWidth * eased;
      var penX = layout.left + layout.inkInsetLeft + revealWidth;
      var penSwing = Math.sin((eased * Math.PI * 2.8) - .4);
      var penY = layout.top + (layout.height * .46) + (penSwing * layout.height * .055);
      var visibleWidth = Math.min(layout.width, layout.inkInsetLeft + revealWidth + layout.inkInsetRight + layout.clipPad);
      var rightInset = Math.max(0, layout.width - visibleWidth);

      clip.style.width = layout.width.toFixed(2) + 'px';
      text.style.clipPath = 'inset(0px ' + rightInset.toFixed(2) + 'px 0px 0px)';
      text.style.webkitClipPath = 'inset(0px ' + rightInset.toFixed(2) + 'px 0px 0px)';
      text.style.opacity = progress > .78 ? '1' : (.88 + (progress * .12)).toFixed(3);

      context.clearRect(0, 0, canvas.width, canvas.height);

      context.save();
      context.globalAlpha = .92;
      context.fillStyle = '#111';
      context.beginPath();
      context.arc(penX, penY, Math.max(1.4, layout.height * .016), 0, Math.PI * 2);
      context.fill();
      context.restore();
    }

    function resize()
    {
      var splashRect = canvas.parentElement.getBoundingClientRect();
      var textStyles;
      var textRect;

      canvas.width = Math.max(320, Math.round(splashRect.width));
      canvas.height = Math.max(120, Math.round(splashRect.height));
      clip.style.width = 'auto';
      textRect = text.getBoundingClientRect();
      textStyles = window.getComputedStyle(text);
      clip.style.width = textRect.width.toFixed(2) + 'px';
      layout = {
        left: (canvas.width - textRect.width) / 2,
        top: (canvas.height - textRect.height) / 2,
        width: textRect.width,
        height: textRect.height,
        inkInsetLeft: parseFloat(textStyles.paddingLeft) || 0,
        inkInsetRight: parseFloat(textStyles.paddingRight) || 0,
        clipPad: Math.max(28, textRect.height * .24)
      };
      draw(currentProgress);
    }

    function scheduleNextFrame()
    {
      frame = window.requestAnimationFrame(animate);
      frameFallback = window.setTimeout(function()
      {
        if (frame) {
          window.cancelAnimationFrame(frame);
          frame = 0;
          animate(performance.now());
        }
      }, 34);
    }

    function animate(timestamp)
    {
      if (frameFallback) {
        window.clearTimeout(frameFallback);
        frameFallback = 0;
      }

      if (!startTime) {
        startTime = timestamp;
      }

      currentProgress = Math.max(0, Math.min((timestamp - startTime - delay) / duration, 1));
      draw(currentProgress);

      if (currentProgress < 1) {
        scheduleNextFrame();
      } else {
        frame = 0;
        draw(1);
      }
    }

    function start()
    {
      resize();
      draw(.001);
      window.addEventListener('resize', resize);
      scheduleNextFrame();
    }

    if (document.fonts && document.fonts.ready) {
      Promise.race([
        Promise.all([
          document.fonts.ready,
          document.fonts.load('136px "Meow Script"'),
          document.fonts.load('136px "Segoe Script"')
        ]),
        new Promise(function(resolve)
        {
          window.setTimeout(resolve, 350);
        })
      ]).then(start).catch(start);
    } else {
      start();
    }
  }

  function trackHero()
  {
    var article = document.querySelector('.article');
    var banner = document.querySelector('.banner');
    var hero = document.querySelector('.banner .hero');
    var heroMaxX = 10;
    var heroMaxY = 6;
    var titleMaxX = 5;
    var titleMaxY = 3;
    var textMaxX = 4;
    var textMaxY = 2.5;
    var aboutHeroMaxX = 12;
    var aboutHeroMaxY = 7;
    var aboutCounterMaxX = 3;
    var aboutCounterMaxY = 1.5;
    var imageFrontMaxX = 8;
    var imageFrontMaxY = 5;
    var imageBackMaxX = 14;
    var imageBackMaxY = 8;
    var trackSpeed = .06; // Lower is slower/smoother, higher is faster/snappier.
    var imageTrackSpeed = .025; // Slower than text so the image stack drags behind.
    var idleDelay = 120;
    var targetReturnSpeed = .09;
    var position = { x: 0, y: 0 };
    var imagePosition = { x: 0, y: 0 };
    var target = { x: 0, y: 0 };
    var frame = 0;
    var lastMoveTime = 0;
    var pointerInside = true;
    var suspended = false;
    var suspendSelector = [
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

    if (!article || !banner || !hero) {
      return;
    }

    function render()
    {
      hero.style.setProperty('--hero-track-x', (position.x * heroMaxX).toFixed(2) + 'px');
      hero.style.setProperty('--hero-track-y', (position.y * heroMaxY).toFixed(2) + 'px');
      banner.style.setProperty('--title-track-x', (position.x * -titleMaxX).toFixed(2) + 'px');
      banner.style.setProperty('--title-track-y', (position.y * -titleMaxY).toFixed(2) + 'px');
      banner.style.setProperty('--text-track-x', (position.x * textMaxX).toFixed(2) + 'px');
      banner.style.setProperty('--text-track-y', (position.y * textMaxY).toFixed(2) + 'px');
      article.style.setProperty('--about-hero-track-x', (position.x * aboutHeroMaxX).toFixed(2) + 'px');
      article.style.setProperty('--about-hero-track-y', (position.y * aboutHeroMaxY).toFixed(2) + 'px');
      article.style.setProperty('--about-hero-counter-x', (position.x * -aboutCounterMaxX).toFixed(2) + 'px');
      article.style.setProperty('--about-hero-counter-y', (position.y * -aboutCounterMaxY).toFixed(2) + 'px');
      article.style.setProperty('--about-image-front-x', (imagePosition.x * imageFrontMaxX).toFixed(2) + 'px');
      article.style.setProperty('--about-image-front-y', (imagePosition.y * imageFrontMaxY).toFixed(2) + 'px');
      article.style.setProperty('--about-image-back-x', (imagePosition.x * -imageBackMaxX).toFixed(2) + 'px');
      article.style.setProperty('--about-image-back-y', (imagePosition.y * -imageBackMaxY).toFixed(2) + 'px');
    }

    function easeBackToOrigin()
    {
      target.x = 0;
      target.y = 0;
      pointerInside = false;
      lastMoveTime = 0;
      requestAnimation();
    }

    function shouldSuspend(targetNode)
    {
      return !!(targetNode && targetNode.closest && targetNode.closest(suspendSelector));
    }

    function animate(timestamp)
    {
      if (!lastMoveTime) {
        lastMoveTime = timestamp;
      }

      if (!pointerInside || (timestamp - lastMoveTime) >= idleDelay) {
        target.x += (0 - target.x) * targetReturnSpeed;
        target.y += (0 - target.y) * targetReturnSpeed;
      }

      position.x += (target.x - position.x) * trackSpeed;
      position.y += (target.y - position.y) * trackSpeed;
      imagePosition.x += (target.x - imagePosition.x) * imageTrackSpeed;
      imagePosition.y += (target.y - imagePosition.y) * imageTrackSpeed;

      render();

      if (
        Math.abs(target.x - position.x) > .001 ||
        Math.abs(target.y - position.y) > .001 ||
        Math.abs(target.x - imagePosition.x) > .001 ||
        Math.abs(target.y - imagePosition.y) > .001
      ) {
        frame = window.requestAnimationFrame(animate);
      } else {
        frame = 0;
      }
    }

    function requestAnimation()
    {
      if (!frame) {
        frame = window.requestAnimationFrame(animate);
      }
    }

    function updateHero(event)
    {
      if (shouldSuspend(event.target)) {
        suspended = true;
        easeBackToOrigin();
        return;
      }

      suspended = false;
      pointerInside = true;
      lastMoveTime = performance.now();
      target.x = ((event.clientX / window.innerWidth) - .5) * 2;
      target.y = ((event.clientY / window.innerHeight) - .5) * 2;

      requestAnimation();
    }

    function resetHero()
    {
      if (suspended) {
        easeBackToOrigin();
        return;
      }

      pointerInside = false;
      lastMoveTime = 0;

      requestAnimation();
    }

    function suspendTracking()
    {
      suspended = true;
      easeBackToOrigin();
    }

    function resumeTracking(event)
    {
      if (shouldSuspend(event.target)) {
        return;
      }

      suspended = false;
      updateHero(event);
    }

    document.addEventListener('pointermove', updateHero);
    document.addEventListener('pointerleave', resetHero);
    document.addEventListener('pointerdown', suspendTracking);
    document.addEventListener('focusin', suspendTracking);
    document.addEventListener('keydown', suspendTracking);
    document.addEventListener('pointerover', function(event)
    {
      if (shouldSuspend(event.target)) {
        suspendTracking();
      }
    });
    document.addEventListener('pointerout', function(event)
    {
      var relatedTarget = event.relatedTarget;

      if (!relatedTarget || shouldSuspend(relatedTarget)) {
        return;
      }

      resumeTracking(event);
    });
  }

  document.addEventListener('contextmenu', preventDefault);
  document.addEventListener('dragstart', preventDefault);
  document.addEventListener('drop', preventDefault);
  setupSplashCanvas();

  const targetElement = document.getElementById('article');

  const experienceButton = document.getElementById('experience-cta');
  const servicesButton = document.getElementById('services-cta');
  const aboutMeButton = document.getElementById('about-me-cta');
  const socialMediaButton = document.getElementById('social-media-cta');
  const termsButton = document.getElementById('terms-cta');
  const privacyButton = document.getElementById('privacy-cta');

  const buttons = [
    experienceButton,
    servicesButton,
    aboutMeButton,
    socialMediaButton,
  ];

  function clearActiveButtons()
  {
    buttons.forEach(button =>
    {
      if (button.parentElement.classList.contains('active'))
      {
        button.parentElement.classList.remove('active');
      }
    });
  }

  function bindClose()
  {
    document.getElementById('close').addEventListener('click', function(event)
    {
      if (event.preventDefault)
      {
        event.preventDefault();
      }

      clearActiveButtons();

      if (targetElement.classList.contains('open'))
      {
        targetElement.classList.remove('open');
      }
    });
  }

  function openArticle(activeButton)
  {
    clearActiveButtons();

    if (activeButton && activeButton.parentElement.classList.contains('active') == false)
    {
      activeButton.parentElement.classList.add('active');
    }

    if (targetElement.classList.contains('open') == false)
    {
      targetElement.classList.add('open');
    }

    bindClose();
  }

  function renderContactSection()
  {
    targetElement.innerHTML = `
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

    openArticle(null);

    document.getElementById('copy-email').addEventListener('click', function(event)
    {
      if (event.preventDefault)
      {
        event.preventDefault();
      }

      if (navigator.clipboard && navigator.clipboard.writeText)
      {
        navigator.clipboard.writeText('contact@dajourchristophe.com');
      }
    });
  }

  function renderSocialMediaSection()
  {
    targetElement.innerHTML = `
<section class="section social-media">
  <button class="button" id="close">
    x
  </button>
  <div class="shell">
    <label class="eyebrow"><span class="dot"></span> SOCIAL</label>
    <h2 class="hero">Connect<br>With Me</h2>
    <p class="lede">A few places I share ideas, build in public, and connect with the community.</p>
    <ul class="social-list">
      <li class="social-item">
        <a class="social-link" href="https://www.instagram.com" target="_blank" rel="noreferrer">
          <span class="icon-box">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
              <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.2 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.5 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.9-26.9 26.9-14.9 0-26.9-12-26.9-26.9 0-14.9 12-26.9 26.9-26.9 14.9 0 26.9 12 26.9 26.9zM398.8 163c-3.9-35.3-13.5-66.6-39.4-92.5S302.2 35 266.9 31.2c-36-4.1-143.8-4.1-179.8 0-35.2 3.9-66.5 13.5-92.5 39.4S35 129.8 31.2 165.1c-4.1 36-4.1 143.8 0 179.8 3.9 35.2 13.5 66.5 39.4 92.5s57.3 35.5 92.5 39.4c36 4.1 143.8 4.1 179.8 0 35.2-3.9 66.5-13.5 92.5-39.4s35.5-57.3 39.4-92.5c4.1-36 4.1-143.7 0-179.7zm-48.2 218c-7.7 19.4-22.7 34.4-42.1 42.1-29.1 11.5-98.1 8.9-130.4 8.9s-101.4 2.6-130.4-8.9c-19.4-7.7-34.4-22.7-42.1-42.1-11.5-29.1-8.9-98.1-8.9-130.4s-2.6-101.4 8.9-130.4c7.7-19.4 22.7-34.4 42.1-42.1 29.1-11.5 98.1-8.9 130.4-8.9s101.4-2.6 130.4 8.9c19.4 7.7 34.4 22.7 42.1 42.1 11.5 29.1 8.9 98.1 8.9 130.4s2.7 101.3-8.9 130.4z"/>
            </svg>
          </span>
          <span class="name">Instagram</span>
          <span class="arrow">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
              <path d="M512 128C529.7 128 544 142.3 544 160L544 352C544 369.7 529.7 384 512 384C494.3 384 480 369.7 480 352L480 237.3L150.6 566.6C138.1 579.1 117.8 579.1 105.3 566.6C92.8 554.1 92.8 533.8 105.3 521.3L434.7 192L320 192C302.3 192 288 177.7 288 160C288 142.3 302.3 128 320 128L512 128z"/>
            </svg>
          </span>
        </a>
      </li>
      <li class="social-item">
        <a class="social-link" href="https://www.facebook.com" target="_blank" rel="noreferrer">
          <span class="icon-box">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
              <path d="M279.1 288l14.2-92.7h-88.9v-60.1c0-25.4 12.4-50.1 52.2-50.1H297V6.3S260.7 0 226 0c-73.2 0-121.1 44.4-121.1 124.7v70.6H23.4V288h81.5v224h99.5V288h74.7z"/>
            </svg>
          </span>
          <span class="name">Facebook</span>
          <span class="arrow">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
              <path d="M512 128C529.7 128 544 142.3 544 160L544 352C544 369.7 529.7 384 512 384C494.3 384 480 369.7 480 352L480 237.3L150.6 566.6C138.1 579.1 117.8 579.1 105.3 566.6C92.8 554.1 92.8 533.8 105.3 521.3L434.7 192L320 192C302.3 192 288 177.7 288 160C288 142.3 302.3 128 320 128L512 128z"/>
            </svg>
          </span>
        </a>
      </li>
      <li class="social-item">
        <a class="social-link" href="https://www.linkedin.com" target="_blank" rel="noreferrer">
          <span class="icon-box">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
              <path d="M100.28 448H7.4V148.9h92.88zm-46.44-341C24.3 107 0 82.7 0 53.84A53.84 53.84 0 0 1 53.84 0a53.84 53.84 0 0 1 53.84 53.84c0 28.86-24.3 53.16-53.84 53.16zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.3 0-55.7 37.7-55.7 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.7-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z"/>
            </svg>
          </span>
          <span class="name">LinkedIn</span>
          <span class="arrow">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
              <path d="M512 128C529.7 128 544 142.3 544 160L544 352C544 369.7 529.7 384 512 384C494.3 384 480 369.7 480 352L480 237.3L150.6 566.6C138.1 579.1 117.8 579.1 105.3 566.6C92.8 554.1 92.8 533.8 105.3 521.3L434.7 192L320 192C302.3 192 288 177.7 288 160C288 142.3 302.3 128 320 128L512 128z"/>
            </svg>
          </span>
        </a>
      </li>
      <li class="social-item">
        <a class="social-link" href="https://github.com" target="_blank" rel="noreferrer">
          <span class="icon-box">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512">
              <path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-2.9 .3-5.2-1.3-5.2-3.6 0-2 2.3-3.6 5.2-3.6 2.9-.3 5.2 1.3 5.2 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.9 1 5.9 0 6.5-2 .7-2-1.3-4.3-4.3-5.2-2.9-.9-5.9 0-6.5 2.3zm44.2 .4c-2.9 .7-4.9 2.9-4.3 4.9 .7 2 3.6 3 6.5 2.3 2.9-.7 4.9-2.9 4.3-4.9-.7-2-3.6-3-6.5-2.3zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 71.9 205.1 171.5 238.3 12.5 2.3 17.1-5.4 17.1-12 0-5.9-.3-25.6-.3-46.5-69.7 15.1-84.4-29.6-84.4-29.6-11.4-29-27.8-36.7-27.8-36.7-22.7-15.4 1.6-15.1 1.6-15.1 25.2 1.6 38.4 25.9 38.4 25.9 22.3 38.1 58.5 27.1 72.8 20.7 2.3-16.1 8.7-27.1 15.8-33.3-55.7-6.2-114.3-27.8-114.3-124 0-27.5 9.7-49.8 25.9-67.3-2.6-6.2-11.2-31.4 2.6-65.4 0 0 21-6.5 68.6 25.9 20-5.6 41.5-8.4 62.8-8.4s42.8 2.8 62.8 8.4c47.6-32.4 68.6-25.9 68.6-25.9 13.8 34 5.2 59.2 2.6 65.4 16.1 17.4 25.9 39.8 25.9 67.3 0 96.5-58.8 117.8-114.8 124 9 7.7 17.1 22.8 17.1 46 0 33.2-.3 59.9-.3 68 0 6.5 4.5 14.3 17.1 12C424.1 457.1 496 362.9 496 252 496 113.3 383.5 8 244.8 8z"/>
            </svg>
          </span>
          <span class="name">GitHub</span>
          <span class="arrow">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
              <path d="M512 128C529.7 128 544 142.3 544 160L544 352C544 369.7 529.7 384 512 384C494.3 384 480 369.7 480 352L480 237.3L150.6 566.6C138.1 579.1 117.8 579.1 105.3 566.6C92.8 554.1 92.8 533.8 105.3 521.3L434.7 192L320 192C302.3 192 288 177.7 288 160C288 142.3 302.3 128 320 128L512 128z"/>
            </svg>
          </span>
        </a>
      </li>
    </ul>
    <label class="footer-note">BUILDING IN PUBLIC. SHARING THE JOURNEY.</label>
  </div>
</section>
`;

    openArticle(socialMediaButton);
  }

  function renderExperienceSection()
  {
    targetElement.innerHTML = `
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
        <a class="cta" href="#" aria-label="View Cycle Philly case study">
          <span>View Case Study</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
            <path d="M512 128C529.7 128 544 142.3 544 160L544 352C544 369.7 529.7 384 512 384C494.3 384 480 369.7 480 352L480 237.3L150.6 566.6C138.1 579.1 117.8 579.1 105.3 566.6C92.8 554.1 92.8 533.8 105.3 521.3L434.7 192L320 192C302.3 192 288 177.7 288 160C288 142.3 302.3 128 320 128L512 128z"/>
          </svg>
        </a>
      </div>
      <span class="watermark">CYCLE PHILLY</span>
    </div>
    <div class="visual">
      <span class="meta">DATA &nbsp;•&nbsp; MOBILITY &nbsp;•&nbsp; IMPACT</span>
    </div>
  </div>
</section>
`;

    openArticle(experienceButton);
  }

  function renderLegalSection(kind)
  {
    var isTerms = kind === 'terms';
    var title = isTerms ? 'Terms of Service' : 'Privacy Policy';
    var eyebrow = isTerms ? 'TERMS' : 'PRIVACY';
    var updated = 'Last updated: April 8, 2026';
    var intro = isTerms
      ? 'These terms govern use of this site, project inquiries, and any collaboration that may follow. They are written to set expectations clearly and keep communication straightforward.'
      : 'This policy explains what information may be collected through this site, how it is used, and the principles that guide how contact and inquiry information is handled.';
    var sections = isTerms ? `
      <div class="legal-block">
        <h3>Use of this site</h3>
        <p>This site is intended to present professional work, services, and ways to get in touch. You may browse, reference, and share public content for informational purposes, but you may not misuse the site, attempt to disrupt it, or represent its content as your own.</p>
      </div>
      <div class="legal-block">
        <h3>Project inquiries</h3>
        <p>Submitting a message or inquiry does not create a client relationship, partnership, or guarantee of availability. Any engagement begins only after mutual written agreement on scope, terms, and expectations.</p>
      </div>
      <div class="legal-block">
        <h3>Intellectual property</h3>
        <p>Unless otherwise noted, the content, writing, visuals, and project materials presented here remain the property of their respective owner. Case study material may reference third-party platforms, organizations, or datasets for descriptive purposes only.</p>
      </div>
      <div class="legal-block">
        <h3>No warranty</h3>
        <p>This site and its contents are provided as-is for general information. While every effort is made to keep the material accurate and current, no warranty is made regarding completeness, suitability, or uninterrupted availability.</p>
      </div>
    ` : `
      <div class="legal-block">
        <h3>Information you provide</h3>
        <p>If you choose to make contact, information such as your name, email address, organization, and message details may be received solely for the purpose of reviewing and responding to your inquiry.</p>
      </div>
      <div class="legal-block">
        <h3>How information is used</h3>
        <p>Contact information is used to reply to inquiries, evaluate project fit, and continue relevant conversations. It is not sold, rented, or used for unrelated marketing campaigns.</p>
      </div>
      <div class="legal-block">
        <h3>Retention and security</h3>
        <p>Reasonable care is taken to handle inquiry information responsibly. Information is retained only as long as needed to manage communication, maintain records related to a project discussion, or satisfy legitimate operational needs.</p>
      </div>
      <div class="legal-block">
        <h3>Third-party services</h3>
        <p>External links and embedded services may have their own privacy practices. If you follow a link to another platform, that platform&apos;s policies control what happens there.</p>
      </div>
    `;

    targetElement.innerHTML = `
<section class="section legal">
  <button class="button" id="close">
    x
  </button>
  <div class="shell">
    <label class="eyebrow"><span class="dot"></span> ${eyebrow}</label>
    <div class="header">
      <h2 class="hero">${title}</h2>
      <span class="updated">${updated}</span>
    </div>
    <p class="lede">${intro}</p>
    <div class="content">
      ${sections}
    </div>
    <div class="footer-note">
      <span>For questions about these policies, email <a href="mailto:contact@dajourchristophe.com">contact@dajourchristophe.com</a>.</span>
    </div>
  </div>
</section>
`;

    openArticle(null);
  }

  document.getElementById('open-cta').addEventListener('click', function(event)
  {
    if (event.preventDefault)
    {
      event.preventDefault();
    }

    renderExperienceSection();
  });

  document.getElementById('work-with-me-cta').addEventListener('click', function(event)
  {
    if (event.preventDefault)
    {
      event.preventDefault();
    }

    renderContactSection();
  });

  experienceButton.addEventListener('click', function(event)
  {
    if (event.preventDefault)
    {
      event.preventDefault();
    }

    renderExperienceSection();
  });

  servicesButton.addEventListener('click', function(event)
  {
    if (event.preventDefault)
    {
      event.preventDefault();
    }

    targetElement.innerHTML = `
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
        <span >CLEAR THINKING. COMPLEX SYSTEMS. MEASURABLE RESULTS.</span>
      </li>
      <li class="list-item">
        <button>
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

    openArticle(servicesButton);
  });

  aboutMeButton.addEventListener('click', function(event)
  {
    if (event.preventDefault)
    {
      event.preventDefault();
    }

    targetElement.innerHTML = `
<section class="section about-me">
  <button class="button" id="close">
    x
  </button>
  <ul class="list">
    <li class="list-item">
      <hr>
      <h1 class="title">
        Hey, I'm<br><span class="highlight">Da'Jour J. Christophe</span>
        <span class="sub">Engineering intelligence from first principles</span>
      </h1>
      <p class="text">I engineer adaptive systems that learn, evolve, and perform under real-world constraints. My work combines deep technical rigor with first-principles thinking—building intelligence from the ground up, not from assumptions.<br><br>Prior to his military service, Christophe worked as a <strong>Software Engineer at Drexel University</strong> in Philadelphia, where he designed and developed software systems in a production environment. Building on this experience, he later enlisted in the United States Air Force and served for over eight years.<br><br>After his transition back to civilian life, he transformed that experience into a defining inflection point—leveraging <strong>more than a decade of experience in software design and engineering</strong> to pivot into Data Science. Today, his work focuses on <strong style="color: #000; background-color: #efefef;">experimental, low-latency, end-to-end meta-learning architectures</strong>, with an emphasis on building adaptive systems that operate efficiently in dynamic environments.</p>
      <a class="link" id="get-in-touch-cta">Let’s Build</a>
    </li>
    <li class="list-item">
      <figure class="fig">
        <img src="../assets/img/profile2.jpg" alt="#" class="img" />
        <img src="../assets/img/profile2.jpg" alt="#" class="img" />
      </figure>
      <span class="quote" style="color: #111"><em>"I don’t follow systems. I design them."</em><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #333;">— Da'Jour J. Christophe</span></span>
    </li>
  </ul>
  <label class="label">UNMATCHED</label>
  <label class="label">UNMATCHED</label>
  <label class="label">UNMATCHED</label>
  <label class="label">UNMATCHED</label>
  <label class="label">UNMATCHED</label>
</section>
`;

    document.getElementById('get-in-touch-cta').addEventListener('click', function(event)
    {
      if (event.preventDefault)
      {
        event.preventDefault();
      }

      renderContactSection();
    });

    openArticle(aboutMeButton);
  });

  socialMediaButton.addEventListener('click', function(event)
  {
    if (event.preventDefault)
    {
      event.preventDefault();
    }

    renderSocialMediaSection();
  });

  termsButton.addEventListener('click', function(event)
  {
    if (event.preventDefault)
    {
      event.preventDefault();
    }

    renderLegalSection('terms');
  });

  privacyButton.addEventListener('click', function(event)
  {
    if (event.preventDefault)
    {
      event.preventDefault();
    }

    renderLegalSection('privacy');
  });

  trackHero();

}();
