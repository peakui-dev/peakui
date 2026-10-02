import {installPointerEvent} from "@react-aria/test-utils";
import "@testing-library/jest-dom/vitest";

/*
 * Без этого файла тесты RAC не запускаются вообще, а не «работают хуже»: usePress требует
 * PointerEvent, которого в jsdom нет, а оверлеи и измеряемые раскладки спрашивают API, которых
 * jsdom не реализует. Каждая заглушка под проверкой на отсутствие — чтобы не затирать настоящую
 * реализацию, если среда её однажды получит.
 */

installPointerEvent();

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (typeof window.matchMedia !== "function") {
  Object.defineProperty(window, "matchMedia", {
    value: (query: string) => ({
      addEventListener() {},
      addListener() {},
      dispatchEvent() {
        return false;
      },
      matches: false,
      media: query,
      onchange: null,
      removeEventListener() {},
      removeListener() {},
    }),
    writable: true,
  });
}

if (typeof document.elementFromPoint !== "function") {
  document.elementFromPoint = () => null;
}

if (typeof Element.prototype.getAnimations !== "function") {
  Element.prototype.getAnimations = () => [];
}
