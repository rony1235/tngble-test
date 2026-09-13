const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');

let svg = fs.readFileSync('assets/splash/pattern.svg', 'utf8');
svg = svg
  .replace(
    'opacity="0.06"',
    'opacity="0.14" mask="url(#pattern-opacity-mask)"',
  )
  .replace('fill="url(#paint0_linear_0_4)"', 'fill="#FFFFFF"')
  .replace(
    '<defs>',
    `<defs>
<linearGradient id="pattern-opacity-gradient" x1="0" y1="0" x2="0" y2="427" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="white"/>
<stop offset="0.42" stop-color="white"/>
<stop offset="0.68" stop-color="white" stop-opacity="0.45"/>
<stop offset="0.9" stop-color="white" stop-opacity="0.06"/>
<stop offset="1" stop-color="black"/>
</linearGradient>
<mask id="pattern-opacity-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="427" height="427">
<rect width="427" height="427" fill="url(#pattern-opacity-gradient)"/>
</mask>`,
  );
const pattern = new Resvg(svg, {
  fitTo: { mode: 'zoom', value: 3 },
  background: 'rgba(0,0,0,0)',
});
fs.writeFileSync('assets/splash/pattern.png', pattern.render().asPng());
console.log('pattern', pattern.width, 'x', pattern.height);

const glow = new Resvg(fs.readFileSync('assets/splash/glow.svg'), {
  fitTo: { mode: 'zoom', value: 2 },
  background: 'rgba(0,0,0,0)',
});
fs.writeFileSync('assets/splash/glow.png', glow.render().asPng());
console.log('glow', glow.width, 'x', glow.height);
