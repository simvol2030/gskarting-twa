import { readFileSync } from 'fs';
import { join } from 'path';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = () => {
  const userPath = join(process.cwd(), 'src/lib/data/loyalty/user.json');
  const loyaltyRulesPath = join(process.cwd(), 'src/lib/data/loyalty/loyalty-rules.json');

  const user = JSON.parse(readFileSync(userPath, 'utf-8'));
  const loyaltyRules = JSON.parse(readFileSync(loyaltyRulesPath, 'utf-8'));

  return {
    user,
    loyaltyRules
  };
};
