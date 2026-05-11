import { AppCard } from '@cockpit-app/cockpit-ui';
import { TypographyH1, TypographyP } from '@cockpit-app/shared-react-ui';
import {
  CheckSquare,
  Database,
  DollarSign,
  User,
  Bot,
  Brain,
} from 'lucide-react';
import { environments } from '@cockpit-app/shared-utils';
import {
  usePermissions,
  useIsAdmin,
} from '@cockpit-app/shared-react-data-access';

const ALL_APPS = [
  {
    name: 'Syncthing',
    description:
      'Personal knowledge base synchronization tool. Synchroning: Notes, reviews, summaries, projects.',
    url: environments.brainUrl,
    Icon: Brain,
    feature: 'brain',
    action: 'read',
  },
  {
    name: 'Agent',
    description: 'Talk with chatbot to manage all applications.',
    url: environments.agentUrl,
    Icon: Bot,
    feature: null,
    action: null,
    adminOnly: true,
  },
  {
    name: 'Twodo',
    description:
      'Track your todo tasks in a collaborative mode. Powered by Vikunja',
    url: environments.twodoUrl,
    Icon: CheckSquare,
    feature: 'vikunja',
    action: 'read',
  },
  {
    name: 'Actual budget',
    description:
      'Track your expenses and manage your budget effectively with your team. Powered by Actual.',
    url: environments.actualUrl,
    Icon: DollarSign,
    feature: 'actual_budget',
    action: 'read',
  },
  {
    name: 'CV',
    description:
      'Professional CV and resume showcase with detailed experience and skills.',
    url: environments.cvUrl,
    Icon: User,
    feature: null,
    action: null,
    adminOnly: true,
  },
  {
    name: 'Redis Store',
    description: 'Browse and manage Redis store key-value entries.',
    url: environments.storeUrl,
    Icon: Database,
    feature: 'redis_store',
    action: 'read',
  },
];

export default function AppsPage() {
  const { data: permissions = [], isLoading: permissionsLoading } =
    usePermissions();
  const { isAdmin, isLoading: rolesLoading } = useIsAdmin();

  const isLoading = permissionsLoading || rolesLoading;

  const visibleApps = ALL_APPS.filter((app) => {
    if (app.adminOnly && !isAdmin) return false;
    if (!app.feature) return true;
    return permissions.some(
      (p) => p.feature?.name === app.feature && p.action?.name === app.action,
    );
  });

  return (
    <div>
      <div className="mb-4">
        <TypographyH1>Your apps</TypographyH1>
      </div>
      <div className="mb-4">
        <TypographyP>
          Here are the list of all cockpit apps that you have access to:
        </TypographyP>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        {isLoading
          ? null
          : visibleApps.map((project) => (
              <AppCard
                key={project.name}
                title={project.name}
                description={project.description}
                url={project.url}
                Icon={project.Icon}
              />
            ))}
      </div>
    </div>
  );
}
