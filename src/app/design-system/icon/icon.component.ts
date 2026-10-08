import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'fa-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      class="fa-icon"
      [class]="sizeClass()"
      aria-hidden="true"
      focusable="false"
    >
      <use [attr.href]="href()" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      line-height: 0;
    }

    .fa-icon {
      width: 20px;
      height: 20px;
      stroke: currentColor;
      fill: none;
      stroke-width: 1.5;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .fa-icon--sm {
      width: 17px;
      height: 17px;
    }

    .fa-icon--lg {
      width: 24px;
      height: 24px;
    }
  `,
})
export class IconComponent {
  readonly name = input.required<string>();
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  protected href() {
    return `#icon-${this.name()}`;
  }

  protected sizeClass() {
    const size = this.size();
    if (size === 'sm') return 'fa-icon fa-icon--sm';
    if (size === 'lg') return 'fa-icon fa-icon--lg';
    return 'fa-icon';
  }
}
