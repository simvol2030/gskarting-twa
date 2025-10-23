import stores from '$lib/data/loyalty/stores.json';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
  return { stores };
};
