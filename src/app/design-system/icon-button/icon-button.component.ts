import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'fa-icon-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <button
      type="button"
      class="btn"
      [class.btn--on]="pressed()"
      [class.btn--round]="variant() === 'round'"
      [attr.aria-label]="label()"
      [attr.aria-pressed]="toggle() ? pressed() : null"
      (click)="activate.emit($event)"
    >
      @if (icon()) {
        <fa-icon [name]="icon()!" [size]="iconSize()" />
      } @else {
        <ng-content />
      }
    </button>
  `,
  styles: `
    .btn {
      display: inline-grid;
      place-items: center;
      border: 1px solid var(--line);
      background: var(--panel);
      color: var(--ink);
      cursor: pointer;
      transition:
        border-color 0.25s var(--ease),
        background 0.25s var(--ease),
        transform 0.15s var(--ease);
    }

    .btn:focus-visible {
      outline: var(--focus-ring);
      outline-offset: var(--focus-offset);
    }

    .btn:hover {
      border-color: var(--sage);
    }

    .btn:active {
      transform: scale(0.92);
    }

    .btn--round {
      width: 38px;
      height: 38px;
      border-radius: 999px;
    }

    .btn--on {
      background: var(--sage);
      color: var(--sage-ink);
      border-color: var(--sage);
    }
  `,
})
export class IconButtonComponent {
  readonly label = input.required<string>();
  readonly icon = input<string>();
  readonly pressed = input(false);
  readonly toggle = input(true);
  readonly variant = input<'round' | 'plain'>('round');
  readonly iconSize = input<'sm' | 'md' | 'lg'>('sm');
  readonly activate = output<MouseEvent>();
}
