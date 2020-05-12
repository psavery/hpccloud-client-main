import { anonymousRedirect } from '@/utils/RedirectHelper';

export default anonymousRedirect(
  {
    name: 'projects.select',
    methods: {
      beginProject() {
        this.$router.push(`/${this.type}`);
      },
    },
    data() {
      return {
        type: '',
        types: ['ParFlow'],
      };
    },
  },
  '/'
);
