import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { Outlet, useLoaderData } from '@remix-run/react';
import { Award, Briefcase, Calendar, Folder, Home, User } from 'react-feather';

import { Dashboard } from '@oyster/ui';

import { isFeatureFlagEnabled } from '@/member-profile.server';
import { Route } from '@/shared/constants';
import { ensureUserAuthenticated } from '@/shared/session.server';

export async function loader({ request }: LoaderFunctionArgs) {
  await ensureUserAuthenticated(request);

  const isCompaniesEnabled = await isFeatureFlagEnabled('companies_page');

  return json({
    isCompaniesEnabled,
  });
}

export default function ProfileLayout() {
  const { isCompaniesEnabled } = useLoaderData<typeof loader>();

  return (
    <Dashboard>
      <Dashboard.Sidebar>
        <div className="mb-8 flex w-full items-center justify-between">
          <Dashboard.ColorStackLogo />
          <Dashboard.CloseMenuButton />
        </div>

        <Dashboard.Navigation>
          <Dashboard.NavigationList>
            <Dashboard.NavigationLink
              icon={<Home />}
              label="Home"
              pathname={Route['/home']}
            />
            <Dashboard.NavigationLink
              icon={<Folder />}
              label="Directory"
              pathname={Route['/directory']}
            />
            <Dashboard.NavigationLink
              icon={<Award />}
              label="Points"
              pathname={Route['/points']}
            />
            <Dashboard.NavigationLink
              icon={<Calendar />}
              label="Events"
              pathname={Route['/events']}
            />
            {isCompaniesEnabled && (
              <Dashboard.NavigationLink
                icon={<Briefcase />}
                label="Companies"
                pathname={Route['/companies']}
              />
            )}
            <Dashboard.NavigationLink
              icon={<User />}
              label="Profile"
              pathname={Route['/profile']}
            />
          </Dashboard.NavigationList>
        </Dashboard.Navigation>

        <Dashboard.LogoutForm />
      </Dashboard.Sidebar>

      <Dashboard.Page>
        <Dashboard.MenuButton />
        <Outlet />
      </Dashboard.Page>
    </Dashboard>
  );
}
