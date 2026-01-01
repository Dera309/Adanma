/**
 * Focus trap utility for managing focus within modals and other components
 */

const FOCUSABLE_ELEMENTS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input[type="text"]:not([disabled])',
  'input[type="radio"]:not([disabled])',
  'input[type="checkbox"]:not([disabled])',
  'input[type="email"]:not([disabled])',
  'input[type="password"]:not([disabled])',
  'input[type="tel"]:not([disabled])',
  'input[type="url"]:not([disabled])',
  'input[type="search"]:not([disabled])',
  'input[type="number"]:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

export class FocusTrap {
  private element: HTMLElement;
  private focusableElements: HTMLElement[];
  private firstFocusableElement: HTMLElement | null = null;
  private lastFocusableElement: HTMLElement | null = null;
  private previousActiveElement: Element | null = null;

  constructor(element: HTMLElement) {
    this.element = element;
    this.focusableElements = [];
    this.updateFocusableElements();
  }

  private updateFocusableElements() {
    this.focusableElements = Array.from(
      this.element.querySelectorAll(FOCUSABLE_ELEMENTS)
    ) as HTMLElement[];
    
    this.firstFocusableElement = this.focusableElements[0] || null;
    this.lastFocusableElement = this.focusableElements[this.focusableElements.length - 1] || null;
  }

  activate() {
    this.previousActiveElement = document.activeElement;
    this.updateFocusableElements();
    
    // Focus the first focusable element or the container itself
    if (this.firstFocusableElement) {
      this.firstFocusableElement.focus();
    } else {
      this.element.focus();
    }

    this.element.addEventListener('keydown', this.handleKeyDown);
  }

  deactivate() {
    this.element.removeEventListener('keydown', this.handleKeyDown);
    
    // Return focus to the previously active element
    if (this.previousActiveElement && 'focus' in this.previousActiveElement) {
      (this.previousActiveElement as HTMLElement).focus();
    }
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    this.updateFocusableElements();

    if (this.focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    if (event.shiftKey) {
      // Shift + Tab (backward)
      if (document.activeElement === this.firstFocusableElement) {
        event.preventDefault();
        this.lastFocusableElement?.focus();
      }
    } else {
      // Tab (forward)
      if (document.activeElement === this.lastFocusableElement) {
        event.preventDefault();
        this.firstFocusableElement?.focus();
      }
    }
  };
}

export const createFocusTrap = (element: HTMLElement): FocusTrap => {
  return new FocusTrap(element);
};