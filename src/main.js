import Vue from 'vue';
import App from './App.vue';
import vuetify from './plugins/vuetify';

import GirderProvider from './plugins/girder';
import store from './store';

Vue.config.productionTip = false;

new Vue({
  provide: GirderProvider,
  vuetify,
  store,
  render: (h) => h(App),
}).$mount('#app');
