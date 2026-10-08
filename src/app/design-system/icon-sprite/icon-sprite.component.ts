import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'fa-icon-sprite',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <symbol id="icon-house" viewBox="0 0 24 24">
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
      </symbol>
      <symbol id="icon-star" viewBox="0 0 24 24">
        <path d="m12 3 2.2 5.4L20 9.3l-4.2 3.6L17 18l-5-3.1L7 18l1.2-5.1L4 9.3l5.8-.9z" />
      </symbol>
      <symbol id="icon-bird" viewBox="0 0 24 24">
        <path d="M4 14c3-6 8-9 16-9-2 4-2 8 0 12-6-1-11-1-16-3z" />
        <path d="M8 16c2-1 4-1 6 0" />
      </symbol>
      <symbol id="icon-owl" viewBox="0 0 24 24">
        <circle cx="9" cy="11" r="2.5" />
        <circle cx="15" cy="11" r="2.5" />
        <path d="M12 4c-4 0-7 3-7 7 0 5 3 9 7 9s7-4 7-9c0-4-3-7-7-7z" />
        <path d="M10 15h4" />
      </symbol>
      <symbol id="icon-wader" viewBox="0 0 24 24">
        <path d="M6 20V9l3-3 2 2v12" />
        <path d="M14 20V8l2-2 2 2v12" />
        <path d="M4 20h16" />
      </symbol>
      <symbol id="icon-search" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="6" />
        <path d="M16 16l5 5" />
      </symbol>
      <symbol id="icon-bell" viewBox="0 0 24 24">
        <path d="M6 18h12M9 18v1a3 3 0 0 0 6 0v-1" />
        <path d="M5 14c0-4 2-6 2-9a5 5 0 0 1 10 0c0 3 2 5 2 9" />
      </symbol>
      <symbol id="icon-user" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" />
      </symbol>
      <symbol id="icon-arrow-left" viewBox="0 0 24 24">
        <path d="M15 6 9 12l6 6" />
      </symbol>
      <symbol id="icon-arrow-right" viewBox="0 0 24 24">
        <path d="M9 6l6 6-6 6" />
      </symbol>
      <symbol id="icon-hand" viewBox="0 0 24 24">
        <path d="M8 11V6a1.5 1.5 0 1 1 3 0v5" />
        <path d="M11 10V5a1.5 1.5 0 1 1 3 0v6" />
        <path d="M14 11V7a1.5 1.5 0 1 1 3 0v8c0 3-2 5-5 5H10a4 4 0 0 1-4-4v-3a1.5 1.5 0 1 1 3 0v1" />
      </symbol>
      <symbol id="icon-zoom-in" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="6" />
        <path d="M16 16l5 5M11 8v6M8 11h6" />
      </symbol>
      <symbol id="icon-zoom-out" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="6" />
        <path d="M16 16l5 5M8 11h6" />
      </symbol>
      <symbol id="icon-expand" viewBox="0 0 24 24">
        <path d="M8 4H4v4M16 4h4v4M8 20H4v-4M16 20h4v-4" />
      </symbol>
      <symbol id="icon-sun" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5" />
      </symbol>
      <symbol id="icon-ccw" viewBox="0 0 24 24">
        <path d="M9 7H5v4" />
        <path d="M5 11a7 7 0 1 0 2-5" />
      </symbol>
      <symbol id="icon-cw" viewBox="0 0 24 24">
        <path d="M15 7h4v4" />
        <path d="M19 11a7 7 0 1 1-2-5" />
      </symbol>
      <symbol id="icon-ruler" viewBox="0 0 24 24">
        <path d="M4 16 16 4l4 4L8 20z" />
        <path d="M9 9l2 2M13 5l2 2" />
      </symbol>
      <symbol id="icon-wing" viewBox="0 0 24 24">
        <path d="M4 14c4-2 8-2 12 0 2 1 4 1 6-1-3 4-7 6-12 6S3 18 4 14z" />
      </symbol>
      <symbol id="icon-fish" viewBox="0 0 24 24">
        <path d="M4 12c4-3 8-3 12 0 4 3 8 3 8 0-4 3-8 3-12 0-4-3-8-3-8 0z" />
        <circle cx="7" cy="12" r="1" />
      </symbol>
      <symbol id="icon-globe" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
      </symbol>
      <symbol id="icon-gauge" viewBox="0 0 24 24">
        <path d="M12 4a8 8 0 1 0 8 8" />
        <path d="M12 12 16 8" />
      </symbol>
      <symbol id="icon-reed" viewBox="0 0 24 24">
        <path d="M8 20V8M12 20V5M16 20v-7" />
        <path d="M6 20h12" />
      </symbol>
      <symbol id="icon-chevron-right" viewBox="0 0 24 24">
        <path d="M9 6l6 6-6 6" />
      </symbol>
    </svg>
  `,
  styles: `
    :host {
      position: absolute;
      width: 0;
      height: 0;
      overflow: hidden;
    }
  `,
})
export class IconSpriteComponent {}
