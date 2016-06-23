/**
* respect to https://github.com/cuth/postcss-pxtorem/
**/
import postcss from 'postcss';

const defaultOpts = {
  rootValue: 100,
  unitPrecision: 5,
  selectorBlackList: [],
  propWhiteList: [],
  ignoreIdentifier: false,
  replace: true,
  mediaQuery: false,
  minPixelValue: 0,
};

const toFixed = (number, precision) => {
  const multiplier = Math.pow(10, precision + 1);
  const wholeNumber = Math.floor(number * multiplier);

  return Math.round(wholeNumber / 10) * 10 / multiplier;
};

const createPxReplace = (rootValue, identifier, unitPrecision, minPixelValue) => (m, $1) => {
  if (!$1) return m;
  if (identifier && m.indexOf(identifier) === 0) return m.replace(identifier, '');
  const pixels = parseFloat($1);
  if (pixels < minPixelValue) return m;
  const fixedVal = toFixed((pixels / rootValue), unitPrecision);

  return `${fixedVal}rem`;
};

const declarationExists = (decls, prop, value) => decls.some(decl =>
  decl.prop === prop && decl.value === value
);

const blacklistedSelector = (blacklist, selector) => {
  if (typeof selector !== 'string') return false;

  return blacklist.some(regex => {
    if (typeof regex === 'string') return selector.indexOf(regex) !== -1;

    return selector.match(regex);
  });
};

const handleIgnoreIdentifierRegx = identifier => {
  const _identifier = identifier;
  let backslashfy = _identifier.split('').join('\\');
  backslashfy = `\\${backslashfy}`;
  const pattern = `"[^"]+"|'[^']+'|url\\([^\\)]+\\)|((${backslashfy}|\\d*)\\.?\\d+)px`;

  return new RegExp(pattern, 'ig');
};

export default postcss.plugin('postcss-plugin-px2rem', options => {
  const opts = { ...defaultOpts, ...options };
  let pxRegex = /"[^"]+"|'[^']+'|url\([^\)]+\)|(\d*\.?\d+)px/ig;
  let identifier = opts.ignoreIdentifier;
  if (identifier && typeof identifier === 'string') {
    identifier = identifier.replace(/\s+/g, '');
    opts.replace = true;
    pxRegex = handleIgnoreIdentifierRegx(identifier);
  } else {
    identifier = false;
  }
  const pxReplace = createPxReplace(opts.rootValue, identifier, opts.unitPrecision, opts.minPixelValue);

  return css => {
    css.walkDecls((decl, i) => {
      const _decl = decl;
      // 1st check 'px'
      if (_decl.value.indexOf('px') === -1) return;
      // 2nd check property white list
      if (opts.propWhiteList.length && opts.propWhiteList.indexOf(_decl.prop) === -1) return;
      // 3rd check seletor black list
      if (blacklistedSelector(opts.selectorBlackList, _decl.parent.selector)) return;

      const value = _decl.value.replace(pxRegex, pxReplace);

      // if rem unit already exists, do not add or replace
      if (declarationExists(_decl.parent, _decl.prop, value)) return;

      if (opts.replace) {
        _decl.value = value;
      } else {
        _decl.parent.insertAfter(i, _decl.clone({
          value,
        }));
      }
    });

    if (opts.mediaQuery) {
      css.walkAtRules('media', rule => {
        const _rule = rule;
        if (_rule.params.indexOf('px') === -1) return;
        _rule.params = _rule.params.replace(pxRegex, pxReplace);
      });
    }
  };
});
