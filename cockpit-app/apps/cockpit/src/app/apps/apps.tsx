import { AppCard } from '@cockpit-app/cockpit-ui';
import {
  CheckSquare,
  Database,
  DollarSign,
  User,
  Bot,
  Brain,
  BookOpen,
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
    feature: null,
    action: null,
    adminOnly: true,
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
  {
    name: 'Storybook',
    description: 'UI component library documentation and visual testing.',
    url: environments.storybookUrl,
    Icon: BookOpen,
    feature: null,
    action: null,
    adminOnly: true,
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

  if (isLoading) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {visibleApps.map((project) => (
        <AppCard
          key={project.name}
          title={project.name}
          description={project.description}
          url={project.url}
          Icon={project.Icon}
        />
      ))}
    </div>
  );
}
