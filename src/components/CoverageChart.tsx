import { color } from 'echarts';
import ReactECharts from 'echarts-for-react';
import { useEffect, useMemo, useState } from 'react';
import {TILE_SERVER_URL} from '../store/mapLayerStore';



type BackendRaw = {
  [year: string]: Array<[string, string | number]>;
};

export default function SalesDistributionChart({ year = "2024" } : { year?: string, height?: number | string }) {
const [data, setData] = useState<BackendRaw | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch(`${TILE_SERVER_URL}/lulc-stats`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((json) => { if (mounted) setData(json as BackendRaw); })
      .catch((e) => { if (mounted) setError(String(e)); })
      .finally(() => { /* nothing else */ });

    return () => { mounted = false; };
  }, []);

  // Prepare labels & values for the requested year
  const { labels, values } = useMemo(() => {
    const raw = data?.[String(year)] || [];
    const mapped = raw.map((entry) => {
      const kab = String(entry[0] ?? "");
      const area = Number(entry[1] ?? 0) || 0;
      return { kab, area };
    }).sort((b,a) => b.area - a.area);
    return { labels: mapped.map(m => m.kab), values: mapped.map(m => m.area) };
  }, [data, year]);

  if (error) return <div style={{ color: "crimson" }}>Error loading chart: {error}</div>;
  if (!data) return <div>Loading chart…</div>;

  const option = {
    title: {
      text: `Area (ha) per Kabupaten — ${year}`,
      left: "center",
      textStyle: { 
        fontSize: 17,
        color: "#0e7490",
    }
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: any) => {
        const p = params[0];
        return `${p.name}<br/>Area: ${Number(p.value).toLocaleString()} ha`;
      }
    },
    grid: { left: "10%", right: "10%", bottom: "18%" },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: { rotate: 30, interval: 0, formatter: (v: string) => v.length > 18 ? v.slice(0,16) + "…" : v }
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        name: "Area (ha)",
        type: "bar",
        data: values,
        barWidth: "50%",
        itemStyle:{
            color: '#06b6d4'
        }
      }
    ],
    
  };


  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactECharts 
        option={option} 
        style={{ height: '100%' }}
      />
    </div>
  );
};

