import postcss from 'postcss';
import expect from 'expect';
import pxtorem from '../src/';

const basicCSS = '.rule { font-size: 15px }';

describe('px2rem', () => {
  it('should work on the readme example', () => {
    const input = 'h1 { margin: 0 0 20px 20px; font-size: 32px; line-height: 1.2; letter-spacing: 1px; }';
    const output = 'h1 { margin: 0 0 0.2rem 0.2rem; font-size: 0.32rem; line-height: 1.2; letter-spacing: 0.01rem; }';
    const processed = postcss(pxtorem()).process(input).css;

    expect(processed).toBe(output);
  });

  it('should replace the px unit with rem', () => {
    const processed = postcss(pxtorem()).process(basicCSS).css;
    const expected = '.rule { font-size: 0.15rem }';

    expect(processed).toBe(expected);
  });

  it('should ignore non px properties', () => {
    const expected = '.rule { font-size: 2em }';
    const processed = postcss(pxtorem()).process(expected).css;

    expect(processed).toBe(expected);
  });

  it('should handle < 1 values and values without a leading 0', () => {
    const rules = '.rule { margin: 0.5rem .5px -0.2px -.2em }';
    const expected = '.rule { margin: 0.5rem 0.005rem -0.002rem -.2em }';
    const options = {
      propWhiteList: ['margin'],
    };
    const processed = postcss(pxtorem(options)).process(rules).css;

    expect(processed).toBe(expected);
  });

  it('should not add properties that already exist', () => {
    const expected = '.rule { font-size: 16px; font-size: 0.16rem; }';
    const processed = postcss(pxtorem()).process(expected).css;

    expect(processed).toBe(expected);
  });
});

describe('value parsing', () => {
  it('should not replace values in double quotes or single quotes', () => {
    const options = {
      propWhiteList: [],
    };
    const rules = '.rule { content: \'16px\'; font-family: "16px"; font-size: 16px; }';
    const expected = '.rule { content: \'16px\'; font-family: "16px"; font-size: 0.16rem; }';
    const processed = postcss(pxtorem(options)).process(rules).css;

    expect(processed).toBe(expected);
  });

  it('should not replace values in `url()`', () => {
    const options = {
      propWhiteList: [],
    };
    const rules = '.rule { background: url(16px.jpg); font-size: 16px; }';
    const expected = '.rule { background: url(16px.jpg); font-size: 0.16rem; }';
    const processed = postcss(pxtorem(options)).process(rules).css;

    expect(processed).toBe(expected);
  });
});

describe('rootValue', () => {
  it('should replace using a root value of 10', () => {
    const expected = '.rule { font-size: 1.5rem }';
    const options = {
      rootValue: 10,
    };
    const processed = postcss(pxtorem(options)).process(basicCSS).css;

    expect(processed).toBe(expected);
  });
});

describe('unitPrecision', () => {
  it('should replace using a decimal of 2 places', () => {
    const expected = '.rule { font-size: 0.94rem }';
    const options = {
      rootValue: 16,
      unitPrecision: 2,
    };
    const processed = postcss(pxtorem(options)).process(basicCSS).css;

    expect(processed).toBe(expected);
  });
});

describe('propWhiteList', () => {
  it('should only replace properties in the white list', () => {
    const expected = '.rule { font-size: 15px }';
    const options = {
      propWhiteList: ['font'],
    };
    const processed = postcss(pxtorem(options)).process(basicCSS).css;

    expect(processed).toBe(expected);
  });

  it('should replace all properties when white list is empty', () => {
    const rules = '.rule { margin: 16px; font-size: 15px }';
    const expected = '.rule { margin: 0.16rem; font-size: 0.15rem }';
    const options = {
      propWhiteList: [],
    };
    const processed = postcss(pxtorem(options)).process(rules).css;

    expect(processed).toBe(expected);
  });
});

describe('propBlackList', () => {
  it('should not replace properties in the black list', () => {
    const expected = '.rule { font-size: 15px }';
    const options = {
      propBlackList: ['font'],
    };
    const processed = postcss(pxtorem(options)).process(basicCSS).css;

    expect(processed).toBe(expected);
  });
});

describe('selectorBlackList', () => {
  it('should ignore selectors in the selector black list', () => {
    const rules = '.rule { font-size: 15px } .rule2 { font-size: 15px }';
    const expected = '.rule { font-size: 0.15rem } .rule2 { font-size: 15px }';
    const options = {
      selectorBlackList: ['.rule2'],
    };
    const processed = postcss(pxtorem(options)).process(rules).css;

    expect(processed).toBe(expected);
  });

  it('should ignore every selector with `body$`', () => {
    const rules = 'body { font-size: 16px; } .class-body$ { font-size: 16px; } .simple-class { font-size: 16px; }';
    const expected = 'body { font-size: 0.16rem; } .class-body$ { font-size: 16px; } .simple-class { font-size: 0.16rem; }';
    const options = {
      selectorBlackList: ['body$'],
    };
    const processed = postcss(pxtorem(options)).process(rules).css;

    expect(processed).toBe(expected);
  });

  it('should only ignore exactly `body`', () => {
    const rules = 'body { font-size: 16px; } .class-body { font-size: 16px; } .simple-class { font-size: 16px; }';
    const expected = 'body { font-size: 16px; } .class-body { font-size: 0.16rem; } .simple-class { font-size: 0.16rem; }';
    const options = {
      selectorBlackList: [/^body$/],
    };
    const processed = postcss(pxtorem(options)).process(rules).css;

    expect(processed).toBe(expected);
  });
});

