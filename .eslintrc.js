module.exports = {
  root: true,
  extends: ['plugin:vue/essential', '@vue/airbnb', '@vue/prettier'],
  rules: {
    'import/extensions': 0,
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-plusplus': [2, { allowForLoopAfterthoughts: true }],
    'no-underscore-dangle': [2, { allow: ['_id'] }],
  },
  parserOptions: {
    parser: 'babel-eslint',
  },
};
