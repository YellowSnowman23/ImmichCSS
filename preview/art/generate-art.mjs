// Original landscape illustrations for the theme previews. MIT licensed.
// Run from any directory: node preview/art/generate-art.mjs
import { writeFile } from 'node:fs/promises';

let state = 73491;
const random = () => ((state = (state * 16807) % 2147483647) - 1) / 2147483646;
const mountains = (base, amplitude, count = 21) => {
  const points = Array.from({length: count}, (_, i) => `${i * 1200 / (count - 1)},${Math.round(base - random() * amplitude)}`);
  return `M0 800 L${points.join(' L')} L1200 800Z`;
};
const palettes = [
  ['alpine-morning', ['#d5e5df','#9bb4c3','#b8c9cc','#718c99','#3a626d','#244c59'], 'mountain'],
  ['desert-light', ['#efdfc9','#dbac86','#c78a6b','#a16c58','#794e47','#573d3d'], 'dune'],
  ['quiet-pines', ['#c5d0c2','#759486','#9da999','#557c6a','#345749','#1c3e34'], 'forest'],
  ['blue-hour', ['#d7cbdd','#8894ba','#acafca','#697ba6','#3e587e','#233e62'], 'mountain'],
  ['pacific-edge', ['#c4dfe0','#6aa6b4','#86bac1','#4c91a4','#327084','#235362'], 'coast'],
  ['golden-valley', ['#f1d8a6','#ca9b65','#c5aa79','#9d8c65','#706b4a','#474f3b'], 'mountain'],
  ['highland-mist', ['#dbddd2','#a6b1aa','#a7b6a8','#7c9786','#587967','#3e5e50'], 'forest'],
  ['copper-ridge', ['#e7c6b4','#ba8f80','#c39786','#9b7168','#744e4e','#513c42'], 'dune'],
  ['silver-lake', ['#dce3e8','#a7b8c9','#c4cdd5','#879caa','#5b7c8b','#355666'], 'lake'],
  ['last-light', ['#ecd1bd','#b58d9e','#bba1ad','#85788f','#5a5d7a','#353e59'], 'forest'],
];

for (const [name, c, kind] of palettes) {
  const sky = `<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="${c[0]}"/><stop offset="1" stop-color="${c[1]}"/></linearGradient><linearGradient id="water" x2="0" y2="1"><stop stop-color="${c[3]}"/><stop offset="1" stop-color="${c[5]}"/></linearGradient><radialGradient id="glow"><stop stop-color="#fff5d9" stop-opacity=".5"/><stop offset="1" stop-color="#fff5d9" stop-opacity="0"/></radialGradient><filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feBlend in="SourceGraphic" mode="soft-light"/></filter><filter id="blur"><feGaussianBlur stdDeviation="22"/></filter></defs>`;
  let scene = `<rect width="1200" height="800" fill="url(#sky)"/><ellipse cx="850" cy="200" rx="420" ry="360" fill="url(#glow)"/><circle cx="862" cy="196" r="43" fill="#fff4da" opacity=".54"/><path d="M0 205Q210 172 450 210T1200 190" fill="none" stroke="#fff" opacity=".14" stroke-width="48" filter="url(#blur)"/>`;
  if (kind === 'dune') {
    scene += `<path d="M0 466Q275 175 570 422T1200 340V800H0Z" fill="${c[2]}"/><path d="M0 598Q385 268 817 510T1200 496V800H0Z" fill="${c[3]}"/><path d="M0 670Q370 685 677 502Q900 590 1200 683V800H0Z" fill="${c[4]}"/><path d="M677 502Q485 635 373 800H0V670Q370 685 677 502Z" fill="${c[5]}" opacity=".7"/>`;
    for (let i=0;i<18;i++) scene += `<path d="M${i*75-100} 800Q${i*75+80} 650 ${i*45+500} 600" fill="none" stroke="${c[1]}" stroke-width="1" opacity=".12"/>`;
  } else if (kind === 'coast') {
    scene += `<path d="${mountains(470,100)}" fill="${c[2]}"/><rect y="466" width="1200" height="334" fill="url(#water)"/><path d="M0 410Q160 450 252 565L510 790H0Z" fill="${c[5]}"/><path d="M0 412Q160 450 252 565L350 650Q190 570 0 583Z" fill="${c[4]}"/><path d="M1200 470Q1000 480 970 550L825 800H1200Z" fill="${c[3]}"/>`;
    for(let i=0;i<20;i++) scene += `<path d="M${300+random()*450} ${500+i*14}h${30+random()*180}" stroke="#dce7dd" opacity=".18" fill="none" stroke-width="${1+i/10}"/>`;
  } else {
    scene += `<path d="${mountains(451,205)}" fill="${c[2]}"/><path d="${mountains(524,230,15)}" fill="${c[3]}"/><path d="${mountains(623,195,12)}" fill="${c[4]}"/>`;
    if (kind === 'lake') {
      scene += `<rect y="577" width="1200" height="223" fill="url(#water)"/><path d="M0 577Q140 595 305 584T650 586T1200 578" stroke="${c[0]}" stroke-width="2" opacity=".5" fill="none"/>`;
      for(let i=0;i<32;i++) scene += `<path d="M${random()*1200} ${590+random()*220}h${50+random()*230}" stroke="${c[0]}" opacity=".15" fill="none"/>`;
    } else {
      scene += `<path d="M0 753Q280 590 550 694T1200 651V800H0Z" fill="${c[5]}"/>`;
    }
    if (kind === 'forest') {
      for(let i=0;i<72;i++) {
        const x = i*18-35, y = 590+random()*190, h=65+random()*150, w=h/4;
        scene += `<path d="M${x} ${y-h}l${w} ${h*.6}h${-w*.48}l${w*.65} ${h*.23}h${-w*.47}l${w*.6} ${h*.17}h${-w*2.6}l${w*.6} ${-h*.17}h${-w*.47}l${w*.65} ${-h*.23}h${-w*.48}Z" fill="${c[5]}" opacity="${.55+random()*.4}"/>`;
      }
    }
  }
  scene += `<rect width="1200" height="800" fill="#858585" opacity=".075" filter="url(#grain)"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800" role="img" aria-labelledby="title"><title id="title">${name.replaceAll('-',' ')} — original landscape illustration</title>${sky}${scene}</svg>\n`;
  await writeFile(new URL(`./${name}.svg`, import.meta.url), svg);
}
console.log(`Generated ${palettes.length} original SVG landscape illustrations.`);
