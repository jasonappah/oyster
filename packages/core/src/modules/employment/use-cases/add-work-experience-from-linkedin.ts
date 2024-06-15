import dayjs from 'dayjs';

import { id } from '@oyster/utils';

import { job } from '@/infrastructure/bull/use-cases/job';
import { db } from '@/infrastructure/database';
import { getLinkedInProfile } from '@/modules/employment/queries/get-linkedin-profile';
import { saveCompanyIfNecessary } from './save-company-if-necessary';
import { type AddWorkExperienceFromLinkedInInput } from '../employment.types';

export async function addWorkExperienceFromLinkedIn(
  memberId: string,
  {
    employmentType,
    experienceIndex,
    locationType,
  }: AddWorkExperienceFromLinkedInInput
) {
  const workExperienceId = id();

  const profile = await getLinkedInProfile(memberId);

  if (!profile) {
    throw new Error('AGHHHHH!');
  }

  const experience = profile.experiences[experienceIndex];

  await db.transaction().execute(async (trx) => {
    const companyId = await saveCompanyIfNecessary(trx, companyCrunchbaseId);

    await trx
      .insertInto('workExperiences')
      .values({
        companyId: '', // TODO: Save company from LinkedIn API.
        // companyName,
        employmentType,
        endDate: experience.ends_at
          ? dayjs()
              .year(experience.ends_at.year)
              .month(experience.ends_at.month)
              .date(experience.ends_at.day)
              .toDate()
          : null,
        id: workExperienceId,
        // location: experience.location,
        // locationCity,
        // locationState,
        locationType,
        startDate: dayjs()
          .year(experience.starts_at.year)
          .month(experience.starts_at.month)
          .date(experience.starts_at.day)
          .toDate(),
        studentId: memberId,
        title: experience.title,
      })
      .execute();
  });

  job('work_experience.added', {
    studentId: memberId,
    workExperienceId,
  });
}
