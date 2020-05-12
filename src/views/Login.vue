<script>
import GirderLogin from '@girder/components/src/components/Authentication/Login.vue';
import { authRedirect } from '@/utils/RedirectHelper';

export default authRedirect(
  {
    name: 'login',
    inject: ['girderRest'],
    components: {
      GirderLogin,
    },
    props: {
      /* Enable OAuth login from this component? */
      oauth: {
        type: Boolean,
        default: false,
      },
      oauthProviders: {
        type: Array,
        default: () => [],
      },
    },
  },
  '/Projects'
);
</script>

<template>
  <girder-login
    :oauth-providers="oauthProviders"
    forgot-password-url="/#/resetPassword"
  />
</template>
