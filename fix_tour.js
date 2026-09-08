const fs = require('fs');
const file = 'src/components/ui/TourOverlay.tsx';
let code = fs.readFileSync(file, 'utf8');

// Replace pointer-events-auto on the svg with pointer-events-none
code = code.replace(
  '<svg className="absolute inset-0 w-full h-full pointer-events-auto" style={{ zIndex: 1 }}>',
  '<svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>'
);

// Add the 4 blocker divs right after the SVG
const svgEnd = '</svg>';
const blockers = `
      {/* 4 Blocker Divs to prevent clicks outside the highlighted area */}
      <div className="absolute top-0 left-0 right-0 pointer-events-auto" style={{ height: Math.max(0, y), zIndex: 1 }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} onMouseDownCapture={(e) => { e.preventDefault(); e.stopPropagation(); }} />
      <div className="absolute bottom-0 left-0 right-0 pointer-events-auto" style={{ top: y + height, bottom: 0, zIndex: 1 }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} onMouseDownCapture={(e) => { e.preventDefault(); e.stopPropagation(); }} />
      <div className="absolute left-0 pointer-events-auto" style={{ top: Math.max(0, y), height, width: Math.max(0, x), zIndex: 1 }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} onMouseDownCapture={(e) => { e.preventDefault(); e.stopPropagation(); }} />
      <div className="absolute right-0 pointer-events-auto" style={{ top: Math.max(0, y), height, left: x + width, right: 0, zIndex: 1 }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} onMouseDownCapture={(e) => { e.preventDefault(); e.stopPropagation(); }} />
`;

if (code.includes(svgEnd) && !code.includes('Blocker Divs')) {
  code = code.replace(svgEnd, svgEnd + blockers);
  fs.writeFileSync(file, code);
  console.log("Success");
} else {
  console.log("Failed to insert blockers");
}

