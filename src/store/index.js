import Vue from 'vue';
import Vuex from 'vuex';

import active from './active';
import http from './http';

// Install VueX
Vue.use(Vuex);

function createStore() {
  return new Vuex.Store({
    state: {
      ready: false,
    },
    modules: {
      active,
      http,
    },
    getters: {
      IS_READY(state) {
        return state.ready;
      },
    },
    actions: {
      LOGOUT({ dispatch }) {
        dispatch('HTTP_LOGOUT');
      },
      async GIRDER_INITIALIZE({ commit, dispatch, state }, girderClient) {
        commit('HTTP_CLIENT_SET', girderClient);

        girderClient.$on('login', (user) => {
          dispatch('UPDATE_USER', user);
          dispatch('HTTP_CONNECT_EVENTS');
        });
        girderClient.$on('logout', () => {
          dispatch('UPDATE_USER', null);
          dispatch('HTTP_DISCONNECT_EVENTS');
        });

        const user = await girderClient.fetchUser();
        await dispatch('UPDATE_USER', user);
        dispatch('HTTP_CONNECT_EVENTS');

        state.ready = true;
      },
      async UPDATE_USER({ commit }, user) {
        commit('ACTIVE_USER_SET', user);
      },
    },
  });
}

export default createStore;
