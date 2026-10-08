import { BirdId, BirdSpecies } from '../models/bird.model';
import { BIRD_CDN } from './asset-urls';

export const BIRDS: BirdSpecies[] = [
  {
    id: 'kingfisher',
    specimenSource: 'model',
    name: 'Kingfisher',
    latinName: 'Alcedo atthis',
    family: 'ALCEDINIDAE',
    tags: ['River bird', 'Diver', 'Iridescent'],
    description:
      'A small, spectacular bird of rivers and lakes, the kingfisher is renowned for its dazzling plumage and astonishing hunting dives. A master of stealth and speed, it links healthy waterways with extraordinary beauty.',
    traits: [
      { icon: 'ruler', label: 'Length', value: '16–17 cm' },
      { icon: 'gauge', label: 'Dive speed', value: 'Up to 40 km/h' },
      { icon: 'fish', label: 'Diet', value: 'Small fish and insects' },
      { icon: 'globe', label: 'Range', value: 'Europe and Asia' },
    ],
    habitat: 'Slow rivers, streams and lakes.',
    caption: 'Blink, and the river keeps its secret.',
    closeUpText:
      'An intricate mosaic of structure and colour gives the kingfisher its unmistakable sheen.',
    lensPosition: '24% 30%',
    featuredTitle: 'A flash of river blue.',
    featuredText: 'Extraordinary colours. A remarkable life by the water.',
    imageSrc: BIRD_CDN.kingfisher.image,
    modelSrc: BIRD_CDN.kingfisher.model,
    modelIndex: 0,
  },
  {
    id: 'hoopoe',
    specimenSource: 'model',
    name: 'Hoopoe',
    latinName: 'Upupa epops',
    family: 'UPUPIDAE',
    tags: ['Ground forager', 'Crested', 'Migrant'],
    description:
      'Unmistakable in cinnamon, black and white, the hoopoe walks open ground probing for grubs with its long curved bill. It lifts its crest into a fan when it lands or takes fright, and flies on broad wings with a loose, butterfly-like beat.',
    traits: [
      { icon: 'ruler', label: 'Length', value: '25–29 cm' },
      { icon: 'wing', label: 'Wingspan', value: '44–48 cm' },
      { icon: 'fish', label: 'Diet', value: 'Insects, larvae and grubs' },
      { icon: 'globe', label: 'Range', value: 'Europe, Asia and Africa' },
    ],
    habitat: 'Orchards, vineyards and dry grassland.',
    caption: 'A crown raised, and the orchard takes notice.',
    closeUpText:
      'Every crest feather ends in a black tip, so the raised fan reads like a row of signal flags.',
    lensPosition: '62% 22%',
    featuredTitle: 'A crown of cinnamon.',
    featuredText:
      'Bold bars on broad wings. A call you hear before you see it.',
    imageSrc: BIRD_CDN.hoopoe.image,
    modelSrc: BIRD_CDN.hoopoe.model,
    modelIndex: 1,
  },
];

export const DEFAULT_BIRD_ID: BirdId = 'kingfisher';

export function birdById(id: BirdId): BirdSpecies {
  return BIRDS.find((b) => b.id === id)!;
}

export function birdIndex(id: BirdId): number {
  return BIRDS.findIndex((b) => b.id === id);
}

export function initialGlFailedState(): Record<BirdId, boolean> {
  return Object.fromEntries(BIRDS.map((b) => [b.id, false])) as Record<
    BirdId,
    boolean
  >;
}
