import { mapActions } from 'vuex';

import logo from '@/assets/logo.svg';
import md5 from 'md5';

export default {
  name: 'App',
  inject: ['girderRest'],
  components: {},
  props: {
    /* Enable OAuth login from this component? */
    oauth: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      logo,
    };
  },
  computed: {
    isReady() {
      return this.$store.getters.IS_READY;
    },
    loggedIn() {
      return !!this.girderRest.user;
    },
    loggedOut() {
      return this.girderRest.user === null;
    },
    avatar() {
      let email = 'guest';
      if (this.girderRest.user) {
        email = this.girderRest.user.email.trim().toLowerCase();
      }
      return `https://www.gravatar.com/avatar/${md5(email)}?s=64&d=identicon`;
    },
  },
  created() {
    this.$store.dispatch('GIRDER_INITIALIZE', this.girderRest);
  },
  methods: {
    ...mapActions({
      logout: 'LOGOUT',
    }),
  },
  asyncComputed: {
    async oauthProviders() {
      if (this.oauth) {
        try {
          return (
            await this.girderRest.get('oauth/provider', {
              params: {
                redirect: window.location.href,
                list: true,
              },
            })
          ).data;
        } catch (e) {
          return [];
        }
      } else {
        return [];
      }
    },
  },
};
