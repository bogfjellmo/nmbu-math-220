
import React, { useState, useMemo } from 'react';
import { Matrix2x2, Trajectory, Point } from './types';
import { solveODE, analyzeMatrix } from './services/odeSolver';
import PhasePortrait from './components/PhasePortrait';

const App: React.FC = () => {
  // Use strings for the input fields to allow natural typing (e.g., '-', '0.', '')
  const [matrixInputs, setMatrixInputs] = useState({
    a: '1',
    b: '-2',
    c: '3',
    d: '-4'
  });

  const [trajectories, setTrajectories] = useState<Trajectory[]>([]);

  // Derive the actual numeric matrix, defaulting to 0 for invalid inputs
  const matrix: Matrix2x2 = useMemo(() => ({
    a: parseFloat(matrixInputs.a) || 0,
    b: parseFloat(matrixInputs.b) || 0,
    c: parseFloat(matrixInputs.c) || 0,
    d: parseFloat(matrixInputs.d) || 0,
  }), [matrixInputs]);

  const analysis = useMemo(() => analyzeMatrix(matrix), [matrix]);

  const handleInputChange = (key: keyof typeof matrixInputs, val: string) => {
    setMatrixInputs(prev => ({ ...prev, [key]: val }));
    // We clear trajectories if the value is actually a new valid number to prevent stale plots
    if (!isNaN(parseFloat(val))) {
      setTrajectories([]);
    }
  };

  const handleAddTrajectory = (initial: Point) => {
    const forward = solveODE(matrix, initial, 300, 0.03, true);
    const backward = solveODE(matrix, initial, 300, 0.03, false);
    const fullPoints = [...[...backward].reverse(), ...forward.slice(1)];
    const newTraj: Trajectory = {
      id: Math.random().toString(36).substr(2, 9),
      points: fullPoints,
      initial,
      color: `hsl(${Math.random() * 360}, 65%, 45%)`
    };
    setTrajectories(prev => [...prev.slice(-9), newTraj]);
  };

  const applyPreset = (m: { a: number, b: number, c: number, d: number }) => {
    setMatrixInputs({
      a: m.a.toString(),
      b: m.b.toString(),
      c: m.c.toString(),
      d: m.d.toString()
    });
    setTrajectories([]);
  };

  const clearTrajectories = () => setTrajectories([]);

  // Helper to format equation terms
  const formatTerm = (coeff: string, variable: string, isFirst: boolean = false) => {
    const val = parseFloat(coeff);
    if (val === 0) return "";
    let sign = val > 0 ? (isFirst ? "" : " + ") : (isFirst ? "-" : " - ");
    let absoluteVal = Math.abs(val);
    let displayCoeff = absoluteVal === 1 ? "" : absoluteVal.toString();
    return `${sign}${displayCoeff}${variable}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <header className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">PhaseFlow</h1>
          <p className="text-slate-500 font-medium tracking-tight uppercase text-[10px]">Linear System Visualization Tool</p>
        </div>
        <div className="flex flex-wrap gap-2">
           {[
             { name: 'Saddle', m: { a: 1, b: 0, c: 0, d: -1 } },
             { name: 'Spiral Sink', m: { a: -1, b: -2, c: 2, d: -1 } },
             { name: 'Stable Node', m: { a: -2, b: 0, c: 0, d: -1 } },
             { name: 'Center', m: { a: 0, b: -2, c: 2, d: 0 } }
           ].map(p => (
             <button
               key={p.name}
               onClick={() => applyPreset(p.m)}
               className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-bold hover:bg-slate-50 hover:border-blue-300 transition-all shadow-sm text-slate-600"
             >
               {p.name}
             </button>
           ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-sm font-black mb-4 flex items-center gap-2 text-slate-400 uppercase tracking-widest">
              <i className="fa-solid fa-keyboard text-blue-500"></i> Manual Input
            </h2>
            
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-6 relative">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 rounded-l-xl"></div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 font-mono">
                {(['a', 'b', 'c', 'd'] as const).map((k) => (
                  <div key={k} className="relative group">
                    <span className="absolute -left-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-300 font-bold uppercase">{k}</span>
                    <input
                      type="text"
                      value={matrixInputs[k]}
                      onChange={(e) => handleInputChange(k, e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-sm font-bold text-slate-800 shadow-inner"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1 mb-6">
               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">System Equations</div>
               <div className="p-3 bg-slate-900 rounded-lg text-blue-400 font-mono text-xs space-y-1 shadow-lg">
                 <div>x' = {formatTerm(matrixInputs.a, 'x', true)} {formatTerm(matrixInputs.b, 'y') || (parseFloat(matrixInputs.a) === 0 ? "0" : "")}</div>
                 <div>y' = {formatTerm(matrixInputs.c, 'x', true)} {formatTerm(matrixInputs.d, 'y') || (parseFloat(matrixInputs.c) === 0 ? "0" : "")}</div>
               </div>
            </div>

            <button 
              onClick={clearTrajectories}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all uppercase tracking-widest shadow-md active:scale-95"
            >
              <i className="fa-solid fa-rotate-left mr-2"></i> Reset Plot
            </button>
          </section>

          <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <h2 className="text-sm font-black mb-4 flex items-center gap-2 text-slate-400 uppercase tracking-widest">
              <i className="fa-solid fa-square-root-variable text-purple-500"></i> Eigen-Analysis
            </h2>
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">State</div>
                <div className="font-bold text-slate-900 text-sm mb-1">{analysis.classification}</div>
                <div className={`font-semibold ${analysis.stability.includes('Unstable') ? 'text-rose-500' : 'text-emerald-600'}`}>
                  {analysis.stability}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] uppercase font-bold text-slate-400">Values & Vectors</div>
                {analysis.eigenvalues.map((ev, i) => (
                  <div key={i} className="flex flex-col gap-1 p-2 rounded border border-slate-50 bg-white shadow-sm">
                    <div className="flex justify-between items-center">
                       <span className="font-mono text-blue-600 font-bold">λ{i+1}: {ev.re.toFixed(2)}{ev.im !== 0 ? ` ± ${Math.abs(ev.im).toFixed(2)}i` : ''}</span>
                    </div>
                    {analysis.eigenvectors && analysis.eigenvectors[i] && (
                      <div className="text-slate-500 font-mono text-[10px] flex items-center gap-1">
                        <i className="fa-solid fa-arrow-right text-[8px]"></i>
                        v{i+1}: [{analysis.eigenvectors[i].x.re.toFixed(2)}, {analysis.eigenvectors[i].y.re.toFixed(2)}]
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <PhasePortrait 
            matrix={matrix} 
            trajectories={trajectories} 
            analysis={analysis}
            onAddTrajectory={handleAddTrajectory} 
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-500 shrink-0">
                <i className="fa-solid fa-arrow-pointer"></i>
              </div>
              <div>
                <p className="font-bold text-slate-800 text-xs mb-1">Interactive Tracing</p>
                <p className="text-slate-500 text-[11px] leading-snug">
                  <b>Click anywhere</b> on the phase portrait to set an initial condition and trace its trajectory.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-500 shrink-0">
                <i className="fa-solid fa-compass-drafting"></i>
              </div>
              <div>
                <p className="font-bold text-slate-800 text-xs mb-1">Eigenvalues (λ)</p>
                <p className="text-slate-500 text-[11px] leading-snug">
                  Real parts determine growth or decay. Imaginary parts cause rotation.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200">
              <div className="p-2 bg-purple-50 rounded-lg text-purple-500 shrink-0">
                <i className="fa-solid fa-lines-leaning"></i>
              </div>
              <div>
                <p className="font-bold text-slate-800 text-xs mb-1">Eigenvectors (v)</p>
                <p className="text-slate-500 text-[11px] leading-snug">
                  These define <b>invariant lines</b>: directions where the flow is purely radial.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;