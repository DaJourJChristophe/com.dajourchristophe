

void function()
{
  'use strict';

  function preventDefault(event)
  {
    event.preventDefault();
  }

  function trackHero()
  {
    var banner = document.querySelector('.banner');
    var hero = document.querySelector('.banner .hero');
    var heroMaxX = 12;
    var heroMaxY = 8;
    var titleMaxX = 6;
    var titleMaxY = 4;
    var textMaxX = 5;
    var textMaxY = 3;
    var trackSpeed = .07; // Lower is slower/smoother, higher is faster/snappier.
    var position = { x: 0, y: 0 };
    var target = { x: 0, y: 0 };
    var frame = 0;

    if (!banner || !hero) {
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
    }

    function animate()
    {
      position.x += (target.x - position.x) * trackSpeed;
      position.y += (target.y - position.y) * trackSpeed;

      render();

      if (Math.abs(target.x - position.x) > .001 || Math.abs(target.y - position.y) > .001) {
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
  <h1 class="title">
    Hey, I'm <span class="highlight">Da'Jour J. Christophe</span>
    <span class="sub">UX/UI Designer</span>
  </h1>
  <p class="text">Morbi magna leo, laoreet vitae gravida sit amet, luctus ut lorem. Aliquam metus nisi, pulvinar nec ex eget, ultricies efficitur leo. Phasellus vel augue et dui malesuada gravida ultrices sed augue. Curabitur molestie convallis feugiat. Vivamus rutrum elit et ligula rutrum, non rutrum est mattis. Suspendisse potenti. Duis posuere lectus vel tortor consequat sollicitudin. Vestibulum finibus a diam non rutrum. Vivamus quis urna eros. Quisque tincidunt eros id lectus congue, quis faucibus justo iaculis. Vivamus eu faucibus purus. Morbi finibus porta turpis a tempor. Duis porttitor efficitur quam in dapibus.<br><br>Quisque vel accumsan urna, eget luctus ipsum. Vestibulum metus ante, maximus quis varius in, euismod porta est. Fusce tincidunt fringilla ex, eget consequat quam dignissim ac.</p>
  <a class="link">Get In Touch</a>
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
