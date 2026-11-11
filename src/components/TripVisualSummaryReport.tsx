import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  AlertTriangle, 
  Zap, 
  Waves, 
  Clock, 
  Compass, 
  Navigation, 
  BarChart2, 
  Layers, 
  Gauge, 
  ShieldCheck,
  Calendar,
  Share2
} from 'lucide-react';
import { RouteTrack, TrackPoint } from '../types/marine';
import { GPXService } from '../services/gpxExporter';

interface TripVisualSummaryReportProps {
  route: RouteTrack;
  onBack: () => void;
  onExportGPX?: (route: RouteTrack) => void;
}

interface ProcessedTrackPoint extends TrackPoint {
  cumulativeDistNm: number;
  cumulativeDistKm: number;
}

export const TripVisualSummaryReport: React.FC<TripVisualSummaryReportProps> = ({
  route,
  onBack,
  onExportGPX,
}) => {
  const [activeTab, setActiveTab] = useState<'depth' | 'speed' | 'dual'>('dual');
  const [unitSystem, setUnitSystem] = useState<'nautical' | 'metric'>('nautical');
  const [copied, setCopied] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<ProcessedTrackPoint | null>(null);

  const depthChartRef = useRef<SVGSVGElement>(null);
  const speedChartRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate cumulative distance for each point along route
  const processedPoints: ProcessedTrackPoint[] = useMemo(() => {
    if (!route.points || route.points.length === 0) return [];

    const result: ProcessedTrackPoint[] = [];
    let accumulatedNm = 0;

    for (let i = 0; i < route.points.length; i++) {
      const pt = route.points[i];
      if (i > 0) {
        const prev = route.points[i - 1];
        const R = 3440.065; // Earth radius in NM
        const dLat = ((pt.lat - prev.lat) * Math.PI) / 180;
        const dLon = ((pt.lng - prev.lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((prev.lat * Math.PI) / 180) *
            Math.cos((pt.lat * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        accumulatedNm += R * c;
      }

      result.push({
        ...pt,
        cumulativeDistNm: accumulatedNm,
        cumulativeDistKm: accumulatedNm * 1.852,
      });
    }

    return result;
  }, [route.points]);

  // Overall Statistics Calculation
  const stats = useMemo(() => {
    if (processedPoints.length === 0) {
      return {
        totalDistNm: route.distanceNm || 0,
        totalDistKm: (route.distanceNm || 0) * 1.852,
        peakSpeedKnots: route.maxSpeedKnots || 0,
        avgSpeedKnots: route.avgSpeedKnots || 0,
        minDepthFt: route.minDepthFt || 0,
        maxDepthFt: 0,
        avgDepthFt: 0,
        shallowTimePercent: 0,
        durationSec: 0,
        peakSpeedPoint: null as ProcessedTrackPoint | null,
        minDepthPoint: null as ProcessedTrackPoint | null,
      };
    }

    const speeds = processedPoints.map(p => p.speedKnots);
    const depths = processedPoints.map(p => p.depthFt);

    let peakPt = processedPoints[0];
    let minDepthPt = processedPoints[0];

    for (const p of processedPoints) {
      if (p.speedKnots > peakPt.speedKnots) peakPt = p;
      if (p.depthFt < minDepthPt.depthFt) minDepthPt = p;
    }

    const totalDistNm = processedPoints[processedPoints.length - 1].cumulativeDistNm;
    const avgSpd = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    const avgDpt = depths.reduce((a, b) => a + b, 0) / depths.length;
    const maxDpt = Math.max(...depths, 10);
    const shallowCount = depths.filter(d => d < 6.0).length;
    const shallowTimePercent = Math.round((shallowCount / depths.length) * 100);

    const start = route.startTime;
    const end = route.endTime || (processedPoints[processedPoints.length - 1]?.time || start);
    const durationSec = Math.max(0, Math.floor((end - start) / 1000));

    return {
      totalDistNm,
      totalDistKm: totalDistNm * 1.852,
      peakSpeedKnots: peakPt.speedKnots,
      avgSpeedKnots: avgSpd,
      minDepthFt: minDepthPt.depthFt,
      maxDepthFt: maxDpt,
      avgDepthFt: avgDpt,
      shallowTimePercent,
      durationSec,
      peakSpeedPoint: peakPt,
      minDepthPoint: minDepthPt,
    };
  }, [processedPoints, route]);

  const isMetric = unitSystem === 'metric';

  const formatDistance = (nm: number) => {
    return isMetric ? `${(nm * 1.852).toFixed(2)} km` : `${nm.toFixed(2)} NM`;
  };

  const formatSpeed = (kts: number) => {
    return isMetric ? `${(kts * 1.852).toFixed(1)} km/h` : `${kts.toFixed(1)} kts`;
  };

  const formatDepth = (ft: number) => {
    return isMetric ? `${(ft * 0.3048).toFixed(1)} m` : `${ft.toFixed(1)} ft`;
  };

  const formatDuration = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (hrs > 0) return `${hrs}h ${mins.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
    return `${mins}m ${s.toString().padStart(2, '0')}s`;
  };

  // Render D3 Depth Chart
  useEffect(() => {
    if (!depthChartRef.current || processedPoints.length < 2) return;
    if (activeTab === 'speed') return;

    const svg = d3.select(depthChartRef.current);
    svg.selectAll('*').remove();

    const width = 760;
    const height = activeTab === 'dual' ? 220 : 320;
    const margin = { top: 25, right: 35, bottom: 35, left: 55 };

    const maxDist = isMetric ? stats.totalDistKm : stats.totalDistNm;
    const xScale = d3.scaleLinear()
      .domain([0, Math.max(0.1, maxDist)])
      .range([margin.left, width - margin.right]);

    // Water surface at top (0 depth), deepest point at bottom
    const maxDepth = isMetric ? stats.maxDepthFt * 0.3048 : stats.maxDepthFt;
    const yScale = d3.scaleLinear()
      .domain([0, Math.max(10, maxDepth * 1.15)])
      .range([margin.top, height - margin.bottom]);

    // Defs: Gradients and clipping
    const defs = svg.append('defs');

    // Water Bathymetry Gradient
    const bathymetryGrad = defs.append('linearGradient')
      .attr('id', 'bathymetry-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');

    bathymetryGrad.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#38bdf8')
      .attr('stop-opacity', 0.25);

    bathymetryGrad.append('stop')
      .attr('offset', '40%')
      .attr('stop-color', '#0284c7')
      .attr('stop-opacity', 0.65);

    bathymetryGrad.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#0f172a')
      .attr('stop-opacity', 0.95);

    // Grid lines
    svg.append('g')
      .attr('class', 'grid-x')
      .attr('stroke', '#1e293b')
      .attr('stroke-dasharray', '3,3')
      .selectAll('line')
      .data(xScale.ticks(8))
      .enter()
      .append('line')
      .attr('x1', d => xScale(d))
      .attr('x2', d => xScale(d))
      .attr('y1', margin.top)
      .attr('y2', height - margin.bottom);

    svg.append('g')
      .attr('class', 'grid-y')
      .attr('stroke', '#1e293b')
      .attr('stroke-dasharray', '3,3')
      .selectAll('line')
      .data(yScale.ticks(6))
      .enter()
      .append('line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d));

    // Water Surface Line (0 depth)
    svg.append('line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', yScale(0))
      .attr('y2', yScale(0))
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 2);

    svg.append('text')
      .attr('x', margin.left + 8)
      .attr('y', yScale(0) - 6)
      .attr('fill', '#38bdf8')
      .attr('font-size', '10px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-weight', '600')
      .text('WATER SURFACE (0 FT)');

    // Shallow Hazard Boundary (4.0 ft or 1.2 m)
    const shallowThreshold = isMetric ? 4.0 * 0.3048 : 4.0;
    const shallowY = yScale(shallowThreshold);

    svg.append('line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', shallowY)
      .attr('y2', shallowY)
      .attr('stroke', '#f43f5e')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,4');

    svg.append('text')
      .attr('x', width - margin.right - 8)
      .attr('y', shallowY - 5)
      .attr('text-anchor', 'end')
      .attr('fill', '#f43f5e')
      .attr('font-size', '10px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-weight', '600')
      .text(`SHALLOW HAZARD LIMIT (< ${isMetric ? '1.2m' : '4.0ft'})`);

    // D3 Area & Line Generators for Riverbed
    const areaGenerator = d3.area<ProcessedTrackPoint>()
      .x(d => xScale(isMetric ? d.cumulativeDistKm : d.cumulativeDistNm))
      .y0(yScale(0))
      .y1(d => yScale(isMetric ? d.depthFt * 0.3048 : d.depthFt))
      .curve(d3.curveMonotoneX);

    const lineGenerator = d3.line<ProcessedTrackPoint>()
      .x(d => xScale(isMetric ? d.cumulativeDistKm : d.cumulativeDistNm))
      .y(d => yScale(isMetric ? d.depthFt * 0.3048 : d.depthFt))
      .curve(d3.curveMonotoneX);

    // Draw Shaded Bathymetry Area
    svg.append('path')
      .datum(processedPoints)
      .attr('fill', 'url(#bathymetry-gradient)')
      .attr('d', areaGenerator);

    // Draw Riverbed Surface Line
    svg.append('path')
      .datum(processedPoints)
      .attr('fill', 'none')
      .attr('stroke', '#0284c7')
      .attr('stroke-width', 2.5)
      .attr('d', lineGenerator);

    // Highlight Shallowest Point
    if (stats.minDepthPoint) {
      const minX = xScale(isMetric ? stats.minDepthPoint.cumulativeDistKm : stats.minDepthPoint.cumulativeDistNm);
      const minY = yScale(isMetric ? stats.minDepthPoint.depthFt * 0.3048 : stats.minDepthPoint.depthFt);

      // Warning pulsating circle
      svg.append('circle')
        .attr('cx', minX)
        .attr('cy', minY)
        .attr('r', 6)
        .attr('fill', '#f43f5e')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2);

      svg.append('rect')
        .attr('x', Math.min(width - 150, Math.max(margin.left, minX - 60)))
        .attr('y', Math.max(margin.top + 15, minY - 32))
        .attr('width', 125)
        .attr('height', 20)
        .attr('rx', 4)
        .attr('fill', '#881337')
        .attr('stroke', '#f43f5e')
        .attr('stroke-width', 1);

      svg.append('text')
        .attr('x', Math.min(width - 150, Math.max(margin.left, minX - 60)) + 62)
        .attr('y', Math.max(margin.top + 15, minY - 32) + 14)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ffe4e6')
        .attr('font-size', '10px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('font-weight', '700')
        .text(`MIN: ${formatDepth(stats.minDepthPoint.depthFt)}`);
    }

    // Axes
    const xAxis = d3.axisBottom(xScale)
      .ticks(6)
      .tickFormat(d => `${d} ${isMetric ? 'km' : 'NM'}`);

    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickFormat(d => `${d}${isMetric ? 'm' : 'ft'}`);

    svg.append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .attr('color', '#64748b')
      .call(xAxis)
      .selectAll('text')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '10px');

    svg.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .attr('color', '#64748b')
      .call(yAxis)
      .selectAll('text')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '10px');

    // Interactive Hover Hairline & Crosshair
    const crosshair = svg.append('g')
      .attr('class', 'crosshair')
      .style('display', 'none');

    const verticalLine = crosshair.append('line')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3,3')
      .attr('y1', margin.top)
      .attr('y2', height - margin.bottom);

    const hoverDot = crosshair.append('circle')
      .attr('r', 5)
      .attr('fill', '#38bdf8')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    // Invisible mouse overlay rect
    svg.append('rect')
      .attr('x', margin.left)
      .attr('y', margin.top)
      .attr('width', width - margin.left - margin.right)
      .attr('height', height - margin.top - margin.bottom)
      .attr('fill', 'transparent')
      .attr('cursor', 'crosshair')
      .on('mousemove', (event) => {
        const [mx] = d3.pointer(event);
        const xDist = xScale.invert(mx);
        const bisect = d3.bisector<ProcessedTrackPoint, number>(d => isMetric ? d.cumulativeDistKm : d.cumulativeDistNm).center;
        const index = bisect(processedPoints, xDist);
        const pt = processedPoints[index];

        if (pt) {
          crosshair.style('display', null);
          const px = xScale(isMetric ? pt.cumulativeDistKm : pt.cumulativeDistNm);
          const py = yScale(isMetric ? pt.depthFt * 0.3048 : pt.depthFt);
          verticalLine.attr('x1', px).attr('x2', px);
          hoverDot.attr('cx', px).attr('cy', py);
          setHoveredPoint(pt);
        }
      })
      .on('mouseleave', () => {
        crosshair.style('display', 'none');
        setHoveredPoint(null);
      });

  }, [processedPoints, activeTab, unitSystem, stats]);

  // Render D3 Speed Chart
  useEffect(() => {
    if (!speedChartRef.current || processedPoints.length < 2) return;
    if (activeTab === 'depth') return;

    const svg = d3.select(speedChartRef.current);
    svg.selectAll('*').remove();

    const width = 760;
    const height = activeTab === 'dual' ? 200 : 320;
    const margin = { top: 25, right: 35, bottom: 35, left: 55 };

    const maxDist = isMetric ? stats.totalDistKm : stats.totalDistNm;
    const xScale = d3.scaleLinear()
      .domain([0, Math.max(0.1, maxDist)])
      .range([margin.left, width - margin.right]);

    const maxSpeed = isMetric ? stats.peakSpeedKnots * 1.852 : stats.peakSpeedKnots;
    const yScale = d3.scaleLinear()
      .domain([0, Math.max(8, maxSpeed * 1.2)])
      .range([height - margin.bottom, margin.top]);

    // Defs: Speed Gradient
    const defs = svg.append('defs');
    const speedGrad = defs.append('linearGradient')
      .attr('id', 'speed-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');

    speedGrad.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#f59e0b')
      .attr('stop-opacity', 0.6);

    speedGrad.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#f59e0b')
      .attr('stop-opacity', 0.05);

    // Grid lines
    svg.append('g')
      .attr('class', 'grid-x')
      .attr('stroke', '#1e293b')
      .attr('stroke-dasharray', '3,3')
      .selectAll('line')
      .data(xScale.ticks(8))
      .enter()
      .append('line')
      .attr('x1', d => xScale(d))
      .attr('x2', d => xScale(d))
      .attr('y1', margin.top)
      .attr('y2', height - margin.bottom);

    svg.append('g')
      .attr('class', 'grid-y')
      .attr('stroke', '#1e293b')
      .attr('stroke-dasharray', '3,3')
      .selectAll('line')
      .data(yScale.ticks(5))
      .enter()
      .append('line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d));

    // Average Speed Benchmark Line
    const avgSpdVal = isMetric ? stats.avgSpeedKnots * 1.852 : stats.avgSpeedKnots;
    const avgY = yScale(avgSpdVal);

    svg.append('line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', avgY)
      .attr('y2', avgY)
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '5,5');

    svg.append('text')
      .attr('x', width - margin.right - 8)
      .attr('y', avgY - 5)
      .attr('text-anchor', 'end')
      .attr('fill', '#38bdf8')
      .attr('font-size', '10px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-weight', '600')
      .text(`AVG SPEED: ${formatSpeed(stats.avgSpeedKnots)}`);

    // Speed Area & Line Generators
    const areaGenerator = d3.area<ProcessedTrackPoint>()
      .x(d => xScale(isMetric ? d.cumulativeDistKm : d.cumulativeDistNm))
      .y0(height - margin.bottom)
      .y1(d => yScale(isMetric ? d.speedKnots * 1.852 : d.speedKnots))
      .curve(d3.curveMonotoneX);

    const lineGenerator = d3.line<ProcessedTrackPoint>()
      .x(d => xScale(isMetric ? d.cumulativeDistKm : d.cumulativeDistNm))
      .y(d => yScale(isMetric ? d.speedKnots * 1.852 : d.speedKnots))
      .curve(d3.curveMonotoneX);

    // Draw Filled Speed Area
    svg.append('path')
      .datum(processedPoints)
      .attr('fill', 'url(#speed-gradient)')
      .attr('d', areaGenerator);

    // Draw Speed Curve Line
    svg.append('path')
      .datum(processedPoints)
      .attr('fill', 'none')
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 2.5)
      .attr('d', lineGenerator);

    // Highlight Peak Speed
    if (stats.peakSpeedPoint) {
      const peakX = xScale(isMetric ? stats.peakSpeedPoint.cumulativeDistKm : stats.peakSpeedPoint.cumulativeDistNm);
      const peakY = yScale(isMetric ? stats.peakSpeedPoint.speedKnots * 1.852 : stats.peakSpeedPoint.speedKnots);

      svg.append('circle')
        .attr('cx', peakX)
        .attr('cy', peakY)
        .attr('r', 6)
        .attr('fill', '#f59e0b')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2);

      svg.append('rect')
        .attr('x', Math.min(width - 150, Math.max(margin.left, peakX - 60)))
        .attr('y', Math.max(margin.top, peakY - 30))
        .attr('width', 125)
        .attr('height', 20)
        .attr('rx', 4)
        .attr('fill', '#78350f')
        .attr('stroke', '#f59e0b')
        .attr('stroke-width', 1);

      svg.append('text')
        .attr('x', Math.min(width - 150, Math.max(margin.left, peakX - 60)) + 62)
        .attr('y', Math.max(margin.top, peakY - 30) + 14)
        .attr('text-anchor', 'middle')
        .attr('fill', '#fef3c7')
        .attr('font-size', '10px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('font-weight', '700')
        .text(`PEAK: ${formatSpeed(stats.peakSpeedPoint.speedKnots)}`);
    }

    // Axes
    const xAxis = d3.axisBottom(xScale)
      .ticks(6)
      .tickFormat(d => `${d} ${isMetric ? 'km' : 'NM'}`);

    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickFormat(d => `${d} ${isMetric ? 'km/h' : 'kt'}`);

    svg.append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .attr('color', '#64748b')
      .call(xAxis)
      .selectAll('text')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '10px');

    svg.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .attr('color', '#64748b')
      .call(yAxis)
      .selectAll('text')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '10px');

    // Interactive Hover Crosshair
    const crosshair = svg.append('g')
      .attr('class', 'crosshair')
      .style('display', 'none');

    const verticalLine = crosshair.append('line')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3,3')
      .attr('y1', margin.top)
      .attr('y2', height - margin.bottom);

    const hoverDot = crosshair.append('circle')
      .attr('r', 5)
      .attr('fill', '#f59e0b')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    svg.append('rect')
      .attr('x', margin.left)
      .attr('y', margin.top)
      .attr('width', width - margin.left - margin.right)
      .attr('height', height - margin.top - margin.bottom)
      .attr('fill', 'transparent')
      .attr('cursor', 'crosshair')
      .on('mousemove', (event) => {
        const [mx] = d3.pointer(event);
        const xDist = xScale.invert(mx);
        const bisect = d3.bisector<ProcessedTrackPoint, number>(d => isMetric ? d.cumulativeDistKm : d.cumulativeDistNm).center;
        const index = bisect(processedPoints, xDist);
        const pt = processedPoints[index];

        if (pt) {
          crosshair.style('display', null);
          const px = xScale(isMetric ? pt.cumulativeDistKm : pt.cumulativeDistNm);
          const py = yScale(isMetric ? pt.speedKnots * 1.852 : pt.speedKnots);
          verticalLine.attr('x1', px).attr('x2', px);
          hoverDot.attr('cx', px).attr('cy', py);
          setHoveredPoint(pt);
        }
      })
      .on('mouseleave', () => {
        crosshair.style('display', 'none');
        setHoveredPoint(null);
      });

  }, [processedPoints, activeTab, unitSystem, stats]);

  const handleCopySummary = () => {
    const summaryText = `RiverNav Trip Summary: ${route.name}
Total Distance: ${formatDistance(stats.totalDistNm)}
Peak Speed: ${formatSpeed(stats.peakSpeedKnots)}
Average Speed: ${formatSpeed(stats.avgSpeedKnots)}
Minimum Depth: ${formatDepth(stats.minDepthFt)}
Average Depth: ${formatDepth(stats.avgDepthFt)}
Passage Duration: ${formatDuration(stats.durationSec)}
Trackpoints Recorded: ${processedPoints.length}`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col bg-slate-950 text-slate-100 select-none overflow-hidden">
      {/* Top Header & Actions Strip */}
      <div className="px-6 py-3.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Return to Saved Routes List"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight truncate max-w-md">
                {route.name}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 border border-sky-800 text-sky-400 font-semibold uppercase">
                Trip Report
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(route.startTime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
              <span>·</span>
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDuration(stats.durationSec)}</span>
            </p>
          </div>
        </div>

        {/* Toolbar: Units, Export, Print, Copy */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Unit Toggle */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800">
            <button
              onClick={() => setUnitSystem('nautical')}
              className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors cursor-pointer ${
                unitSystem === 'nautical' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              NM / KT
            </button>
            <button
              onClick={() => setUnitSystem('metric')}
              className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors cursor-pointer ${
                unitSystem === 'metric' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              KM / KMH
            </button>
          </div>

          <button
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
            title="Copy Report Telemetry to Clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {onExportGPX && (
            <button
              onClick={() => onExportGPX(route)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-sm"
              title="Download standard GPX 1.1 file"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export GPX</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer border border-slate-700"
            title="Print or Save PDF Report"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Report Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Total Distance */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-sky-400" />
              Total Distance
            </span>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-white">
                {formatDistance(stats.totalDistNm)}
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                {isMetric ? `${stats.totalDistNm.toFixed(2)} NM` : `${stats.totalDistKm.toFixed(2)} km`}
              </div>
            </div>
          </div>

          {/* Peak Speed */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Peak Speed
            </span>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-amber-400">
                {formatSpeed(stats.peakSpeedKnots)}
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                Avg: {formatSpeed(stats.avgSpeedKnots)}
              </div>
            </div>
          </div>

          {/* Minimum Depth */}
          <div className={`p-3.5 rounded-xl border flex flex-col justify-between transition-colors ${
            stats.minDepthFt < 4.0 
              ? 'bg-rose-950/30 border-rose-800/80' 
              : 'bg-slate-900 border-slate-800'
          }`}>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5 text-sky-400" />
                Min Depth (Shoal)
              </span>
              {stats.minDepthFt < 4.0 && (
                <span className="text-[9px] font-bold text-rose-400 uppercase">Shallow</span>
              )}
            </span>
            <div className="mt-2">
              <div className={`text-2xl sm:text-3xl font-black font-mono tabular-nums ${
                stats.minDepthFt < 4.0 ? 'text-rose-400' : 'text-sky-300'
              }`}>
                {formatDepth(stats.minDepthFt)}
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                Avg: {formatDepth(stats.avgDepthFt)}
              </div>
            </div>
          </div>

          {/* Passage Efficiency */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              Passage Duration
            </span>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-white">
                {formatDuration(stats.durationSec)}
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                {processedPoints.length} trackpoints
              </div>
            </div>
          </div>
        </div>

        {/* Chart Viewport Container */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          {/* Chart Header & Tab Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-sky-400" />
                <span>Visual Telemetry Profile (D3 Engine)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Interactive riverbed depth bathymetry and speed over ground across voyage distance
              </p>
            </div>

            {/* Tab Controls */}
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('dual')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  activeTab === 'dual' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Dual Synced
              </button>
              <button
                onClick={() => setActiveTab('depth')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  activeTab === 'depth' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Depth Profile
              </button>
              <button
                onClick={() => setActiveTab('speed')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  activeTab === 'speed' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Speed Profile
              </button>
            </div>
          </div>

          {/* Hover Telemetry HUD Strip */}
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <span className="text-slate-400 uppercase text-[10px] tracking-wider">
              {hoveredPoint ? 'Interactive Point Telemetry:' : 'Hover along charts to inspect point details:'}
            </span>

            {hoveredPoint ? (
              <div className="flex items-center gap-4 flex-wrap">
                <span>Distance: <strong className="text-white">{formatDistance(hoveredPoint.cumulativeDistNm)}</strong></span>
                <span>Depth: <strong className="text-sky-400">{formatDepth(hoveredPoint.depthFt)}</strong></span>
                <span>Speed: <strong className="text-amber-400">{formatSpeed(hoveredPoint.speedKnots)}</strong></span>
                <span>Heading: <strong className="text-white">{hoveredPoint.headingDeg}°</strong></span>
                <span className="text-slate-500">{new Date(hoveredPoint.time).toLocaleTimeString()}</span>
              </div>
            ) : (
              <div className="flex items-center gap-4 text-slate-500">
                <span>Peak: {formatSpeed(stats.peakSpeedKnots)}</span>
                <span>·</span>
                <span>Min Depth: {formatDepth(stats.minDepthFt)}</span>
                <span>·</span>
                <span>Total: {formatDistance(stats.totalDistNm)}</span>
              </div>
            )}
          </div>

          {/* D3 SVG Charts Area */}
          <div className="space-y-4">
            {/* Depth Chart */}
            {(activeTab === 'dual' || activeTab === 'depth') && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs px-2">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Waves className="w-3.5 h-3.5 text-sky-400" />
                    Riverbed Bathymetry Profile
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Surface (0) to Riverbed Floor
                  </span>
                </div>
                <div className="w-full overflow-x-auto bg-slate-950 rounded-xl border border-slate-800 p-2">
                  <svg
                    ref={depthChartRef}
                    viewBox="0 0 760 220"
                    className="w-full h-auto min-w-[600px]"
                  />
                </div>
              </div>
            )}

            {/* Speed Chart */}
            {(activeTab === 'dual' || activeTab === 'speed') && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs px-2">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Speed Over Ground (SOG) Progression
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Peak: {formatSpeed(stats.peakSpeedKnots)}
                  </span>
                </div>
                <div className="w-full overflow-x-auto bg-slate-950 rounded-xl border border-slate-800 p-2">
                  <svg
                    ref={speedChartRef}
                    viewBox="0 0 760 200"
                    className="w-full h-auto min-w-[600px]"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Voyage Analysis & Hydrodynamics Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Depth Safety Breakdown */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Bathymetry Safety Analysis
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {stats.minDepthFt < 4.0 ? '1 Hazard Encounter' : 'Clear Passage'}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {stats.minDepthFt < 4.0 ? (
                <span className="text-rose-300">
                  ⚠️ Shallow transit detected: The vessel crossed a shallow shoal or sandbar of <strong>{formatDepth(stats.minDepthFt)}</strong> at approximately {formatDistance(stats.minDepthPoint ? stats.minDepthPoint.cumulativeDistNm : 0)}. Slow cruising is recommended in this reach.
                </span>
              ) : (
                <span className="text-emerald-300">
                  ✓ Safe navigation profile maintained: Minimum observed water depth was <strong>{formatDepth(stats.minDepthFt)}</strong>, remaining safely above the 4.0 ft shallow alarm threshold throughout the entire voyage.
                </span>
              )}
            </p>

            <div className="pt-2 border-t border-slate-800 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Shallow Water (&lt; 6 ft):</span>
                <span className="text-white">{stats.shallowTimePercent}% of track</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Navigable Channel (&gt; 12 ft):</span>
                <span className="text-sky-400">{100 - stats.shallowTimePercent}% of track</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Maximum Channel Depth:</span>
                <span className="text-white">{formatDepth(stats.maxDepthFt)}</span>
              </div>
            </div>
          </div>

          {/* Speed & Fuel Performance */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-sky-400" />
                Vessel Velocity & Cruising Profile
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Max: {formatSpeed(stats.peakSpeedKnots)}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Maintained an average speed of <strong>{formatSpeed(stats.avgSpeedKnots)}</strong> over {formatDistance(stats.totalDistNm)}. Peak velocity of <strong>{formatSpeed(stats.peakSpeedKnots)}</strong> was recorded at {formatDistance(stats.peakSpeedPoint ? stats.peakSpeedPoint.cumulativeDistNm : 0)}.
            </p>

            <div className="pt-2 border-t border-slate-800 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Displacement / Idle (&lt; 6 kts):</span>
                <span className="text-white">
                  {Math.round((processedPoints.filter(p => p.speedKnots < 6).length / Math.max(1, processedPoints.length)) * 100)}%
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Cruising Range (6–12 kts):</span>
                <span className="text-sky-400">
                  {Math.round((processedPoints.filter(p => p.speedKnots >= 6 && p.speedKnots < 12).length / Math.max(1, processedPoints.length)) * 100)}%
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Planing Speed (&gt; 12 kts):</span>
                <span className="text-amber-400">
                  {Math.round((processedPoints.filter(p => p.speedKnots >= 12).length / Math.max(1, processedPoints.length)) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
