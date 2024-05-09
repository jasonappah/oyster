import {
  type ActionFunctionArgs,
  json,
  type LoaderFunctionArgs,
  redirect,
} from '@remix-run/node';
import { Form as RemixForm, useActionData } from '@remix-run/react';

import { Button, Form, getActionErrors, Modal, validateForm } from '@oyster/ui';

import { uploadJobOffer } from '@/member-profile.server';
import { UploadJobOfferInput } from '@/member-profile.ui';
import { Route } from '@/shared/constants';
import {
  commitSession,
  ensureUserAuthenticated,
  toast,
} from '@/shared/session.server';

export async function loader({ request }: LoaderFunctionArgs) {
  await ensureUserAuthenticated(request);

  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await ensureUserAuthenticated(request);

  const form = await request.formData();

  const { data, errors } = validateForm(
    UploadJobOfferInput,
    Object.fromEntries(form)
  );

  if (!data) {
    return json({
      error: 'Something went wrong, please try again to upload event link.',
      errors,
    });
  }

  // await uploadJobOffer({});

  toast(session, {
    message: 'Link uploaded successfully.',
    type: 'success',
  });

  return redirect(Route['/companies'], {
    headers: {
      'Set-Cookie': await commitSession(session),
    },
  });
}

export default function AddJobOfferModal() {
  return (
    <Modal onCloseTo={Route['/companies/offers/add']}>
      <Modal.Header>
        <Modal.Title>Add Job Offer</Modal.Title>
        <Modal.CloseButton />
      </Modal.Header>

      <AddJobOfferForm />
    </Modal>
  );
}

function AddJobOfferForm() {
  const { error } = getActionErrors(useActionData<typeof action>());

  return (
    <RemixForm className="form" method="post">
      <Form.ErrorMessage>{error}</Form.ErrorMessage>

      <Button.Group>
        <Button type="submit">Add</Button>
      </Button.Group>
    </RemixForm>
  );
}
