<script>
import GirderRegister from '@girder/components/src/components/Authentication/Register.vue';
import { authRedirect } from '@/utils/RedirectHelper';

export default authRedirect(
  {
    name: 'register',
    inject: ['girderRest'],
    components: {
      GirderRegister,
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
  <girder-register :oauth-providers="oauthProviders" />
</template>
