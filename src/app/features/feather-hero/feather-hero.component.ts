import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { BIRDS, DEFAULT_BIRD_ID, birdById } from '../../data/birds.data';
import { NAV_ITEMS, NavItem, NavItemId } from '../../data/nav.data';
import { BirdId } from '../../models/bird.model';
import { EyebrowComponent } from '../../design-system/eyebrow/eyebrow.component';
import { IconButtonComponent } from '../../design-system/icon-button/icon-button.component';
import { IconComponent } from '../../design-system/icon/icon.component';
import { IconSpriteComponent } from '../../design-system/icon-sprite/icon-sprite.component';
import { TagPillComponent } from '../../design-system/tag-pill/tag-pill.component';
import { BirdSceneService } from './services/bird-scene.service';

@Component({
  selector: 'app-feather-hero',
  imports: [
    IconSpriteComponent,
    IconComponent,
    EyebrowComponent,
    TagPillComponent,
    IconButtonComponent,
  ],
  templateUrl: './feather-hero.component.html',
  styleUrl: './feather-hero.component.scss',
})
export class FeatherHeroComponent implements AfterViewInit, OnDestroy {
  protected readonly birds = BIRDS;
  protected readonly navItems = NAV_ITEMS;
  protected readonly scene = inject(BirdSceneService);

  protected readonly searchQuery = signal('');
  protected readonly filteredBirds = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.birds;
    return this.birds.filter((b) => {
      const haystack = [
        b.name,
        b.latinName,
        b.family,
        b.habitat,
        b.description,
        ...b.tags,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  });

  protected readonly activeId = signal<BirdId>(DEFAULT_BIRD_ID);
  protected readonly activeIndex = computed(() =>
    this.birds.findIndex((b) => b.id === this.activeId()),
  );
  protected readonly filteredActiveIndex = computed(() =>
    this.filteredBirds().findIndex((b) => b.id === this.activeId()),
  );
  protected readonly activeBird = computed(
    () => birdById(this.activeId()),
  );

  protected readonly focusMode = signal(false);
  protected readonly lightMode = signal<'day' | 'dusk'>('day');
  protected readonly detailPhase = signal<'in' | 'out' | 'idle'>('idle');
  protected readonly closeUpOpen = signal(false);
  protected readonly searchOpen = signal(false);
  protected readonly activeNavId = signal<NavItemId>('featured');
  protected readonly guideOpen = signal(false);
  protected readonly shadowHidden = computed(() => this.scene.tabSwitching());

  private heroRef = viewChild.required<ElementRef<HTMLElement>>('hero');
  private stageRef = viewChild.required<ElementRef<HTMLElement>>('stage');
  private detailCardRef = viewChild<ElementRef<HTMLElement>>('detailCard');
  private canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private heroResize?: ResizeObserver;
  private stageResize?: ResizeObserver;

  ngAfterViewInit(): void {
    const canvas = this.canvasRef().nativeElement;
    void this.scene.init(canvas);

    const heroEl = this.heroRef().nativeElement;
    const stageEl = this.stageRef().nativeElement;

    const pushTargets = () => {
      const heroRect = heroEl.getBoundingClientRect();
      const stageRect = stageEl.getBoundingClientRect();
      this.scene.resize(heroRect.width, heroRect.height);
      this.scene.setFrameTargets({
        heroWidth: heroRect.width,
        heroHeight: heroRect.height,
        stageLeft: stageRect.left - heroRect.left,
        stageTop: stageRect.top - heroRect.top,
        stageWidth: stageRect.width,
        stageHeight: stageRect.height,
        focusMode: this.focusMode(),
      });
    };

    this.heroResize = new ResizeObserver(pushTargets);
    this.stageResize = new ResizeObserver(pushTargets);
    this.heroResize.observe(heroEl);
    this.stageResize.observe(stageEl);
    pushTargets();
  }

  ngOnDestroy(): void {
    this.heroResize?.disconnect();
    this.stageResize?.disconnect();
    this.scene.dispose();
  }

  protected onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    const visible = this.filteredBirds();
    if (visible.length && !visible.some((b) => b.id === this.activeId())) {
      this.selectBird(visible[0].id);
    }
  }

