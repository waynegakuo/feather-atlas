export type BirdId = 'hoopoe' | 'kingfisher';

export type TraitIcon =
  | 'ruler'
  | 'wing'
  | 'fish'
  | 'globe'
  | 'gauge';

/** `photo` = textured plane from imageSrc; `model` = GLB at modelSrc */
export type SpecimenSource = 'photo' | 'model';

export interface BirdTrait {
  icon: TraitIcon;
  label: string;
  value: string;
}

export interface BirdSpecies {
  id: BirdId;
  specimenSource: SpecimenSource;
  name: string;
  latinName: string;
  family: string;
  tags: [string, string, string];
  description: string;
  traits: BirdTrait[];
  habitat: string;
  caption: string;
  closeUpText: string;
  lensPosition: string;
  featuredTitle: string;
  featuredText: string;
  imageSrc: string;
  modelSrc: string;
  modelIndex: number;
}
