import { useEffect, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { TILE_SERVER_URL } from '../store/mapLayerStore.js';
import { useMapStore } from '../store/mapStore.js';

function LoadingChartSkeleton() {
  return (
    <div className="w-full h-full p-4">
      <div className="w-full h-full bg-gray-200 animate-pulse rounded"></div>
    </div>
  );
}

export default function CoverageChartDebug() {
  // read year from zustand; fallback to 2024 if missing
  const yearFromStore = useMapStore ? useMapStore((s) => s.year) : undefined;
  const year = Number(yearFromStore) || 2024;

  const [raw, setRaw] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    setRaw(null);

    const url = `${TILE_SERVER_URL}/lulc-stats?year=${year}`;
    console.debug('[CoverageChart] fetching', url);

    fetch(url)
      .then(async (r) => {
        const text = await r.text();
        // Try parse JSON but keep raw text for debugging
        try {
          const json = JSON.parse(text);
          return { ok: r.ok, json, status: r.status, statusText: r.statusText, text };
        } catch (e) {
          return { ok: r.ok, json: null, status: r.status, statusText: r.statusText, text };
        }
      })
      .then((resp) => {
        if (!mounted) return;
        console.debug('[CoverageChart] fetch response:', resp);
        if (!resp.ok) {
          setError(`Server ${resp.status}: ${resp.statusText} — ${resp.text}`);
          setLoading(false);
          return;
        }
        if (!resp.json) {
          setError(`Invalid JSON from server. Response text: ${resp.text}`);
          setLoading(false);
          return;
        }
        setRaw(resp.json);
      })
      .catch((e) => {
        if (!mounted) return;
        console.error('[CoverageChart] fetch error', e);
        setError(String(e));
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [year]);

  // Normalize backend response into { year: number, data: Array<[kab,area]> }
  const normalized = useMemo(() => {
    if (!raw) return null;

    // If server already returns { year: N, data: [...] }
    if (raw && raw.year && Array.isArray(raw.data)) {
      return { year: Number(raw.year), data: raw.data };
    }

    // If server returns keyed object like { "2024": [ ... ] }
    const keys = Object.keys(raw);
    // if first key is numeric and value is array
    for (const k of keys) {
      if (/^\d{4}$/.test(k) && Array.isArray(raw[k])) {
        return { year: Number(k), data: raw[k] };
      }
    }

    // If server returns something like an array directly
    if (Array.isArray(raw)) {
      return { year, data: raw };
    }

    // Last attempt: find first array value
    for (const k of keys) {
      if (Array.isArray(raw[k])) {
        return { year: raw.year ? Number(raw.year) : Number(k) || year, data: raw[k] };
      }
    }

    // Nothing matched
    return null;
  }, [raw, year]);

  // Map to labels & values
  const { labels, values } = useMemo(() => {
    if (!normalized) return { labels: [], values: [] };
    const mapped = normalized.data
      .map((entry) => {
        const kab = String((entry && entry[0]) || '');
        const area = Number((entry && entry[1]) || 0) || 0;
        return { kab, area };
      })
      .filter((m) => m.kab) // drop empty names
      .sort((b, a) => b.area - a.area);
    return { labels: mapped.map((m) => m.kab), values: mapped.map((m) => m.area) };
  }, [normalized]);

  if (loading) return <LoadingChartSkeleton />;
  if (error) return <div style={{ color: 'crimson' }}>Error loading chart: {error}</div>;
  if (!raw) {
    return (
      <div>
        No data received. Open console (F12) → Network and check the response from <code>{TILE_SERVER_URL}/lulc-stats</code>.
      </div>
    );
  }
  if (!normalized) {
    console.warn('[CoverageChart] unable to normalize server response', raw);
    return (
      <div>
        Unexpected server response shape. Open console (F12) and inspect the object logged as <code>raw</code>.
      </div>
    );
  }

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
      formatter: (params) => {
        const p = params[0];
        return `${p.name}<br/>Area: ${Number(p.value).toLocaleString()} ha`;
      }
    },
    grid: { left: "10%", right: "10%", bottom: "18%" },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: { rotate: 30, interval: 0, formatter: (v) => v.length > 18 ? v.slice(0,16) + "…" : v }
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
      <ReactECharts option={option} style={{ height: '100%' }} />
    </div>
  );
}
