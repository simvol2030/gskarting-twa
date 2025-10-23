import offers from '$lib/data/loyalty/offers.json';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
  return { offers };
};
