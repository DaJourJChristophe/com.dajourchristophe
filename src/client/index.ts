import { addListener, composeCleanups, resolveElements } from './dom';
import { AppContext } from './app-context';
import { GuardController } from './guard-controller';
import { PageController } from './page-controller';
import { SplashCanvasController } from './splash-canvas-controller';

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
