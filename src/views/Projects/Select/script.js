import { anonymousRedirect } from '@/utils/RedirectHelper';

export default anonymousRedirect(
  {
    name: 'projects.select',
    methods: {
      setDefaults() {
        this.type = this.type || localStorage.defaultProjectType || 'ParFlow';
      },
      onOk() {
        if (this.setDefault) {
          localStorage.defaultProjectType = this.type;
        }
        const path = `/${this.type}`;
        this.$router.push(path);
      },
    },
    mounted() {
      this.setDefaults();
    },
    data() {
      return {
        setDefault: true,
        type: '',
        types: ['ParFlow'],
        valid: false,
      };
    },
  },
  '/'
);
