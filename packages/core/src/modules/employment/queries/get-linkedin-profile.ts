import { z } from 'zod';

import { db } from '@oyster/db';

import { cache } from '@/infrastructure/redis';

const PROXYCURL_API_KEY = process.env.PROXYCURL_API_KEY as string;

const LinkedInDate = z.object({
  day: z.coerce.number(),
  month: z.coerce.number(),
  year: z.coerce.number(),
});

const LinkedInExperience = z.object({
  company: z.string().trim().min(1),
  company_linkedin_profile_url: z
    .string()
    .url()
    .startsWith('https://www.linkedin.com/company')
    .nullable(),
  description: z.string().trim().min(1).nullable(),
  ends_at: LinkedInDate.nullable(),
  location: z.string().trim().min(1).nullable(),
  starts_at: LinkedInDate,
  title: z.string().trim().min(1),
});

const LinkedInProfile = z.object({
  experiences: LinkedInExperience.array(),
});

export async function getLinkedInProfile(memberId: string) {
  const { get, set } = cache(`getLinkedInProfile:${memberId}`, LinkedInProfile);

  const result = await get();

  if (result) {
    return result;
  }

  const member = await db
    .selectFrom('students')
    .select('linkedInUrl')
    .executeTakeFirst();

  if (!member || !member.linkedInUrl) {
    return null;
  }

  const url = new URL('https://nubela.co/proxycurl/api/v2/linkedin');

  url.searchParams.set('linkedin_profile_url', member.linkedInUrl);

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
  const profile = LinkedInProfile.parse(data);

  set(profile, 60 * 60 * 24 * 7);

  return profile;
}
