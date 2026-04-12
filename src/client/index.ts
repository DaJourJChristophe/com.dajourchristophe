import { addListener, composeCleanups, resolveElements } from './dom';
import { AppContext } from './app-context';
import { GuardController } from './guard-controller';
import { PageController } from './page-controller';
import { SplashCanvasController } from './splash-canvas-controller';

/**
 * Forces the document scroll position back to the top-left corner.
 *
 * @returns Nothing.
 */
function resetScrollPosition(): void {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

resetScrollPosition();
addListener<PageTransitionEvent>(window, 'pageshow', (): void => {
  resetScrollPosition();
});

/**
 * Resolved static shell elements required for the full interactive app.
 */
const elements = resolveElements();

if (!elements) {
  /**
   * Minimal fallback path used when the full page shell is unavailable.
   *
   * This keeps interaction guards and the splash animation alive without
   * attempting to boot the full state machine.
   */
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
  /**
   * Full application boot path for the generated portfolio shell.
   */
  const controller = new PageController(elements);
  const app = new AppContext(controller, elements.pageRoot);

  app.start();
}
