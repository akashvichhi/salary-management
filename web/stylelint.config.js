export default {
  extends: ['stylelint-config-standard-scss'],
  plugins: ['stylelint-declaration-strict-value'],
  rules:   {
    // Spacing, fonts and colours must come from tokens, never raw values
    'scale-unlimited/declaration-strict-value': [
      ['/color$/', 'background', 'fill', 'stroke', '/^margin/', '/^padding/', '/gap$/',
        'top', 'right', 'bottom', 'left', 'inset', 'font-size', 'font-weight', 'font-family', 'line-height'],
      { ignoreValues: ['0', 'auto', 'none', 'inherit', 'transparent', 'currentColor'], expandShorthand: true },
    ],
    'max-nesting-depth':        3,
    'selector-max-id':          0,
    'declaration-no-important': true,
    'selector-class-pattern':   '^[a-z][a-zA-Z0-9]*$', // camelCase
    'at-rule-disallowed-list':  ['import'], // @use only
  },
}
