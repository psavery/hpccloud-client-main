import SelectProject from '@/views/Projects/Select';

const defaultProjectPath = () => {
  return `/${localStorage.defaultProjectType || 'ParFlow'}`;
};

export default [
  {
    path: '/projects',
    name: 'projects',
    component: SelectProject,
  },
  {
    path: '/defaultProject',
    name: 'defaultProject',
    redirect: defaultProjectPath,
  },
];
