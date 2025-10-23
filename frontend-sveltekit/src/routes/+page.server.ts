import { readFileSync } from 'fs';
import { join } from 'path';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
  const recommendationsPath = join(process.cwd(), 'src/lib/data/loyalty/recommendations.json');
  const offersPath = join(process.cwd(), 'src/lib/data/loyalty/offers.json');
  const productsPath = join(process.cwd(), 'src/lib/data/loyalty/products.json');

  const recommendations = JSON.parse(readFileSync(recommendationsPath, 'utf-8'));
  const offers = JSON.parse(readFileSync(offersPath, 'utf-8'));
  const products = JSON.parse(readFileSync(productsPath, 'utf-8'));

  // Берём первые 2 акции для "Акции месяца"
  const monthOffers = offers.slice(0, 2);

  // Берём первые 6 товаров для "Топовые товары"
  const topProducts = products.slice(0, 6);

  return {
    recommendations,
    monthOffers,
    topProducts
  };
};
