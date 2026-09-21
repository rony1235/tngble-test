import {
  AndroidConfig,
  createRunOncePlugin,
  withAndroidColors,
  withAndroidColorsNight,
  withAndroidStyles,
  type ConfigPlugin,
} from 'expo/config-plugins';

/** Matches `colors.inputFill` so Android Autofill does not paint the default gold overlay. */
const INPUT_FILL = '#181623';
const COLOR_NAME = 'autofilled_highlight';

const withAutofillHighlightColor: ConfigPlugin = (config) => {
  const apply = { name: COLOR_NAME, value: INPUT_FILL };

  config = withAndroidColors(config, (mod) => {
    mod.modResults = AndroidConfig.Colors.assignColorValue(mod.modResults, apply);
    return mod;
  });

  return withAndroidColorsNight(config, (mod) => {
    mod.modResults = AndroidConfig.Colors.assignColorValue(mod.modResults, apply);
    return mod;
  });
};

const withTransparentAutofillHighlight: ConfigPlugin = (config) => {
  config = withAutofillHighlightColor(config);

  return withAndroidStyles(config, (mod) => {
    mod.modResults = AndroidConfig.Styles.assignStylesValue(mod.modResults, {
      add: true,
      parent: AndroidConfig.Styles.getAppThemeGroup(),
      name: 'android:autofilledHighlight',
      value: `@color/${COLOR_NAME}`,
    });
    return mod;
  });
};

export default createRunOncePlugin(
  withTransparentAutofillHighlight,
  'with-transparent-autofill-highlight',
  '1.0.0',
);
