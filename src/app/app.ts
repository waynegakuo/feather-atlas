import { Component } from '@angular/core';
import { FeatherHeroComponent } from './features/feather-hero/feather-hero.component';

@Component({
  selector: 'app-root',
  imports: [FeatherHeroComponent],
  template: `<app-feather-hero />`,
  styles: `:host { display: block; }`,
})
export class App {}
