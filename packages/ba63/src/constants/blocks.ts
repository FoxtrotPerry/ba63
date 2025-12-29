export const blocks = {
  EMPTY: 0,
  LIGHT_SHADE: 176,
  MEDIUM_SHADE_1: 177,
  MEDIUM_SHADE_2: 178,
  LOWER_HALF: 220,
  UPPER_HALF: 223,
  LEFT_HALF: 221,
  RIGHT_HALF: 222,
  FULL: 219,
};

export type Block = (typeof blocks)[keyof typeof blocks];
