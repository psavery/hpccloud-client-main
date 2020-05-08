export default {
  state: {
    user: null,
  },
  getters: {
    ACTIVE_USER(state) {
      return state.user;
    },
  },
  mutations: {
    ACTIVE_USER_SET(state, value) {
      state.user = value;
    },
  },
};
