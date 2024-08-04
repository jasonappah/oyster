import {
  type ActionFunctionArgs,
  unstable_composeUploadHandlers as composeUploadHandlers,
  unstable_createFileUploadHandler as createFileUploadHandler,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  json,
  type LoaderFunctionArgs,
  unstable_parseMultipartFormData as parseMultipartFormData,
} from '@remix-run/node';
import {
  Form as RemixForm,
  useActionData,
  useLoaderData,
} from '@remix-run/react';

import { reviewResume } from '@oyster/core/resume-books';
import { SubmitResumeInput } from '@oyster/core/resume-books.types';
import {
  Button,
  FileUploader,
  Form,
  MB_IN_BYTES,
  Modal,
  Text,
} from '@oyster/ui';

import { Route } from '@/shared/constants';
import { ensureUserAuthenticated } from '@/shared/session.server';

export async function loader({ request }: LoaderFunctionArgs) {
  await ensureUserAuthenticated(request);

  return json({});
}

const RESUME_MAX_FILE_SIZE = MB_IN_BYTES * 1;

export async function action({ params, request }: ActionFunctionArgs) {
  const session = await ensureUserAuthenticated(request);

  const uploadHandler = composeUploadHandlers(
    createFileUploadHandler({ maxPartSize: RESUME_MAX_FILE_SIZE }),
    createMemoryUploadHandler()
  );

  const form = await parseMultipartFormData(request, uploadHandler);

  const { content } = await reviewResume({
    file: form.get('resume') as unknown as File,
  });

  console.log(content);

  // @ts-expect-error b/c we hackingggggg
  const text = content[0].text;

  return json({
    text,
  });
}

export default function ReviewResume() {
  const { text } = useActionData<typeof action>() || {};

  return (
    <Modal onCloseTo={Route['/resume-books/:id']}>
      <Modal.Header>
        <Modal.Title>Review Resume</Modal.Title>
        <Modal.CloseButton />
      </Modal.Header>

      <RemixForm
        className="form"
        data-gap="2rem"
        method="post"
        encType="multipart/form-data"
      >
        <Form.Field
          description="Please upload your resume."
          error=""
          label="Resume"
          labelFor="resume"
          required
        >
          <FileUploader
            accept={['application/pdf']}
            id="resume"
            maxFileSize={RESUME_MAX_FILE_SIZE}
            name="resume"
            required
          />
        </Form.Field>

        <Text className="whitespace-pre-wrap">{text}</Text>

        {/* <Form.ErrorMessage>{error}</Form.ErrorMessage> */}

        <Button.Group>
          <Button.Submit>Submit</Button.Submit>
        </Button.Group>
      </RemixForm>
    </Modal>
  );
}
