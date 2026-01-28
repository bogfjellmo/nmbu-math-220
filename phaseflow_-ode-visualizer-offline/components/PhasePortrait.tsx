
import React, { useMemo } from 'react';
import * as d3 from 'd3';
import { Matrix2x2, Point, Trajectory, EquilibriumAnalysis } from '../types';

interface PhasePortraitProps {
  matrix: Matrix2x2;
  trajectories: Trajectory[];
  analysis: EquilibriumAnalysis;
  onAddTrajectory: (point: Point) => void;
}

const PhasePortrait: React.FC<PhasePortraitProps> = ({ matrix, trajectories, analysis, onAddTrajectory }) => {
  const width = 600;
  const height = 600;
  const margin = 40;
  const range = 5;

  const xScale = useMemo(() => d3.scaleLinear().domain([-range, range]).range([margin, width - margin]), [range]);
  const yScale = useMemo(() => d3.scaleLinear().domain([-range, range]).range([height - margin, margin]), [range]);

  const gridPoints = useMemo(() => {
    const points: { x: number; y: number; dx: number; dy: number; angle: number; length: number }[] = [];
    const steps = 15;
    const stepSize = (2 * range) / steps;
    
    for (let i = 0; i <= steps; i++) {
      for (let j = 0; j <= steps; j++) {
        const x = -range + i * stepSize;
        const y = -range + j * stepSize;
        const dx = matrix.a * x + matrix.b * y;
        const dy = matrix.c * x + matrix.d * y;
        const mag = Math.sqrt(dx * dx + dy * dy);
        points.push({
          x, y,
          dx: mag === 0 ? 0 : dx / mag,
          dy: mag === 0 ? 0 : dy / mag,
          angle: Math.atan2(dy, dx),
          length: mag
        });
      }
    }
    return points;
  }, [matrix, range]);

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = xScale.invert(e.clientX - rect.left);
    const y = yScale.invert(e.clientY - rect.top);
    onAddTrajectory({ x, y });
  };

  const lineGenerator = d3.line<Point>().x(d => xScale(d.x)).y(d => yScale(d.y)).curve(d3.curveBasis);

  // Helper to get arrowheads along a trajectory
  const getArrowHeads = (traj: Trajectory) => {
    const heads: { x: number, y: number, angle: number }[] = [];
    const pts = traj.points;
    if (pts.length < 10) return heads;

    // We place arrows at roughly 25%, 50%, and 75% of the total path
    const indices = [
      Math.floor(pts.length * 0.25),
      Math.floor(pts.length * 0.5),
      Math.floor(pts.length * 0.75)
    ];

    indices.forEach(idx => {
      const p1 = pts[idx];
      const p2 = pts[Math.min(idx + 5, pts.length - 1)];
      if (!p1 || !p2) return;

      const screenX1 = xScale(p1.x);
      const screenY1 = yScale(p1.y);
      const screenX2 = xScale(p2.x);
      const screenY2 = yScale(p2.y);

      const angle = Math.atan2(screenY2 - screenY1, screenX2 - screenX1);
      heads.push({ x: screenX1, y: screenY1, angle });
    });

    return heads;
  };

  return (
    <div className="relative bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden select-none">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        onClick={handleSvgClick}
        className="cursor-crosshair block mx-auto"
      >
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1" />
            <feOffset dx="0" dy="1" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g className="grid-lines opacity-10">
          {xScale.ticks(10).map(t => <line key={`v-${t}`} x1={xScale(t)} y1={margin} x2={xScale(t)} y2={height - margin} stroke="black" />)}
          {yScale.ticks(10).map(t => <line key={`h-${t}`} x1={margin} y1={yScale(t)} x2={width - margin} y2={yScale(t)} stroke="black" />)}
        </g>

        <line x1={margin} y1={yScale(0)} x2={width - margin} y2={yScale(0)} stroke="#94a3b8" strokeWidth="1" />
        <line x1={xScale(0)} y1={margin} x2={xScale(0)} y2={height - margin} stroke="#94a3b8" strokeWidth="1" />

        {/* Eigenvectors (Invariant Lines) */}
        {analysis.eigenvectors && analysis.eigenvectors.map((vec, i) => {
          const xDir = vec.x.re;
          const yDir = vec.y.re;
          if (Math.abs(xDir) < 1e-9 && Math.abs(yDir) < 1e-9) return null;
          
          const x1 = -range * 2 * xDir;
          const y1 = -range * 2 * yDir;
          const x2 = range * 2 * xDir;
          const y2 = range * 2 * yDir;

          return (
            <line
              key={`eig-${i}`}
              x1={xScale(x1)} y1={yScale(y1)} x2={xScale(x2)} y2={yScale(y2)}
              stroke={i === 0 ? '#fbbf24' : '#a855f7'}
              strokeWidth="1.5"
              strokeDasharray="5,5"
              opacity="0.3"
            />
          );
        })}

        <g className="direction-field">
          {gridPoints.map((p, i) => {
            const arrowSize = 10;
            const x1 = xScale(p.x);
            const y1 = yScale(p.y);
            const x2 = x1 + p.dx * arrowSize;
            const y2 = y1 - p.dy * arrowSize;
            const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, 10]);
            return (
              <line key={`arrow-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={colorScale(p.length)} strokeWidth="1" opacity="0.4" />
            );
          })}
        </g>

        <g className="trajectories">
          {trajectories.map((traj) => (
            <g key={traj.id}>
              <path 
                d={lineGenerator(traj.points) || ''} 
                fill="none" 
                stroke={traj.color} 
                strokeWidth="2.5" 
                className="opacity-90"
              />
              {/* Directional Arrows along the path */}
              {getArrowHeads(traj).map((head, hi) => (
                <path
                  key={`${traj.id}-h-${hi}`}
                  d="M -5 -4 L 5 0 L -5 4 Z"
                  transform={`translate(${head.x}, ${head.y}) rotate(${(head.angle * 180) / Math.PI})`}
                  fill={traj.color}
                  stroke="white"
                  strokeWidth="0.5"
                />
              ))}
            </g>
          ))}
        </g>

        <g className="initial-points">
          {trajectories.map((traj) => (
            <circle 
              key={`init-${traj.id}`} 
              cx={xScale(traj.initial.x)} 
              cy={yScale(traj.initial.y)} 
              r="4" 
              fill={traj.color} 
              stroke="white" 
              strokeWidth="1.5"
              filter="url(#shadow)"
            />
          ))}
        </g>
      </svg>
      <div className="absolute bottom-4 left-4 flex gap-4">
        {analysis.eigenvectors && analysis.eigenvectors.map((_, i) => (
          <div key={i} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
             <div className="w-4 h-0.5 border-t border-dashed" style={{ borderColor: i === 0 ? '#fbbf24' : '#a855f7' }}></div>
             Eigenline {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhasePortrait;
