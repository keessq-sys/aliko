import { error } from '@sveltejs/kit';
import { legalPolicies, POLICY_VERSION } from '$lib/data/legalPolicies';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
  const policy = legalPolicies[params.slug];
  if (!policy) throw error(404, 'Policy not found');
  return { policy, version: POLICY_VERSION };
};
