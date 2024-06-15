import { type Transaction } from 'kysely';
import { z } from 'zod';

import { type DB } from '@oyster/db';
import { id } from '@oyster/utils';

import { db } from '@/infrastructure/database';
import { cache } from '@/infrastructure/redis';
import { getCrunchbaseOrganization } from '../queries/get-crunchbase-organization';

const PROXYCURL_API_KEY = process.env.PROXYCURL_API_KEY as string;

export async function saveCompanyIfNecessaryV2(
  trx: Transaction<DB>,
  linkedInNameId: string
): Promise<string | null> {
  if (!linkedInNameId) {
    return null;
  }

  const existingCompany = await db
    .selectFrom('companies')
    .select(['id'])
    .where('linkedInNameId', '=', linkedInNameId)
    .executeTakeFirst();

  if (existingCompany) {
    return existingCompany.id;
  }

  const newCompany = await getLinkedInCompany(linkedInNameId);

  if (!newCompany) {
    throw new Error('');
  }

  const companyId = id();

  await trx
    .insertInto('companies')
    .values({
      crunchbaseId: '',
      description: newCompany.description,
      // domain: newCompany.domain,
      id: companyId,
      imageUrl: newCompany.profile_pic_url,
      name: newCompany.name,
      // stockSymbol: newCompany.stockSymbol,
    })
    .executeTakeFirstOrThrow();

  return companyId;
}

const LinkedInCompany = z.object({
  company_size_on_linkedin: z.coerce.number(),
  description: z.string().trim().min(1).nullable(),
  linkedin_internal_id: z.string(),
  name: z.string().trim().min(1),
  profile_pic_url: z.string().url(),
  universal_name_id: z.string().trim().min(1),
});

export async function getLinkedInCompany(linkedInNameId: string) {
  const { get, set } = cache(
    `getLinkedInCompany:${linkedInNameId}`,
    LinkedInCompany
  );

  const result = await get();

  if (result) {
    return result;
  }

  const url = new URL('https://nubela.co/proxycurl/api/linkedin/company');

  url.searchParams.set(
    'url',
    `https://www.linkedin.com/company/${linkedInNameId}`
  );

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${PROXYCURL_API_KEY}`,
    },
  });

  if (!response.ok) {
    // TODO: Capture error...

    return null;
  }

  const data = await response.json();
  const company = LinkedInCompany.parse(data);

  set(company, 60 * 60 * 24 * 365);

  return company;
}
