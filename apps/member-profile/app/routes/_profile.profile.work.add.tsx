import {
  type ActionFunctionArgs,
  json,
  type LoaderFunctionArgs,
  redirect,
} from '@remix-run/node';
import {
  Form as RemixForm,
  useActionData,
  useLoaderData,
} from '@remix-run/react';
import dayjs from 'dayjs';
import { useState } from 'react';
import { z } from 'zod';

import { getLinkedInProfile } from '@oyster/core/employment.server';
import {
  Button,
  Divider,
  Form,
  getErrors,
  Modal,
  Select,
  validateForm,
} from '@oyster/ui';

import { addWorkExperience } from '@/member-profile.server';
import { AddWorkExperienceInput, WorkForm } from '@/member-profile.ui';
import { Route } from '@/shared/constants';
import {
  commitSession,
  ensureUserAuthenticated,
  toast,
  user,
} from '@/shared/session.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await ensureUserAuthenticated(request);

  const _profile = await getLinkedInProfile(user(session));

  const profile = {
    ..._profile,
    experiences: _profile!.experiences.map((experience) => {
      return {
        ...experience,
        starts_at: dayjs()
          .year(experience.starts_at.year)
          .month(experience.starts_at.month)
          .date(1)
          .format('YYYY-MM'),
        ends_at: experience.ends_at
          ? dayjs()
              .year(experience.ends_at.year)
              .month(experience.ends_at.month)
              .date(1)
              .format('YYYY-MM')
          : undefined,
      };
    }),
  };

  console.log(profile);

  return json({
    profile,
  });
}

const AddWorkExperienceFormData = AddWorkExperienceInput.omit({
  studentId: true,
}).extend({
  endDate: AddWorkExperienceInput.shape.endDate.refine((value) => {
    return dayjs(value).year() >= 1000;
  }, 'Please fill out all 4 digits of the year.'),

  isCurrentRole: z.string().optional(),

  startDate: AddWorkExperienceInput.shape.startDate.refine((value) => {
    return dayjs(value).year() >= 1000;
  }, 'Please fill out all 4 digits of the year.'),
});

type AddWorkExperienceFormData = z.infer<typeof AddWorkExperienceFormData>;

export async function action({ request }: ActionFunctionArgs) {
  const session = await ensureUserAuthenticated(request);

  const { data, errors, ok } = await validateForm(
    request,
    AddWorkExperienceFormData
  );

  if (!ok) {
    return json({ errors }, { status: 400 });
  }

  if (data.endDate && data.startDate > data.endDate) {
    return json({
      error: 'End date must be after the start date.',
      errors,
    });
  }

  await addWorkExperience({
    ...data,
    studentId: user(session),
  });

  toast(session, {
    message: 'Added work experience.',
  });

  return redirect(Route['/profile/work'], {
    headers: {
      'Set-Cookie': await commitSession(session),
    },
  });
}

const keys = AddWorkExperienceFormData.keyof().enum;

export default function AddWorkExperiencePage() {
  return (
    <Modal onCloseTo={Route['/profile/work']}>
      <Modal.Header>
        <Modal.Title>Add Work Experience</Modal.Title>
        <Modal.CloseButton />
      </Modal.Header>

      <AddWorkExperienceForm />
    </Modal>
  );
}

function AddWorkExperienceForm() {
  const { profile } = useLoaderData<typeof loader>();
  const { error, errors } = getErrors(useActionData<typeof action>());

  const [experienceIndex, setExperienceIndex] = useState<string>('');

  const experience = experienceIndex
    ? profile?.experiences[Number(experienceIndex)]
    : null;

  console.log(experience);

  return (
    <RemixForm className="form" method="post">
      <Form.Field
        description="Please select the experience from your LinkedIn that you'd like to add."
        label="LinkedIn Experience"
        labelFor="experience"
        required
      >
        <Select
          id="experience"
          name="experience"
          onChange={(e) => setExperienceIndex(e.currentTarget.value)}
          required
        >
          {profile?.experiences.map((experience, i) => {
            return (
              <option key={i} value={i}>
                {experience.title}, {experience.company}
              </option>
            );
          })}
        </Select>
      </Form.Field>

      <Divider />

      {experience && experience.title && (
        <WorkForm.Context
          defaultValue={{
            isCurrentRole: experience.ends_at === null,
            isOtherCompany: false,
          }}
        >
          <WorkForm.EmploymentTypeField
            error={errors.employmentType}
            name={keys.employmentType}
          />
          <WorkForm.LocationTypeField
            error={errors.locationType}
            name={keys.locationType}
          />
        </WorkForm.Context>
      )}

      <Form.ErrorMessage>{error}</Form.ErrorMessage>
      <Button.Group>
        <Button.Submit>Save</Button.Submit>
      </Button.Group>
    </RemixForm>
  );
}