describe('ignoreIdentifier', () => {
  it('should not replace px when ignoreIdentifier enabled', () => {
    const options = {
      ignoreIdentifier: '00',
    };
    const input = 'h1 { margin: 0 0 00.5px 16px; border-width: 001px; font-size: 32px; font-family: "16px"; }';
    const output = 'h1 { margin: 0 0 .5px 0.16rem; border-width: 1px; font-size: 0.32rem; font-family: "16px"; }';
    const processed = postcss(pxtorem(options)).process(input).css;

    expect(processed).toBe(output);
  });
});

describe('replace', () => {
  it('should leave fallback pixel unit with root em value', () => {
    const options = {
      replace: false,
    };
    const processed = postcss(pxtorem(options)).process(basicCSS).css;
    const expected = '.rule { font-size: 15px; font-size: 0.15rem }';

    expect(processed).toBe(expected);
  });
});

describe('mediaQuery', () => {
  it('should replace px in media queries', () => {
    const options = {
      mediaQuery: true,
    };
    const processed = postcss(pxtorem(options)).process('@media (min-width: 500px) { .rule { font-size: 16px } }').css;
    const expected = '@media (min-width: 5rem) { .rule { font-size: 0.16rem } }';

    expect(processed).toBe(expected);
  });
});

describe('minPixelValue', () => {
  it('should not replace values below minPixelValue', () => {
    const options = {
      propWhiteList: [],
      minPixelValue: 2,
    };
    const rules = '.rule { border: 1px solid #000; font-size: 16px; margin: 1px 10px; }';
    const expected = '.rule { border: 1px solid #000; font-size: 0.16rem; margin: 1px 0.1rem; }';
    const processed = postcss(pxtorem(options)).process(rules).css;

    expect(processed).toBe(expected);
  });
});

describe('rpx support', function () {
  it('should work on the readme example', () => {
    const input = 'h1 { margin: 0 0 20rpx 20rpx; font-size: 32px; line-height: 1.2; letter-spacing: 1rpx; }';
    const output = 'h1 { margin: 0 0 0.2rem 0.2rem; font-size: 0.64rem; line-height: 1.2; letter-spacing: 0.01rem; }';
    const processed = postcss(pxtorem({
      rootValue: { px: 50, rpx: 100 },
    })).process(input).css;

    expect(processed).toBe(output);
  });

  it('should replace rpx in media queries', () => {
    const options = {
      mediaQuery: true,
      rootValue: { px: 50, rpx: 100 },
    };
    const processed = postcss(pxtorem(options)).process('@media (min-width: 500rpx) { .rule { font-size: 16px } }').css;
    const expected = '@media (min-width: 5rem) { .rule { font-size: 0.32rem } }';

    expect(processed).toBe(expected);
  });

  it('should ignore selectors in the selector black list', () => {
    const rules = '.rule { font-size: 15rpx } .rule2 { font-size: 15px }';
    const expected = '.rule { font-size: 0.15rem } .rule2 { font-size: 15px }';
    const options = {
      selectorBlackList: ['.rule2'],
      rootValue: { px: 50, rpx: 100 },
    };
    const processed = postcss(pxtorem(options)).process(rules).css;

    expect(processed).toBe(expected);
  });

  it('should not replace px when ignoreIdentifier enabled', () => {
    const options = {
      ignoreIdentifier: '00',
      rootValue: { px: 100, rpx: 100 },
    };
    const input = 'h1 { margin: 0 0 00.5px 16rpx; border-width: 001px; font-size: 32px; font-family: "16px"; }';
    const output = 'h1 { margin: 0 0 .5px 0.16rem; border-width: 1px; font-size: 0.32rem; font-family: "16px"; }';
    const processed = postcss(pxtorem(options)).process(input).css;

    expect(processed).toBe(output);
  });
});

describe('exclude support', () => {
  it('should work on the readme example', () => {
    const input = 'h1 { margin: 0 0 20px 20px; font-size: 32px; line-height: 1.2; letter-spacing: 1px; }';
    const output = 'h1 { margin: 0 0 20px 20px; font-size: 32px; line-height: 1.2; letter-spacing: 1px; }';
    const processed = postcss(pxtorem({
      exclude: /(node_modules)/,
    })).process(input, {
      from: 'node_modules/third.css',
    }).css;
    expect(processed).toBe(output);
  });

  it('should work when exclude option range doesn\'t cover', () => {
    const input = 'h1 { margin: 0 0 20px 20px; font-size: 32px; line-height: 1.2; letter-spacing: 1px; }';
    const output = 'h1 { margin: 0 0 0.2rem 0.2rem; font-size: 0.32rem; line-height: 1.2; letter-spacing: 0.01rem; }';
    const processed = postcss(pxtorem({
      exclude: /(node_modules)/,
    })).process(input, {
      from: 'lib/own.css',
    }).css;
    expect(processed).toBe(output);
  });
});
