import Vue from 'vue';
import App from './App.vue';
import vuetify from './plugins/vuetify';

import GirderProvider from './plugins/girder';

Vue.config.productionTip = false;

new Vue({
  provide: GirderProvider,
  vuetify,
  render: (h) => h(App),
}).$mount('#app');
