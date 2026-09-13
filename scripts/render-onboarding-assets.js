const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');

const svg = fs.readFileSync('assets/brand/tngble-logo.svg');
const logo = new Resvg(svg, {
  fitTo: { mode: 'width', value: 632 },
  background: 'rgba(0,0,0,0)',
});
fs.writeFileSync('assets/brand/tngble-logo.png', logo.render().asPng());
console.log('logo', logo.width, 'x', logo.height);

// Prefer splash glow/pattern already rendered at high quality
fs.copyFileSync('assets/splash/glow.png', 'assets/onboarding/glow.png');
fs.copyFileSync('assets/splash/pattern.png', 'assets/onboarding/pattern.png');
console.log('copied glow + pattern');
