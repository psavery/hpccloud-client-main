import Home from '@/src/views/Home.vue';

export default [
  {
    path: '/',
    name: 'home',
    component: Home,
  },
  {
    path: '/login',
    name: 'login',
    component: () =>
      import(/* webpackChunkName: "login" */ '@/src/views/Login.vue'),
  },
  {
    path: '/register',
    name: 'register',
    component: () =>
      import(/* webpackChunkName: "register" */ '@/src/views/Register.vue'),
  },
  {
    path: '/resetPassword',
    name: 'resetPassword',
    component: () =>
      import(/* webpackChunkName: "resetPassword" */ '@/src/views/ResetPassword.vue'),
  },
];
