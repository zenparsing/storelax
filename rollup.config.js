import nodeResolve from '@rollup/plugin-node-resolve';

export default {
  input: 'storelax.js',
  output: {
    file: 'dist/storelax.js',
    format: 'es',
  },
  plugins: [nodeResolve()],
};
