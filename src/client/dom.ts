import type { AppElements, Cleanup, NullableElement } from './types';

export function addListener<TEvent extends Event>(
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

export function composeCleanups(...cleanups: Cleanup[]): Cleanup {
  return function cleanup(): void {
    cleanups.slice().reverse().forEach((teardown) => {
      teardown();
    });
  };
}

export function resolveElements(): AppElements | null {
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

export function isElementTarget(target: EventTarget | null): target is Element {
  return target instanceof Element;
}

export function isNodeTarget(target: EventTarget | null): target is Node {
  return target instanceof Node;
}

export function hitsElement(target: EventTarget | null, element: Element): boolean {
  return isNodeTarget(target) && element.contains(target);
}
