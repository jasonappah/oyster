import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { Link, Outlet } from '@remix-run/react';
import { Plus } from 'react-feather';

import { Dashboard, getButtonCn } from '@oyster/ui';

import { Route } from '@/shared/constants';
import { ensureUserAuthenticated } from '@/shared/session.server';

export async function loader({ request }: LoaderFunctionArgs) {
  await ensureUserAuthenticated(request);

  return json({});
}

export default function CompaniesLayout() {
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <Dashboard.Title>Companies 💼</Dashboard.Title>

        <Link className={getButtonCn({})} to={Route['/companies/offers/add']}>
          <Plus size={16} /> Add Job Offer
        </Link>
      </div>

      <Outlet />
    </>
  );
}
