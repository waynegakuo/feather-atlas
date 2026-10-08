/** Remote GLB + hero PNG pairs for fully interactive specimens. */
export const FEATHER_ATLAS_CDN =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/';

export const BIRD_CDN = {
  kingfisher: {
    image: `${FEATHER_ATLAS_CDN}hf_20261004_073256_f9e3e60d-acdc-4925-b393-c4ce14b28711.png`,
    model: `${FEATHER_ATLAS_CDN}hf_20261004_073345_12721630-c589-442f-8884-e4a445cd8980.glb`,
  },
  hoopoe: {
    image: `${FEATHER_ATLAS_CDN}hf_20261004_073256_21ed095c-d038-4ab5-87b7-b44e527ec449.png`,
    model: `${FEATHER_ATLAS_CDN}hf_20261004_073347_06b339a7-70bc-4ecd-9e72-1a4143264da9.glb`,
  },
} as const;
