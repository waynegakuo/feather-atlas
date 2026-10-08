import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'fa-eyebrow',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="eyebrow"><ng-content /></span>`,
  styles: `
    .eyebrow {
      font-family: var(--font-body);
      font-size: 9.5px;
      font-weight: 600;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--muted);
    }
  `,
})
export class EyebrowComponent {}
