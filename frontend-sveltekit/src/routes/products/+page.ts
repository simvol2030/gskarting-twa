import products from '$lib/data/loyalty/products.json';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
  return { products };
};
