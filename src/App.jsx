import React, { useState, useEffect, useRef } from 'react'
import { Stage, Layer, Circle, Line, Rect, Text } from 'react-konva'

const theme = {
  bg: '#000f22',
  bgElev: '#08182f',
  panel: '#12294a',
  panelBorder: '#3f6593',
  hair: '#1b3554',
  board: '#04122a',
  rose: '#5b86b6',
  roseBright: '#c0e6fd',
  silk: '#e6f2fd',
  silkDim: '#80aad3',
  error: '#ff6b7d',
  success: '#7fe0c4',
}

const colorMap = {
  resistor: '#c0e6fd',
  led: '#ff6b7d',
  battery: '#7fe0c4',
  capacitor: '#80aad3',
  switch: '#5b86b6',
  diode: '#e8927a',
  transistor: '#f2b6c8',
  inductor: '#7ab8e8',
}

const TOOLS = [
  { id: 'wire', label: 'Wire', sub: 'jumper link' },
  { id: 'resistor', label: 'Resistor', sub: 'Ω limiter' },
  { id: 'led', label: 'LED', sub: 'diode' },
  { id: 'battery', label: 'Battery', sub: 'source' },
  { id: 'capacitor', label: 'Capacitor', sub: 'F store' },
  { id: 'switch', label: 'Switch', sub: 'toggle' },
  { id: 'diode', label: 'Diode', sub: 'one-way' },
  { id: 'transistor', label: 'Transistor', sub: 'C-E switch' },
  { id: 'inductor', label: 'Inductor', sub: 'H coil' },
]

const REFERENCES = [
  { id: 'led_resistor', label: 'LED-Resistor' },
  { id: 'voltage_divider', label: 'Voltage Divider' },
  { id: 'rc_circuit', label: 'RC Circuit' },
  { id: 'switch_led', label: 'Switch-Controlled LED' },
]

function ToolGlyph({ id, color }) {
  const common = { stroke: color, strokeWidth: 1.6, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }
  return (
    <svg width="30" height="18" viewBox="0 0 30 18" aria-hidden="true">
      {id === 'wire' && <line x1="2" y1="9" x2="28" y2="9" {...common} />}
      {id === 'resistor' && <polyline points="2,9 7,9 9,3 13,15 17,3 21,15 23,9 28,9" {...common} />}
      {id === 'led' && (
        <>
          <line x1="2" y1="9" x2="11" y2="9" {...common} />
          <polygon points="11,3 11,15 20,9" fill={color} stroke={color} />
          <line x1="20" y1="3" x2="20" y2="15" {...common} />
          <line x1="20" y1="9" x2="28" y2="9" {...common} />
        </>
      )}
      {id === 'battery' && (
        <>
          <line x1="2" y1="9" x2="12" y2="9" {...common} />
          <line x1="12" y1="2" x2="12" y2="16" {...common} strokeWidth={2.4} />
          <line x1="17" y1="5" x2="17" y2="13" {...common} strokeWidth={1.4} />
          <line x1="17" y1="9" x2="28" y2="9" {...common} />
        </>
      )}
      {id === 'capacitor' && (
        <>
          <line x1="2" y1="9" x2="13" y2="9" {...common} />
          <line x1="13" y1="3" x2="13" y2="15" {...common} strokeWidth={2.2} />
          <line x1="17" y1="3" x2="17" y2="15" {...common} strokeWidth={2.2} />
          <line x1="17" y1="9" x2="28" y2="9" {...common} />
        </>
      )}
      {id === 'switch' && (
        <>
          <line x1="2" y1="9" x2="9" y2="9" {...common} />
          <circle cx="9" cy="9" r="1.6" fill={color} />
          <line x1="9" y1="9" x2="20" y2="3" {...common} />
          <circle cx="21" cy="9" r="1.6" fill={color} />
          <line x1="21" y1="9" x2="28" y2="9" {...common} />
        </>
      )}
      {id === 'diode' && (
  <>
    <line x1="2" y1="9" x2="11" y2="9" {...common} />
    <polygon points="11,3 11,15 20,9" fill={color} stroke={color} />
    <line x1="20" y1="3" x2="20" y2="15" {...common} />
    <line x1="20" y1="9" x2="28" y2="9" {...common} />
  </>
)}
{id === 'transistor' && (
  <>
    <line x1="2" y1="9" x2="10" y2="9" {...common} />
    <circle cx="15" cy="9" r="6" {...common} />
    <line x1="10" y1="9" x2="20" y2="9" {...common} />
    <line x1="20" y1="9" x2="28" y2="9" {...common} />
  </>
)}
{id === 'inductor' && (
  <>
    <line x1="2" y1="9" x2="7" y2="9" {...common} />
    <path d="M7,9 a3,4 0 0 1 6,0 a3,4 0 0 1 6,0 a3,4 0 0 1 6,0" {...common} />
    <line x1="25" y1="9" x2="28" y2="9" {...common} />
  </>
)}
    </svg>
  )
}

