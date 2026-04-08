

void function()
{
  'use strict';

  function preventDefault(event)
  {
    event.preventDefault();
  }

  function trackHero()
  {
    var article = document.querySelector('.article');
    var banner = document.querySelector('.banner');
    var hero = document.querySelector('.banner .hero');
    var heroMaxX = 12;
    var heroMaxY = 8;
    var titleMaxX = 6;
    var titleMaxY = 4;
    var textMaxX = 5;
    var textMaxY = 3;
    var aboutHeroMaxX = 14;
    var aboutHeroMaxY = 8;
    var aboutCounterMaxX = 4;
    var aboutCounterMaxY = 2;
    var imageFrontMaxX = 10;
    var imageFrontMaxY = 6;
    var imageBackMaxX = 18;
    var imageBackMaxY = 10;
    var trackSpeed = .12; // Lower is slower/smoother, higher is faster/snappier.
    var imageTrackSpeed = .045; // Slower than text so the image stack drags behind.
    var position = { x: 0, y: 0 };
    var imagePosition = { x: 0, y: 0 };
    var target = { x: 0, y: 0 };
    var frame = 0;

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

    function animate()
    {
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
      target.x = ((event.clientX / window.innerWidth) - .5) * 2;
      target.y = ((event.clientY / window.innerHeight) - .5) * 2;

      requestAnimation();
    }

    function resetHero()
    {
      target.x = 0;
      target.y = 0;

      requestAnimation();
    }

    document.addEventListener('pointermove', updateHero);
    document.addEventListener('pointerleave', resetHero);
  }

  document.addEventListener('contextmenu', preventDefault);
  document.addEventListener('dragstart', preventDefault);
  document.addEventListener('drop', preventDefault);

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
