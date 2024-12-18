import { factory } from '@zzxming/eslint-config';

export default factory({
  overrides: [
    {
      rules: {
        'ts/ban-ts-comment': 'off',
      },
    },
  ],
});
