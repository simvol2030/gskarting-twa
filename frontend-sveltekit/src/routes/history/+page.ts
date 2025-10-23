import historyData from '$lib/data/loyalty/history.json';
import type { PageLoad } from './$types';
import type { Transaction } from '$lib/types/loyalty';

export const load: PageLoad = () => {
  return { history: historyData as Transaction[] };
};