export default function App() {
  const holeRadius = 4
  const holeSpacing = 20
  const rowSpacing = 20

  const holes = []
  const [selectedHole, setSelectedHole] = useState(null)
  const [wires, setWires] = useState([])
  const [selectedTool, setSelectedTool] = useState('wire')
  const [components, setComponents] = useState([])
  const [checkResult, setCheckResult] = useState(null)
  const [referenceCircuit, setReferenceCircuit] = useState('led_resistor')
  const [selectedWireIndex, setSelectedWireIndex] = useState(null)
  const [selectedComponentId, setSelectedComponentId] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [explanation, setExplanation] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false);
  const [targetCircuit, setTargetCircuit] = useState(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false)
  const stageRef = useRef(null);
  const stageWrapperRef = useRef(null);
  const [stageScale, setStageScale] = useState(1);

  const BASE_STAGE_WIDTH = 700;
  const BASE_STAGE_HEIGHT = 410;

  useEffect(() => {
    const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    const updateScale = () => {
      if (!stageWrapperRef.current) return
      const availableWidth = stageWrapperRef.current.offsetWidth
      if (!availableWidth) return
      const rawScale = availableWidth / BASE_STAGE_WIDTH
      const clamped = Math.min(Math.max(rawScale, 0.4), 1)
      setStageScale(clamped)
    }
    updateScale()
    const observer = new ResizeObserver(updateScale)
    if (stageWrapperRef.current) observer.observe(stageWrapperRef.current)
    window.addEventListener('resize', updateScale)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateScale)
    }
  }, [])

  const getHoleColor = (hole) => {
    if (selectedHole?.key === hole.key) return theme.roseBright
    if (hole.key.includes('plus')) return '#ff6b7d'
    if (hole.key.includes('minus')) return '#3f6593'
    return '#1b3554'
  }

  const handleHoleClick = (hole) => {
    if (selectedHole === null) {
      setSelectedHole(hole)
    } else {
      if (selectedTool === 'wire') {
        setWires([...wires, { from: selectedHole, to: hole }])
      } else {
        const prefixMap = { resistor: 'R', led: 'LED', battery: 'BAT', capacitor: 'C', switch: 'SW',diode: 'D', transistor: 'Q', inductor: 'L' }
        const prefix = prefixMap[selectedTool]
        const countOfThisType = components.filter((c) => c.type === selectedTool).length
        const newId = `${prefix}${countOfThisType + 1}`

        let value = null
        if (selectedTool === 'resistor') {
          value = parseFloat(prompt('Resistance (ohms):', '220')) || 220
        } else if (selectedTool === 'battery') {
          value = parseFloat(prompt('Voltage (V):', '5')) || 5
        } else if (selectedTool === 'capacitor') {
          value = parseFloat(prompt('Capacitance (farads):', '0.0001')) || 0.0001
        }
         else if (selectedTool === 'inductor') {
         value = parseFloat(prompt('Inductance (henries):', '0.001')) || 0.001;
        }

        setComponents([...components, { type: selectedTool, from: selectedHole, to: hole, id: newId, value }])
      }
      setSelectedHole(null)
    }
  }

  const handleWireClick = (index) => {
    setSelectedWireIndex(index)
    setSelectedComponentId(null)
  }

  const handleComponentClick = (id) => {
    setSelectedComponentId(id)
    setSelectedWireIndex(null)
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedWireIndex !== null) {
          setWires(wires.filter((_, i) => i !== selectedWireIndex))
          setSelectedWireIndex(null)
        }
        if (selectedComponentId !== null) {
          setComponents(components.filter((c) => c.id !== selectedComponentId))
          setSelectedComponentId(null)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedWireIndex, selectedComponentId, wires, components])

  const explainFaults = async () => {
    if (!checkResult?.faults?.length) return
    setLoadingExplanation(true)
    setExplanation(null)
    try {
      const response = await fetch('https://wyrdly-backend.onrender.com/explain-faults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faults: checkResult.faults, skill_level: 'beginner' }),
      })
      const data = await response.json()
      if (!response.ok) {
        const detail = Array.isArray(data.detail)
          ? data.detail.map((d) => d.msg || d).join(', ')
          : data.detail
        setExplanation(detail || 'Explanation service returned an error.')
        return
      }
      setExplanation(data.explanation)
    } catch (error) {
      console.error('Error fetching explanation:', error)
      setExplanation('Could not reach explanation service. Is the backend running?')
    } finally {
      setLoadingExplanation(false)
    }
  }
  const handleSchematicUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("https://wyrdly-backend.onrender.com/parse-schematic", {
      method: "POST",
      body: formData
    });
    const data = await response.json();
    setTargetCircuit(data);
    setMenuOpen(false);
  } catch (error) {
    alert("Could not read schematic. Try a clearer image.");
  }
};
const handleExportCircuit = () => {
  const data = {
    wires: wires.map(w => ({ from: w.from.key, to: w.to.key })),
    components: components.map(c => ({
      type: c.type,
      id: c.id,
      from: c.from.key,
      to: c.to.key,
      value: c.value
    }))
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wyrdly-circuit-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  setMenuOpen(false);
};

const handleExportPNG = () => {
  if (!stageRef.current) return;
  const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 });
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = `wyrdly-circuit-${Date.now()}.png`;
  a.click();
  setMenuOpen(false);
};

  const checkCircuit = async () => {
    setExplanation(null)
    const payload = {
      wires: wires.map((w) => ({ from_hole: { key: w.from.key }, to_hole: { key: w.to.key } })),
      components: components.map((c) => ({
        type: c.type,
        id: c.id,
        from_hole: { key: c.from.key },
        to_hole: { key: c.to.key },
        value: c.value,
      })),
      reference_circuit_name: referenceCircuit === '_imported' ? null : referenceCircuit,
  custom_reference: referenceCircuit === '_imported' ? targetCircuit : null,
    }

    try {
      const response = await fetch('https://wyrdly-backend.onrender.com/check-circuit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      setCheckResult(data)
    } catch (error) {
      console.error('Error checking circuit:', error)
      setCheckResult({ error: 'Could not reach backend. Is the server running?' })
    }
  }

  const topRows = ['a', 'b', 'c', 'd', 'e']
  const bottomRows = ['f', 'g', 'h', 'i', 'j']
  const centerGap = 20
  const mainStripStartY = 100

  for (let col = 1; col <= 30; col++) {
    const x = 50 + col * holeSpacing
    topRows.forEach((row, i) => {
      holes.push({ x, y: mainStripStartY + i * rowSpacing, key: `main-${col}-${row}` })
    })
    bottomRows.forEach((row, i) => {
      holes.push({ x, y: mainStripStartY + topRows.length * rowSpacing + centerGap + i * rowSpacing, key: `main-${col}-${row}` })
    })
  }

  for (let col = 1; col <= 25; col++) {
    holes.push({ x: 50 + col * holeSpacing, y: 30, key: `top-plus-${col}` })
    holes.push({ x: 50 + col * holeSpacing, y: 50, key: `top-minus-${col}` })
  }

  const bottomRailY = mainStripStartY + topRows.length * rowSpacing + centerGap + bottomRows.length * rowSpacing + 40
  for (let col = 1; col <= 25; col++) {
    holes.push({ x: 50 + col * holeSpacing, y: bottomRailY, key: `bottom-plus-${col}` })
    holes.push({ x: 50 + col * holeSpacing, y: bottomRailY + 20, key: `bottom-minus-${col}` })
  }

  const renderComponentSymbol = (comp, isSelected) => {
    const color = isSelected ? theme.roseBright : colorMap[comp.type]
    const strokeW = isSelected ? 3 : 2
    const x1 = comp.from.x, y1 = comp.from.y, x2 = comp.to.x, y2 = comp.to.y
    const midX = (x1 + x2) / 2, midY = (y1 + y2) / 2

    const dx = x2 - x1, dy = y2 - y1
    const len = Math.sqrt(dx * dx + dy * dy) || 1
    const ux = dx / len, uy = dy / len
    const px = -uy, py = ux

    const leadLen = Math.min(len * 0.28, 10)
    const bodyStartX = x1 + ux * leadLen, bodyStartY = y1 + uy * leadLen
    const bodyEndX = x2 - ux * leadLen, bodyEndY = y2 - uy * leadLen

    const commonLeads = (
      <>
        <Line points={[x1, y1, bodyStartX, bodyStartY]} stroke={color} strokeWidth={strokeW} />
        <Line points={[bodyEndX, bodyEndY, x2, y2]} stroke={color} strokeWidth={strokeW} />
      </>
    )

    if (comp.type === 'resistor') {
      const zigCount = 5
      const points = [bodyStartX, bodyStartY]
      for (let i = 1; i < zigCount; i++) {
        const t = i / zigCount
        const zx = bodyStartX + (bodyEndX - bodyStartX) * t + px * (i % 2 === 0 ? -6 : 6)
        const zy = bodyStartY + (bodyEndY - bodyStartY) * t + py * (i % 2 === 0 ? -6 : 6)
        points.push(zx, zy)
      }
      points.push(bodyEndX, bodyEndY)
      return (
        <>
          {commonLeads}
          <Line points={points} stroke={color} strokeWidth={strokeW} lineJoin="round" />
        </>
      )
    }
    if (comp.type === 'diode') {
  // same triangle shape as LED, just no glow/fill difference needed
  const triBackX = midX - ux * 6, triBackY = midY - uy * 6;
  const triFrontX = midX + ux * 6, triFrontY = midY + uy * 6;
  const p1 = [triBackX + px * 7, triBackY + py * 7];
  const p2 = [triBackX - px * 7, triBackY - py * 7];
  return (
    <>
      {commonLeads}
      <Line points={[p1[0], p1[1], p2[0], p2[1], triFrontX, triFrontY, p1[0], p1[1]]} closed fill={color} stroke={color} strokeWidth={strokeW} />
      <Line points={[triFrontX + px * 7, triFrontY + py * 7, triFrontX - px * 7, triFrontY - py * 7]} stroke={color} strokeWidth={strokeW} />
    </>
  );
}

if (comp.type === 'inductor') {
  // simple coil: a few small arcs along the body
  return (
    <>
      {commonLeads}
      <Line points={[bodyStartX, bodyStartY, midX, midY - px * 8 - py * 8, bodyEndX, bodyEndY]} stroke={color} strokeWidth={strokeW} tension={0.8} />
    </>
  );
}

if (comp.type === 'transistor') {
  // simplified: circle body with a straight collector-emitter line through it
  return (
    <>
      {commonLeads}
      <Circle x={midX} y={midY} radius={9} stroke={color} strokeWidth={strokeW} />
      <Line points={[bodyStartX, bodyStartY, bodyEndX, bodyEndY]} stroke={color} strokeWidth={strokeW} />
    </>
  );
}

    if (comp.type === 'led') {
      const triBackX = midX - ux * 6, triBackY = midY - uy * 6
      const triFrontX = midX + ux * 6, triFrontY = midY + uy * 6
      const p1 = [triBackX + px * 7, triBackY + py * 7]
      const p2 = [triBackX - px * 7, triBackY - py * 7]
      return (
        <>
          {commonLeads}
          <Line points={[p1[0], p1[1], p2[0], p2[1], triFrontX, triFrontY, p1[0], p1[1]]} closed fill={color} stroke={color} strokeWidth={strokeW} />
          <Line points={[triFrontX + px * 7, triFrontY + py * 7, triFrontX - px * 7, triFrontY - py * 7]} stroke={color} strokeWidth={strokeW} />
        </>
      )
    }

    if (comp.type === 'battery') {
      const longX = midX - ux * 4, longY = midY - uy * 4
      const shortX = midX + ux * 4, shortY = midY + uy * 4
      return (
        <>
          {commonLeads}
          <Line points={[longX + px * 9, longY + py * 9, longX - px * 9, longY - py * 9]} stroke={color} strokeWidth={strokeW + 1} />
          <Line points={[shortX + px * 5, shortY + py * 5, shortX - px * 5, shortY - py * 5]} stroke={color} strokeWidth={strokeW + 2} />
        </>
      )
    }

    if (comp.type === 'capacitor') {
      const g1X = midX - ux * 4, g1Y = midY - uy * 4
      const g2X = midX + ux * 4, g2Y = midY + uy * 4
      return (
        <>
          {commonLeads}
          <Line points={[g1X + px * 8, g1Y + py * 8, g1X - px * 8, g1Y - py * 8]} stroke={color} strokeWidth={strokeW + 1} />
          <Line points={[g2X + px * 8, g2Y + py * 8, g2X - px * 8, g2Y - py * 8]} stroke={color} strokeWidth={strokeW + 1} />
        </>
      )
    }

    if (comp.type === 'switch') {
      return (
        <>
          {commonLeads}
          <Circle x={bodyStartX} y={bodyStartY} radius={2.5} fill={color} />
          <Circle x={bodyEndX} y={bodyEndY} radius={2.5} fill={color} />
          <Line points={[bodyStartX, bodyStartY, bodyEndX - px * 8, bodyEndY - py * 8]} stroke={color} strokeWidth={strokeW} />
        </>
      )
    }
    

    return null
  }

  const hasError = checkResult?.error || checkResult?.correct === false

  return (
    <div className="wy-root" style={{ '--mx': `${mousePos.x}px`, '--my': `${mousePos.y}px` }}>
      <style>{css}</style>

      <div className="wy-spotlight" aria-hidden="true" />
      <div className="wy-cursor-orb" aria-hidden="true" />

      <div className="wy-shell">
        <header className="wy-header wy-glass">
          <div className="wy-brand">
            <span className="wy-logo" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <path d="M2 13 H7 L10 5 L16 21 L19 13 H24" stroke={theme.roseBright} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <h1 className="wy-title">WYRDLY</h1>
              <p className="wy-subtitle">breadboard diagnostics console</p>
            </div>
          </div>

          <div className="wy-header-right">
            <div className="wy-menu-wrap">
              <button className="wy-btn wy-btn-ghost wy-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
                ☰
              </button>
              {menuOpen && (
                <div className="wy-menu-dropdown wy-glass">
                  <label className="wy-menu-item">
                    📷 Import Schematic
                    <input type="file" accept="image/*" onChange={handleSchematicUpload} style={{ display: 'none' }} />
                  </label>
                  <button className="wy-menu-item" onClick={handleExportCircuit} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none' }}>
                    💾 Export Circuit
                  </button>
                  <button className="wy-menu-item" onClick={handleExportPNG} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none' }}>
                     Export as PNG
                  </button>
                </div>
              )}
            </div>
            <label className="wy-field">
              <span className="wy-field-label">REFERENCE</span>
              <select className="wy-select" value={referenceCircuit} onChange={(e) => setReferenceCircuit(e.target.value)}>
                {REFERENCES.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
                {targetCircuit && <option value="_imported">📷 {targetCircuit.circuit_name}</option>}
              </select>
            </label>
            <button className="wy-btn wy-btn-primary" onClick={checkCircuit}>
              <span className="wy-play">▶</span> CHECK CIRCUIT
            </button>
          </div>
        </header>

        <div className="wy-body">
          <aside className="wy-rail wy-glass">
            <div className="wy-rail-heading">
              <span>INSTRUMENTS</span>
              <span className="wy-rail-index">06</span>
            </div>
            <div className="wy-tools">
              {TOOLS.map((t) => {
                const active = selectedTool === t.id
                const swatch = t.id === 'wire' ? theme.rose : colorMap[t.id]
                return (
                  <button key={t.id} className={`wy-tool${active ? ' active' : ''}`} onClick={() => setSelectedTool(t.id)}>
                    <span className="wy-tool-glyph" style={{ borderColor: active ? swatch : theme.hair }}>
                      <ToolGlyph id={t.id} color={active ? swatch : theme.silkDim} />
                    </span>
                    <span className="wy-tool-text">
                      <span className="wy-tool-label">{t.label}</span>
                      <span className="wy-tool-sub">{t.sub}</span>
                    </span>
                    {active && <span className="wy-tool-mark" style={{ background: swatch }} />}
                  </button>
                )
              })}
            </div>

            <div className="wy-rail-actions">
              <button className="wy-btn wy-btn-ghost" onClick={() => setWires([])}>Clear wires</button>
              <button className="wy-btn wy-btn-ghost" onClick={() => setComponents([])}>Clear components</button>
            </div>
          </aside>

          <main className="wy-main">
            <div className="wy-screen wy-glass">
              <div className="wy-screen-bar">
                <span className="wy-screen-tag">CH.1 · BREADBOARD</span>
                <span className="wy-screen-mode">MODE <b style={{ color: theme.roseBright }}>{selectedTool.toUpperCase()}</b></span>
                <span className="wy-screen-coord">x{Math.round(mousePos.x)} · y{Math.round(mousePos.y)}</span>
              </div>
              <div className="wy-screen-frame">
                <span className="wy-corner tl" />
                <span className="wy-corner tr" />
                <span className="wy-corner bl" />
                <span className="wy-corner br" />
                <div className="wy-stage-scroll" ref={stageWrapperRef}>
                  <Stage
                    width={BASE_STAGE_WIDTH * stageScale}
                    height={BASE_STAGE_HEIGHT * stageScale}
                    scaleX={stageScale}
                    scaleY={stageScale}
                    ref={stageRef}
                  >
                    <Layer>
                      <Rect x={20} y={10} width={660} height={390} fill={theme.board} cornerRadius={6} />
                      {holes.map((hole) => (
                        <Circle key={hole.key} x={hole.x} y={hole.y} radius={holeRadius} fill={getHoleColor(hole)} onClick={() => handleHoleClick(hole)} onTap={() => handleHoleClick(hole)} />
                      ))}
                      {wires.map((wire, i) => (
                        <Line
                          key={`wire-${i}`}
                          points={[wire.from.x, wire.from.y, wire.to.x, wire.to.y]}
                          stroke={selectedWireIndex === i ? theme.roseBright : theme.rose}
                          strokeWidth={selectedWireIndex === i ? 4 : 3}
                          hitStrokeWidth={20}
                          onClick={() => handleWireClick(i)}
                          onTap={() => handleWireClick(i)}
                        />
                      ))}
                      {components.map((comp) => {
                        const isSelected = selectedComponentId === comp.id
                        const midX = (comp.from.x + comp.to.x) / 2
                        const midY = (comp.from.y + comp.to.y) / 2
                        return (
                          <React.Fragment key={comp.id}>
                            <Line
                              points={[comp.from.x, comp.from.y, comp.to.x, comp.to.y]}
                              stroke="transparent"
                              strokeWidth={1}
                              hitStrokeWidth={22}
                              onClick={() => handleComponentClick(comp.id)}
                              onTap={() => handleComponentClick(comp.id)}
                            />
                            {renderComponentSymbol(comp, isSelected)}
                            <Text x={midX - 15} y={midY - 22} text={comp.id} fontSize={9} fontFamily="JetBrains Mono" fill={theme.silkDim} />
                          </React.Fragment>
                        )
                      })}
                    </Layer>
                  </Stage>
                </div>
              </div>
              <p className="wy-hint">click a wire or part to select · press DELETE to remove</p>
            </div>

            <section className="wy-console wy-glass">
              <div className="wy-console-head">
                <span>DIAGNOSTIC READOUT</span>
                <span className="wy-console-blink">_</span>
              </div>
              <div className="wy-readout">
                <div className="wy-readline">
                  <span className="wy-readkey">selected_hole</span>
                  <span className="wy-readval accent">{selectedHole ? selectedHole.key : 'none'}</span>
                </div>
                <div className="wy-readline">
                  <span className="wy-readkey">wires ({wires.length})</span>
                  <span className="wy-readval">{wires.map((w) => `${w.from.key}↔${w.to.key}`).join('  ·  ') || 'none'}</span>
                </div>
                <div className="wy-readline">
                  <span className="wy-readkey">components ({components.length})</span>
                  <span className="wy-readval">{components.map((c) => `${c.id}(${c.from.key}→${c.to.key})`).join('  ·  ') || 'none'}</span>
                </div>
              </div>
              {targetCircuit && (
  <div className="wy-result ok" style={{ marginBottom: '14px' }}>
    <p className="wy-result-line ok" style={{ marginBottom: '10px' }}>
      📷 IMPORTED: {targetCircuit.circuit_name}
    </p>
    <div className="wy-faults">
      {targetCircuit.components.map((c, i) => (
        <div key={i} className="wy-fault" style={{ borderLeftColor: theme.roseBright }}>
          <span className="wy-fault-type">{c.name}</span> — {c.type}
          {c.resistance_ohms && ` (${c.resistance_ohms}Ω)`}
        </div>
      ))}
    </div>
    <p className="wy-hint" style={{ marginTop: '10px' }}>
      Build this circuit on the board, then check it below using "Custom Import" as the reference.
    </p>
  </div>
)}

              {checkResult && (
                <div className={`wy-result ${hasError ? 'err' : 'ok'}`}>
                  {checkResult.error && <p className="wy-result-line err">{checkResult.error}</p>}
                  {checkResult.correct === true && <p className="wy-result-line ok">✓ Circuit kinda ate ngl🤏</p>}
                  {checkResult.correct === false && (
                    <div>
                      <p className="wy-result-line err">✕ Minor oopsies detected chief🫤</p>
                      <div className="wy-faults">
                        {checkResult.faults.map((f, i) => (
                          <div key={i} className="wy-fault">
                            <span className="wy-fault-type">[{f.type}]</span> {f.detail}
                          </div>
                        ))}
                      </div>
                      <button
                        className="wy-btn wy-btn-ghost wy-explain-btn"
                        onClick={explainFaults}
                        disabled={loadingExplanation}
                      >
                        {loadingExplanation ? 'THINKING...' : '💬 EXPLAIN IN DETAIL'}
                      </button>
                    </div>
                  )}
                  {explanation && (
                    <div className="wy-explanation">
                      <span className="wy-explanation-label">AI TUTOR</span>
                      <p className="wy-explanation-text">{explanation}</p>
                    </div>
                  )}
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}

const css = `
html, body, #root {
  margin: 0; padding: 0; width: 100%; min-height: 100vh;
  max-width: none; display: block; text-align: initial;
}
* { box-sizing: border-box; }
.wy-root {
  position: relative; width: 100%; min-height: 100vh; color: ${theme.silk};
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
  padding: 28px; overflow-x: hidden;
  background:
    radial-gradient(1100px circle at 12% -10%, rgba(128,170,211,0.20), transparent 55%),
    radial-gradient(1000px circle at 105% 115%, rgba(63,101,147,0.22), transparent 55%),
    linear-gradient(155deg, #000f22 0%, #0a1e3d 45%, #001428 100%);
}
.wy-spotlight {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background: radial-gradient(560px circle at var(--mx, 50%) var(--my, 50%),
    rgba(192,230,253,0.22), rgba(128,170,211,0.08) 32%, transparent 60%);
  transition: background 0.08s linear;
}
.wy-cursor-orb {
  position: fixed; top: var(--my, 50%); left: var(--mx, 50%);
  width: 26px; height: 26px; margin: -13px 0 0 -13px; border-radius: 50%;
  z-index: 1; pointer-events: none;
  background: radial-gradient(circle, rgba(220,242,255,0.95), rgba(128,170,211,0.5) 45%, transparent 70%);
  box-shadow: 0 0 34px 10px rgba(128,170,211,0.4);
  transition: top 0.05s linear, left 0.05s linear;
}
.wy-shell { position: relative; z-index: 2; width: 100%; max-width: 1600px; margin: 0 auto; }
.wy-glass {
  background: linear-gradient(150deg, rgba(255,255,255,0.09), rgba(255,255,255,0.02));
  backdrop-filter: blur(22px) saturate(150%); -webkit-backdrop-filter: blur(22px) saturate(150%);
  border: 1px solid rgba(255,255,255,0.12); border-radius: w20px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.25);
}
.wy-header { display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; padding: 16px 22px; margin-bottom: 20px; position: relative; z-index: 10; }
.wy-menu-wrap { position: relative; z-index: 50; }
.wy-menu-btn { padding: 10px 13px; font-size: 16px; }
.wy-menu-dropdown { position: absolute; top: calc(100% + 8px); right: 0; min-width: 190px; padding: 8px; z-index: 50; }
.wy-menu-item { display: block; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: ${theme.silk}; padding: 9px 10px; border-radius: 8px; cursor: pointer; transition: background 0.15s ease; }
.wy-menu-item:hover { background: rgba(255,255,255,0.08); }
.wy-brand { display: flex; align-items: center; gap: 14px; }
.wy-logo { display: grid; place-items: center; width: 46px; height: 46px; border: 1px solid rgba(255,255,255,0.18); border-radius: 14px; background: linear-gradient(150deg, rgba(255,255,255,0.14), rgba(255,255,255,0.03)); box-shadow: 0 0 26px rgba(128,170,211,0.35) inset, inset 0 1px 0 rgba(255,255,255,0.3); }
.wy-title { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 26px; font-weight: 700; letter-spacing: 4px; margin: 0; color: ${theme.silk}; text-shadow: 0 0 26px rgba(192,230,253,0.55); }
.wy-subtitle { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 11px; color: ${theme.silkDim}; margin: 2px 0 0; letter-spacing: 1px; }
.wy-header-right { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.wy-status { display: inline-flex; align-items: center; gap: 7px; font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 1.5px; color: ${theme.silk}; padding: 8px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.06); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
.wy-dot { width: 7px; height: 7px; border-radius: 50%; background: ${theme.success}; box-shadow: 0 0 10px ${theme.success}; animation: wy-pulse 1.8s ease-in-out infinite; }
@keyframes wy-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
.wy-field { display: flex; flex-direction: column; gap: 4px; }
.wy-field-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 1.5px; color: ${theme.silkDim}; }
.wy-select { font-family: 'JetBrains Mono', monospace; font-size: 12px; background: rgba(255,255,255,0.07); color: ${theme.silk}; border: 1px solid rgba(255,255,255,0.16); border-radius: 10px; padding: 8px 11px; cursor: pointer; outline: none; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
.wy-select option { background: ${theme.panel}; color: ${theme.silk}; }
.wy-select:focus { border-color: ${theme.roseBright}; }
.wy-btn { font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; letter-spacing: 0.5px; border-radius: 12px; cursor: pointer; padding: 10px 15px; transition: all 0.16s ease; border: 1px solid rgba(255,255,255,0.16); background: rgba(255,255,255,0.06); color: ${theme.silk}; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
.wy-btn-ghost { width: 100%; text-align: left; margin-top: 8px; }
.wy-btn-ghost:hover { border-color: rgba(128,170,211,0.6); color: ${theme.roseBright}; background: rgba(128,170,211,0.12); }
.wy-btn-primary { background: linear-gradient(180deg, rgba(192,230,253,0.98), rgba(91,134,182,0.95)); color: #001428; border-color: rgba(192,230,253,0.7); font-weight: 700; box-shadow: 0 6px 26px rgba(91,134,182,0.5), inset 0 1px 0 rgba(255,255,255,0.55); }
.wy-btn-primary:hover { filter: brightness(1.08); transform: translateY(-1px); }
.wy-play { font-size: 10px; }
.wy-body { display: grid; grid-template-columns: 250px 1fr; gap: 20px; align-items: start; }
.wy-rail { padding: 18px; position: sticky; top: 20px; }
.wy-rail-heading { display: flex; justify-content: space-between; align-items: center; font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 2px; color: ${theme.silkDim}; margin-bottom: 14px; }
.wy-rail-index { color: ${theme.roseBright}; }
.wy-tools { display: flex; flex-direction: column; gap: 8px; }
.wy-tool { position: relative; display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: 14px; cursor: pointer; text-align: left; overflow: hidden; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); transition: all 0.16s ease; }
.wy-tool:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.14); transform: translateY(-1px); }
.wy-tool.active { background: linear-gradient(150deg, rgba(255,255,255,0.14), rgba(255,255,255,0.03)); border-color: rgba(255,255,255,0.22); box-shadow: inset 0 1px 0 rgba(255,255,255,0.28), 0 4px 18px rgba(0,0,0,0.35); }
.wy-tool-glyph { display: grid; place-items: center; width: 44px; height: 30px; border: 1px solid rgba(255,255,255,0.14); border-radius: 10px; background: rgba(0,0,0,0.25); transition: border-color 0.16s ease; flex-shrink: 0; }
.wy-tool-text { display: flex; flex-direction: column; }
.wy-tool-label { font-size: 13px; font-weight: 600; color: ${theme.silk}; }
.wy-tool-sub { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.5px; color: ${theme.silkDim}; }
.wy-tool-mark { position: absolute; left: 0; top: 8px; bottom: 8px; width: 3px; border-radius: 0 3px 3px 0; box-shadow: 0 0 12px currentColor; }
.wy-rail-actions { margin-top: 16px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.1); }
.wy-main { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
.wy-screen { padding: 16px; }
.wy-screen-bar { display: flex; justify-content: space-between; align-items: center; gap: 10px; font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 1px; color: ${theme.silkDim}; padding: 0 4px 12px; flex-wrap: wrap; }
.wy-screen-frame { position: relative; border: 1px solid rgba(255,255,255,0.12); border-radius: 14px; padding: 10px; background: rgba(10,4,8,0.55); overflow: hidden; box-shadow: inset 0 2px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08); }
.wy-stage-scroll { display: flex; justify-content: center; align-items: center; width: 100%; border-radius: 8px; }
.wy-corner { position: absolute; width: 12px; height: 12px; border: 1.5px solid rgba(192,230,253,0.8); opacity: 0.8; }
.wy-corner.tl { top: 6px; left: 6px; border-right: none; border-bottom: none; }
.wy-corner.tr { top: 6px; right: 6px; border-left: none; border-bottom: none; }
.wy-corner.bl { bottom: 6px; left: 6px; border-right: none; border-top: none; }
.wy-corner.br { bottom: 6px; right: 6px; border-left: none; border-top: none; }
.wy-hint { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: ${theme.silkDim}; letter-spacing: 0.5px; margin: 12px 4px 2px; }
.wy-console { padding: 18px 20px; }
.wy-console-head { display: flex; align-items: center; gap: 6px; font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 2px; color: ${theme.silkDim}; margin-bottom: 12px; }
.wy-console-blink { color: ${theme.roseBright}; animation: wy-blink 1s steps(2) infinite; }
@keyframes wy-blink { 0%,50% { opacity: 1; } 51%,100% { opacity: 0; } }
.wy-readout { display: flex; flex-direction: column; gap: 8px; font-family: 'JetBrains Mono', monospace; font-size: 12px; }
.wy-readline { display: grid; grid-template-columns: 140px 1fr; gap: 12px; align-items: baseline; }
.wy-readkey { color: ${theme.silkDim}; }
.wy-readkey::before { content: '› '; color: ${theme.roseBright}; }
.wy-readval { color: ${theme.silk}; word-break: break-word; line-height: 1.6; }
.wy-readval.accent { color: ${theme.roseBright}; }
.wy-result { margin-top: 14px; padding: 14px 16px; border-radius: 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-left: 3px solid ${theme.silkDim}; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
.wy-result.ok { border-left-color: ${theme.success}; }
.wy-result.err { border-left-color: ${theme.error}; }
.wy-result-line { font-family: 'JetBrains Mono', monospace; font-size: 13px; margin: 0 0 8px; font-weight: 700; }
.wy-result-line:last-child { margin-bottom: 0; }
.wy-result-line.ok { color: ${theme.success}; margin-bottom: 0; }
.wy-result-line.err { color: ${theme.error}; }
.wy-faults { display: flex; flex-direction: column; gap: 8px; }
.wy-fault { border-left: 3px solid ${theme.error}; padding-left: 10px; color: ${theme.silk}; font-size: 12px; line-height: 1.5; }
.wy-fault-type { color: ${theme.error}; font-family: 'JetBrains Mono', monospace; }
.wy-explain-btn { margin-top: 12px; width: 100%; text-align: center; }
.wy-explain-btn:disabled { opacity: 0.6; cursor: wait; }
.wy-explanation { margin-top: 14px; padding: 14px 16px; border-radius: 14px; background: rgba(128,170,211,0.08); border: 1px solid rgba(128,170,211,0.25); border-left: 3px solid ${theme.roseBright}; }
.wy-explanation-label { display: block; font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 2px; color: ${theme.roseBright}; margin-bottom: 8px; }
.wy-explanation-text { margin: 0; font-size: 13px; line-height: 1.65; color: ${theme.silk}; white-space: pre-wrap; }
@media (max-width: 880px) {
  .wy-root { padding: 18px; }
  .wy-body { grid-template-columns: 1fr; }
  .wy-rail { position: static; }
  .wy-tools { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .wy-readline { grid-template-columns: 1fr; gap: 2px; }
  .wy-cursor-orb { display: none; }
}
@media (max-width: 600px) {
  .wy-root { padding: 12px; }
  .wy-header { padding: 14px 16px; flex-direction: column; align-items: stretch; }
  .wy-header-right { width: 100%; flex-direction: column; align-items: stretch; }
  .wy-field { width: 100%; }
  .wy-select { width: 100%; }
  .wy-btn-primary { width: 100%; justify-content: center; }
  .wy-title { font-size: 20px; letter-spacing: 2px; }
  .wy-logo { width: 38px; height: 38px; }
  .wy-body { gap: 14px; }
  .wy-rail, .wy-screen, .wy-console { padding: 14px; }
  .wy-tools { grid-template-columns: 1fr; }
  .wy-header-right { justify-content: center; }
  .wy-menu-wrap { align-self: center; }
}
`