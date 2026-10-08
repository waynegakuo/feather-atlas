import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'fa-tag-pill',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="pill">{{ label() }}</span>`,
  styles: `
    .pill {
      display: inline-flex;
      align-items: center;
      padding: 6px 13px;
      border-radius: 999px;
      background: var(--chip);
      font-family: var(--font-body);
      font-size: 11.5px;
      color: var(--ink);
      line-height: 1.2;
    }
  `,
})
export class TagPillComponent {
  readonly label = input.required<string>();
}
