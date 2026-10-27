// the custom icons of the examples, shared by the widget docs

// a custom play icon, inlined as a data URL: a gradient circle with a soft ring and a rounded triangle.
// Only `#` needs escaping in an SVG data URL, the rest stays readable in the code example
const playIconSvg = `
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='#6366f1'/>
        <stop offset='1' stop-color='#a855f7'/>
      </linearGradient>
    </defs>
    <circle cx='32' cy='32' r='29' fill='url(#g)' stroke='#fff' stroke-opacity='.55' stroke-width='4'/>
    <path d='M27 22.4v19.2a2 2 0 0 0 3 1.7l15.4-9.6a2 2 0 0 0 0-3.4L30 20.7a2 2 0 0 0-3 1.7z' fill='#fff' transform='translate(-3 0)'/>
  </svg>
`;

export const toDataUrl = (svg: string) => `data:image/svg+xml;utf8,${svg.replaceAll(/\n\s*/g, '').replaceAll('#', '%23')}`;
export const playIcon = toDataUrl(playIconSvg);

// custom carousel arrows, in the style of the play icon: a gradient circle with a soft ring and a rounded chevron
const arrowIconSvg = (chevron: string) => `
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='#6366f1'/>
        <stop offset='1' stop-color='#a855f7'/>
      </linearGradient>
    </defs>
    <circle cx='32' cy='32' r='29' fill='url(#g)' stroke='#fff' stroke-opacity='.55' stroke-width='4'/>
    <path d='${chevron}' fill='none' stroke='#fff' stroke-width='5' stroke-linecap='round' stroke-linejoin='round'/>
  </svg>
`;

export const previousIcon = toDataUrl(arrowIconSvg('M36 20 24 32l12 12'));
export const nextIcon = toDataUrl(arrowIconSvg('M28 20l12 12-12 12'));
