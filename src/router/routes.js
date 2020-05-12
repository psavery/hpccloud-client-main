import SelectProject from '@/views/Projects/Select';
import AuthenticationRoutes from './AuthenticationRoutes';
import WorkflowRoutes from './WorkflowRoutes';

export default [
  ...AuthenticationRoutes,
  ...WorkflowRoutes,
  {
    path: '/projects',
    name: 'projects',
    component: SelectProject,
  },
];
