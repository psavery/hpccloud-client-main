import Vue from 'vue';
import App from './components/core/App';
import vuetify from './plugins/vuetify';

import GirderProvider from './plugins/girder';

// Vue components
import router from './router';
import storeFactory from './store';

Vue.config.productionTip = false;

const store = storeFactory();

new Vue({
  provide: GirderProvider,
  router,
  store,
  vuetify,
  render: (h) => h(App),
}).$mount('#app');
