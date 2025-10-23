import { readFileSync } from 'fs';
import { join } from 'path';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
  console.log('[PROFILE PAGE] Load function started');

  try {
    const userPath = join(process.cwd(), 'src/lib/data/loyalty/user.json');
    const menuPath = join(process.cwd(), 'src/lib/data/loyalty/profile-menu.json');
    const rulesPath = join(process.cwd(), 'src/lib/data/loyalty/loyalty-rules-detailed.json');

    console.log('[PROFILE PAGE] Loading from:', { userPath, menuPath, rulesPath });

    const user = JSON.parse(readFileSync(userPath, 'utf-8'));
    const profileMenu = JSON.parse(readFileSync(menuPath, 'utf-8'));
    const loyaltyRulesDetailed = JSON.parse(readFileSync(rulesPath, 'utf-8'));

    console.log('[PROFILE PAGE] Data loaded:', {
      userName: user?.name,
      menuItems: profileMenu?.length,
      rulesTitle: loyaltyRulesDetailed?.title,
      rulesIcon: loyaltyRulesDetailed?.icon
    });

    const result = {
      user,
      profileMenu,
      loyaltyRulesDetailed
    };

    console.log('[PROFILE PAGE] Returning data:', Object.keys(result));

    return result;
  } catch (error) {
    console.error('[PROFILE PAGE] Error loading profile data:', error);
    throw error;
  }
};