  protected selectBird(id: BirdId): void {
    this.activeNavId.set('featured');
    if (id === this.activeId()) return;
    this.animateDetailSwap(() => {
      this.activeId.set(id);
      this.scene.setActiveBird(id, true);
      this.closeUpOpen.set(false);
    });
  }

  protected openMobileGuide(): void {
    this.guideOpen.set(true);
    this.activeNavId.set('guide');
  }

  protected selectTab(index: number): void {
    const bird = this.filteredBirds()[index];
    if (bird) this.selectBird(bird.id);
  }

  protected prevTab(): void {
    const list = this.filteredBirds();
    if (!list.length) return;
    const i = this.filteredActiveIndex();
    const next = (i + list.length - 1) % list.length;
    this.selectBird(list[next].id);
  }

  protected nextTab(): void {
    const list = this.filteredBirds();
    if (!list.length) return;
    const i = this.filteredActiveIndex();
    const next = (i + 1) % list.length;
    this.selectBird(list[next].id);
  }

  private animateDetailSwap(swap: () => void): void {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      swap();
      return;
    }
    this.detailPhase.set('out');
    window.setTimeout(() => {
      swap();
      this.detailPhase.set('in');
      window.setTimeout(() => this.detailPhase.set('idle'), 700);
    }, 200);
  }

  protected onStageKeydown(e: KeyboardEvent): void {
    if (e.key === 'ArrowLeft') this.scene.rotateKeys(-0.18, 0);
    if (e.key === 'ArrowRight') this.scene.rotateKeys(0.18, 0);
    if (e.key === 'ArrowUp') this.scene.rotateKeys(0, -0.18);
    if (e.key === 'ArrowDown') this.scene.rotateKeys(0, 0.18);
    if (e.key === '+' || e.key === '=') this.scene.zoomKeys(1.2);
    if (e.key === '-' || e.key === '_') this.scene.zoomKeys(1 / 1.2);
    if (e.key === '0') this.scene.resetHome();
  }

  protected onStageDblClick(): void {
    this.scene.resetHome();
  }

  protected toggleFocus(): void {
    this.focusMode.update((v) => !v);
    const heroEl = this.heroRef().nativeElement;
    const stageEl = this.stageRef().nativeElement;
    const heroRect = heroEl.getBoundingClientRect();
    const stageRect = stageEl.getBoundingClientRect();
    this.scene.setFrameTargets({
      heroWidth: heroRect.width,
      heroHeight: heroRect.height,
      stageLeft: stageRect.left - heroRect.left,
      stageTop: stageRect.top - heroRect.top,
      stageWidth: stageRect.width,
      stageHeight: stageRect.height,
      focusMode: this.focusMode(),
    });
  }

  protected toggleLight(): void {
    const next = this.lightMode() === 'day' ? 'dusk' : 'day';
    this.lightMode.set(next);
    this.scene.setDusk(next === 'dusk');
    document.body.style.background = next === 'dusk' ? '#14170f' : '';
  }

  protected toggleCloseUp(): void {
    this.scene.toggleCloseUp();
    this.closeUpOpen.set(this.scene.closeUpPressed());
  }

  protected onNavClick(item: NavItem): void {
    this.activeNavId.set(item.id);
    switch (item.action) {
      case 'home':
        this.goHome();
        break;
      case 'featured':
        this.closeGuide();
        this.stageRef().nativeElement.focus({ preventScroll: true });
        break;
      case 'guide':
        this.guideOpen.set(true);
        break;
      case 'focus':
        this.closeGuide();
        this.toggleFocus();
        this.stageRef().nativeElement.focus({ preventScroll: true });
        break;
      case 'lighting':
        this.closeGuide();
        this.toggleLight();
        break;
    }
  }

  protected closeGuide(): void {
    this.guideOpen.set(false);
  }

  protected goHome(): void {
    this.activeNavId.set('home');
    this.closeGuide();
    this.searchQuery.set('');
    this.searchOpen.set(false);
    this.closeUpOpen.set(false);
    if (this.focusMode()) {
      this.toggleFocus();
    }
    if (this.lightMode() === 'dusk') {
      this.toggleLight();
    }
    if (this.activeId() !== DEFAULT_BIRD_ID) {
      this.activeId.set(DEFAULT_BIRD_ID);
      this.scene.setActiveBird(DEFAULT_BIRD_ID, false);
    }
    this.scene.resetHome();
    this.stageRef().nativeElement.focus({ preventScroll: true });
  }

  protected onLearnMore(): void {
    this.activeNavId.set('featured');
    const card = this.detailCardRef()?.nativeElement;
    card?.scrollTo({ top: card.scrollHeight, behavior: 'smooth' });
    if (!this.closeUpOpen()) {
      this.toggleCloseUp();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.guideOpen()) {
      this.closeGuide();
      return;
    }
    if (this.focusMode()) this.toggleFocus();
  }

  protected turnLeft(): void {
    this.scene.queueTurn(-Math.PI / 2);
  }

  protected turnRight(): void {
    this.scene.queueTurn(Math.PI / 2);
  }

  protected turnFull(): void {
    this.scene.queueTurn(Math.PI * 2);
  }

  protected onStagePointerDown(e: PointerEvent): void {
    const target = e.target as HTMLElement;
    if (target.closest('.rail, .turn-pill')) return;
    this.scene.onPointerDown(e, this.stageRef().nativeElement);
    if (e.pointerType === 'touch') this.trackPinch(e, 'down');
  }

  private readonly activeTouches = new Map<number, { x: number; y: number }>();

  protected onStagePointerMove(e: PointerEvent): void {
    if (e.pointerType === 'touch' && this.activeTouches.size >= 2) {
      this.trackPinch(e, 'move');
      return;
    }
    this.scene.onPointerMove(e);
    if (e.pointerType === 'touch') this.trackPinch(e, 'move');
  }

  private trackPinch(e: PointerEvent, phase: 'down' | 'move' | 'up'): void {
    if (phase === 'down') {
      this.activeTouches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    } else if (phase === 'up') {
      this.activeTouches.delete(e.pointerId);
    } else {
      this.activeTouches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    const pts = [...this.activeTouches.values()];
    if (pts.length === 2) {
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (!this.pinchDist) {
        this.pinchDist = d;
        this.scene.onPinchStart(d);
      } else {
        this.scene.onPinchMove(d);
      }
    } else {
      this.pinchDist = 0;
    }
  }

  private pinchDist = 0;

  protected onStagePointerUp(e: PointerEvent): void {
    if (e.pointerType === 'touch') this.trackPinch(e, 'up');
    this.scene.onPointerUp(e, this.stageRef().nativeElement);
    if (this.activeTouches.size < 2) this.pinchDist = 0;
  }

  @HostListener('document:keydown', ['$event'])
  onDocKeydown(e: KeyboardEvent): void {
    if (e.target instanceof HTMLElement && e.target.closest('#stage')) return;
    if (e.key === 'ArrowLeft') this.prevTab();
    if (e.key === 'ArrowRight') this.nextTab();
  }

  protected traitIcon(name: string): string {
    return name;
  }

  protected detailChildClass(i: number): string {
    const phase = this.detailPhase();
    if (phase === 'out') return 'detail-child detail-child--out';
    if (phase === 'in') return `detail-child detail-child--in detail-child--d${i}`;
    return 'detail-child';
  }
}
