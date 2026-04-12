import type { AppElements, Cleanup, NullableElement } from './types';

/**
 * Registers a DOM event listener and returns a cleanup callback for it.
 *
 * @typeParam TEvent - Native event type expected by the listener.
 * @param target - Event target to attach to.
 * @param type - Browser event name.
 * @param listener - Strongly typed event callback.
 * @returns Cleanup callback that removes the listener.
 */
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

/**
 * Composes multiple teardown callbacks into one reverse-order cleanup.
 *
 * @param cleanups - Cleanup callbacks to run when tearing down a state.
 * @returns Cleanup callback that invokes each provided cleanup in reverse order.
 */
export function composeCleanups(...cleanups: Cleanup[]): Cleanup {
  return function cleanup(): void {
    cleanups.slice().reverse().forEach((teardown) => {
      teardown();
    });
  };
}

/**
 * Resolves all static DOM elements required by the client shell.
 *
 * @returns Resolved element bag when the shell exists; otherwise `null`.
 */
export function resolveElements(): AppElements | null {
  const pageRoot = document.getElementById('body') as NullableElement<HTMLElement>;
  const bannerElement = document.getElementById('banner') as NullableElement<HTMLElement>;
  const footerElement = document.getElementById('footer') as NullableElement<HTMLElement>;
  const leftMenuElement = document.getElementById('left-menu') as NullableElement<HTMLElement>;
  const spacerElement = document.getElementById('spacer') as NullableElement<HTMLElement>;
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
    !pageRoot ||
    !bannerElement ||
    !footerElement ||
    !leftMenuElement ||
    !spacerElement ||
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
    bannerElement,
    experienceButton,
    footerElement,
    leftMenuElement,
    openCtaButton,
    pageRoot,
    privacyButton,
    servicesButton,
    socialMediaButton,
    spacerElement,
    termsButton,
    workWithMeButton,
    navigationButtons: [experienceButton, servicesButton, aboutMeButton, socialMediaButton]
  };
}

/**
 * Narrows an event target to a DOM `Element`.
 *
 * @param target - Event target to inspect.
 * @returns `true` when the target is an `Element`.
 */
export function isElementTarget(target: EventTarget | null): target is Element {
  return target instanceof Element;
}

/**
 * Narrows an event target to a DOM `Node`.
 *
 * @param target - Event target to inspect.
 * @returns `true` when the target is a `Node`.
 */
export function isNodeTarget(target: EventTarget | null): target is Node {
  return target instanceof Node;
}

/**
 * Checks whether an event target is contained within an element.
 *
 * @param target - Event target to test.
 * @param element - Potential ancestor element.
 * @returns `true` when `target` is a node inside `element`.
 */
export function hitsElement(target: EventTarget | null, element: Element): boolean {
  return isNodeTarget(target) && element.contains(target);
}
