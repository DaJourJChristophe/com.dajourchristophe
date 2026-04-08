

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

  const buttons = [
    experienceButton,
    servicesButton,
    aboutMeButton,
    socialMediaButton,
  ];

  document.getElementById('open-cta').addEventListener('click', function(event)
  {
    if (event.preventDefault)
    {
      event.preventDefault();
    }

    targetElement.innerHTML = `
<section class="section experience">
  <button class="button" id="close">
    x
  </button>
  <h3 class="title">Cycle Philly</h3>
  <p class="text">Cras vehicula sodales tempus. Maecenas dictum, turpis vel maximus semper, libero diam accumsan sem, sed sollicitudin nunc augue tristique purus. Donec eleifend luctus.</p>
</section>
`;

    document.getElementById('close').addEventListener('click', function(event)
    {
      if (event.preventDefault)
      {
        event.preventDefault();
      }

      buttons.forEach(button =>
      {
        if (button.parentElement.classList.contains('active'))
        {
          button.parentElement.classList.remove('active');
        }
      });

      if (targetElement.classList.contains('open'))
      {
        targetElement.classList.remove('open');
      }
    });

    buttons.forEach(button =>
    {
      if (button.parentElement.classList.contains('active'))
      {
        button.parentElement.classList.remove('active');
      }
    });

    if (experienceButton.parentElement.classList.contains('active') == false)
    {
      experienceButton.parentElement.classList.add('active');
    }

    if (targetElement.classList.contains('open') == false)
    {
      targetElement.classList.add('open');
    }
  });

  document.getElementById('work-with-me-cta').addEventListener('click', function(event)
  {
    if (event.preventDefault)
    {
      event.preventDefault();
    }

    targetElement.innerHTML = `
<section class="section">
  <button class="button" id="close">
    x
  </button>
  contact
</section>
`;

    document.getElementById('close').addEventListener('click', function(event)
    {
      if (event.preventDefault)
      {
        event.preventDefault();
      }

      buttons.forEach(button =>
      {
        if (button.parentElement.classList.contains('active'))
        {
          button.parentElement.classList.remove('active');
        }
      });

      if (targetElement.classList.contains('open'))
      {
        targetElement.classList.remove('open');
      }
    });

    buttons.forEach(button =>
    {
      if (button.parentElement.classList.contains('active'))
      {
        button.parentElement.classList.remove('active');
      }
    });

    if (targetElement.classList.contains('open') == false)
    {
      targetElement.classList.add('open');
    }
  });

  experienceButton.addEventListener('click', function(event)
  {
    if (event.preventDefault)
    {
      event.preventDefault();
    }

    targetElement.innerHTML = `
<section class="section experience">
  <button class="button" id="close">
    x
  </button>
  <div class="bubble">
    <h3 class="title">Cycle Philly</h3>
    <p class="text">Cras vehicula sodales tempus. Maecenas dictum, turpis vel maximus semper, libero diam accumsan sem, sed sollicitudin nunc augue tristique purus. Donec eleifend luctus.</p>
  </div>
  </section>
`;

    document.getElementById('close').addEventListener('click', function(event)
    {
      if (event.preventDefault)
      {
        event.preventDefault();
      }

      buttons.forEach(button =>
      {
        if (button.parentElement.classList.contains('active'))
        {
          button.parentElement.classList.remove('active');
        }
      });

      if (targetElement.classList.contains('open'))
      {
        targetElement.classList.remove('open');
      }
    });

    buttons.forEach(button =>
    {
      if (button.parentElement.classList.contains('active'))
      {
        button.parentElement.classList.remove('active');
      }
    });

    if (experienceButton.parentElement.classList.contains('active') == false)
    {
      experienceButton.parentElement.classList.add('active');
    }

    if (targetElement.classList.contains('open') == false)
    {
      targetElement.classList.add('open');
    }
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
  <ul class="list">
    <li class="list-item">x</li>
    <li class="list-item">x</li>
    <li class="list-item">x</li>
  </ul>
</section>
`;

    document.getElementById('close').addEventListener('click', function(event)
    {
      if (event.preventDefault)
      {
        event.preventDefault();
      }

      buttons.forEach(button =>
      {
        if (button.parentElement.classList.contains('active'))
        {
          button.parentElement.classList.remove('active');
        }
      });

      if (targetElement.classList.contains('open'))
      {
        targetElement.classList.remove('open');
      }
    });

    buttons.forEach(button =>
    {
      if (button.parentElement.classList.contains('active'))
      {
        button.parentElement.classList.remove('active');
      }
    });

    if (servicesButton.parentElement.classList.contains('active') == false)
    {
      servicesButton.parentElement.classList.add('active');
    }

    if (targetElement.classList.contains('open') == false)
    {
      targetElement.classList.add('open');
    }
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

    document.getElementById('close').addEventListener('click', function(event)
    {
      if (event.preventDefault)
      {
        event.preventDefault();
      }

      buttons.forEach(button =>
      {
        if (button.parentElement.classList.contains('active'))
        {
          button.parentElement.classList.remove('active');
        }
      });

      if (targetElement.classList.contains('open'))
      {
        targetElement.classList.remove('open');
      }
    });

    document.getElementById('get-in-touch-cta').addEventListener('click', function(event)
    {
      if (event.preventDefault)
      {
        event.preventDefault();
      }

      targetElement.innerHTML = `
  <section class="section">
    <button class="button" id="close">
      x
    </button>
    contact
  </section>
  `;

      document.getElementById('close').addEventListener('click', function(event)
      {
        if (event.preventDefault)
        {
          event.preventDefault();
        }

        buttons.forEach(button =>
        {
          if (button.parentElement.classList.contains('active'))
          {
            button.parentElement.classList.remove('active');
          }
        });

        if (targetElement.classList.contains('open'))
        {
          targetElement.classList.remove('open');
        }
      });

      buttons.forEach(button =>
      {
        if (button.parentElement.classList.contains('active'))
        {
          button.parentElement.classList.remove('active');
        }
      });

      if (targetElement.classList.contains('open') == false)
      {
        targetElement.classList.add('open');
      }
    });

    buttons.forEach(button =>
    {
      if (button.parentElement.classList.contains('active'))
      {
        button.parentElement.classList.remove('active');
      }
    });

    if (aboutMeButton.parentElement.classList.contains('active') == false)
    {
      aboutMeButton.parentElement.classList.add('active');
    }

    if (targetElement.classList.contains('open') == false)
    {
      targetElement.classList.add('open');
    }
  });

  socialMediaButton.addEventListener('click', function(event)
  {
    if (event.preventDefault)
    {
      event.preventDefault();
    }

    targetElement.innerHTML = `
<section class="section social-media">
  <button class="button" id="close">
    x
  </button>
  social media
</section>
`;

    document.getElementById('close').addEventListener('click', function(event)
    {
      if (event.preventDefault)
      {
        event.preventDefault();
      }

      buttons.forEach(button =>
      {
        if (button.parentElement.classList.contains('active'))
        {
          button.parentElement.classList.remove('active');
        }
      });

      if (targetElement.classList.contains('open'))
      {
        targetElement.classList.remove('open');
      }
    });

    buttons.forEach(button =>
    {
      if (button.parentElement.classList.contains('active'))
      {
        button.parentElement.classList.remove('active');
      }
    });

    if (socialMediaButton.parentElement.classList.contains('active') == false)
    {
      socialMediaButton.parentElement.classList.add('active');
    }

    if (targetElement.classList.contains('open') == false)
    {
      targetElement.classList.add('open');
    }
  });

  trackHero();

}();
