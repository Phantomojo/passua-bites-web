import { trpc } from "@/lib/trpc";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const C = {
  ember:  "#c45c28",
  ember2: "#e07840",
  sienna: "#8b3a1a",
  ivory:  "#f2e8d8",
  ivory2: "#c8b898",
  ivory3: "#7a6a52",
  bg:     "#0d0906",
  bg2:    "#130d09",
  bg3:    "#1a1109",
  rule:   "rgba(196,92,40,0.15)",
  rule2:  "rgba(196,92,40,0.08)",
};

const PIE_COLORS = [C.ember, C.ember2, C.sienna, "#b87333", "#a0522d"];

const STATUS_COLORS: Record<string, string> = {
  pending:   C.ivory3,
  confirmed: "#60a5fa",
  preparing: C.ember2,
  ready:     "#4ade80",
  delivered: "#a78bfa",
  cancelled: "#f87171",
};

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: C.bg2, border: `1px solid ${C.rule}`, padding: "1.2rem 1.4rem", flex: "1 1 160px", minWidth: 140 }}>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: C.ivory3, marginBottom: "0.5rem" }}>{label}</div>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.8rem", color: C.ivory, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.6rem", color: C.ivory3, marginTop: "0.4rem" }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: C.ember, marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: `1px solid ${C.rule}` }}>{children}</div>;
}

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: C.bg2, border: `1px solid ${C.rule}`, padding: "1.4rem", ...style }}>{children}</div>;
}

const tooltipStyle = {
  contentStyle: { background: C.bg3, border: `1px solid ${C.rule}`, borderRadius: 0, fontFamily: "'DM Mono',monospace", fontSize: "0.65rem", color: C.ivory },
  labelStyle: { color: C.ivory2 },
};

function MonoTick({ x, y, payload }: any) {
  return <text x={x} y={y + 10} textAnchor="middle" fill={C.ivory3} style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.55rem" }}>{payload.value}</text>;
}

function MonoYTick({ x, y, payload }: any) {
  return <text x={x - 4} y={y + 4} textAnchor="end" fill={C.ivory3} style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.55rem" }}>{payload.value}</text>;
}

function Skeleton({ h = 200 }: { h?: number }) {
  return <div style={{ height: h, background: `linear-gradient(90deg, ${C.bg2} 25%, ${C.bg3} 50%, ${C.bg2} 75%)`, backgroundSize: "200% 100%", animation: "pb-shimmer 1.5s infinite", border: `1px solid ${C.rule2}` }} />;
}

export default function AnalyticsTab() {
  const traffic = trpc.analytics.getTraffic.useQuery(undefined, { refetchInterval: 60_000, staleTime: 30_000 });
  const insights = trpc.analytics.getOrderInsights.useQuery(undefined, { refetchInterval: 60_000, staleTime: 30_000 });

  const t = traffic.data;
  const o = insights.data;
  const loading = traffic.isLoading || insights.isLoading;

  const shortPage = (p: string) => p === "/" ? "Home" : p.replace(/^\//, "").replace(/-/g, " ") || p;
  const ksh = (n: number) => `Ksh ${n.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <SectionTitle>Traffic — Last 30 Days</SectionTitle>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
          {loading ? [1, 2, 3].map(i => <Skeleton key={i} h={90} />) : (
            <>
              <StatCard label="Unique Visitors" value={t?.summary.uniqueVisitors.toLocaleString() ?? "—"} sub="distinct IPs (30d)" />
              <StatCard label="Sessions" value={t?.summary.totalSessions.toLocaleString() ?? "—"} sub="daily session IDs" />
              <StatCard label="Pageviews" value={t?.summary.totalPageviews.toLocaleString() ?? "—"} sub="total page hits" />
              <StatCard label="Top Country" value={t?.countries[0]?.country ?? "—"} sub={`${t?.countries[0]?.visitors ?? 0} visitors`} />
            </>
          )}
        </div>

        <Panel style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.58rem", color: C.ivory3, marginBottom: "1rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>Daily Visitors</div>
          {loading ? <Skeleton h={200} /> : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={t?.daily ?? []} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid stroke={C.rule} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={MonoTick} tickFormatter={d => d.slice(5)} interval={Math.floor((t?.daily?.length ?? 1) / 6)} axisLine={{ stroke: C.rule }} tickLine={false} />
                <YAxis tick={MonoYTick} axisLine={false} tickLine={false} width={32} />
                <Tooltip {...tooltipStyle} formatter={(v: any, n: string) => [v, n]} labelFormatter={l => `Date: ${l}`} />
                <Line type="monotone" dataKey="visitors" stroke={C.ember} strokeWidth={2} dot={false} name="Visitors" />
                <Line type="monotone" dataKey="pageviews" stroke={C.ivory3} strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="Pageviews" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
          <Panel>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.58rem", color: C.ivory3, marginBottom: "1rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>Top Pages</div>
            {loading ? <Skeleton h={180} /> : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {(t?.topPages ?? []).slice(0, 7).map((p, i) => {
                  const max = t?.topPages[0]?.views ?? 1;
                  return (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'DM Mono',monospace", fontSize: "0.6rem", color: C.ivory2, marginBottom: "0.2rem" }}>
                        <span style={{ color: C.ivory }}>{shortPage(p.page)}</span>
                        <span style={{ color: C.ivory3 }}>{p.views}</span>
                      </div>
                      <div style={{ height: 3, background: C.rule2 }}><div style={{ height: "100%", width: `${(p.views / max) * 100}%`, background: C.ember, transition: "width 0.6s ease" }} /></div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>

          <Panel>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.58rem", color: C.ivory3, marginBottom: "1rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>Devices</div>
            {loading ? <Skeleton h={180} /> : (
              <>
                <ResponsiveContainer width="100%" height={130}>
                  <PieChart>
                    <Pie data={t?.devices ?? []} dataKey="sessions" nameKey="device" cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3}>
                      {(t?.devices ?? []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  {(t?.devices ?? []).map((d, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontFamily: "'DM Mono',monospace", fontSize: "0.6rem", color: C.ivory2 }}>
                      <div style={{ width: 8, height: 8, background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                      <span style={{ textTransform: "capitalize", flex: 1 }}>{d.device}</span>
                      <span style={{ color: C.ivory3 }}>{d.sessions}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Panel>

          <Panel>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.58rem", color: C.ivory3, marginBottom: "1rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>Countries</div>
            {loading ? <Skeleton h={180} /> : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {(t?.countries ?? []).slice(0, 8).map((c, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontFamily: "'DM Mono',monospace", fontSize: "0.6rem", color: C.ivory2, padding: "0.25rem 0", borderBottom: `1px solid ${C.rule2}` }}>
                    <span style={{ color: C.ivory }}>{c.country}</span>
                    <span style={{ color: C.ivory3 }}>{c.visitors} visitors</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
          <Panel>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.58rem", color: C.ivory3, marginBottom: "1rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>Browsers</div>
            {loading ? <Skeleton h={120} /> : (
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={t?.browsers ?? []} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <XAxis type="number" tick={MonoTick} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="browser" width={52} tick={(props) => <text x={props.x - 4} y={props.y + 4} textAnchor="end" fill={C.ivory3} style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.55rem" }}>{props.payload.value}</text>} axisLine={false} tickLine={false} />
                  <Bar dataKey="sessions" fill={C.ember} radius={0} barSize={10} />
                  <Tooltip {...tooltipStyle} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Panel>

          <Panel>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.58rem", color: C.ivory3, marginBottom: "1rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>Traffic Sources</div>
            {loading ? <Skeleton h={120} /> : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {(t?.referrers ?? []).slice(0, 6).map((r, i) => {
                  const max = t?.referrers[0]?.visits ?? 1;
                  const label = r.source === "Direct" ? "Direct" : r.source.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
                  return (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'DM Mono',monospace", fontSize: "0.6rem", marginBottom: "0.2rem" }}>
                        <span style={{ color: C.ivory }}>{label}</span>
                        <span style={{ color: C.ivory3 }}>{r.visits}</span>
                      </div>
                      <div style={{ height: 3, background: C.rule2 }}><div style={{ height: "100%", width: `${(r.visits / max) * 100}%`, background: C.ember2 }} /></div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>
      </div>

      <div>
        <SectionTitle>Order Insights — Last 30 Days</SectionTitle>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
          {loading ? [1, 2, 3, 4].map(i => <Skeleton key={i} h={90} />) : (
            <>
              <StatCard label="Total Revenue" value={ksh(o?.summary.totalRevenue ?? 0)} sub="completed payments" />
              <StatCard label="Total Orders" value={o?.summary.totalOrders.toLocaleString() ?? "—"} sub="all time" />
              <StatCard label="Avg Order Value" value={ksh(o?.summary.avgOrderValue ?? 0)} sub="completed orders" />
              <StatCard label="Repeat Rate" value={`${o?.summary.repeatRate ?? 0}%`} sub="customers with 2+ orders" />
            </>
          )}
        </div>

        <Panel style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.58rem", color: C.ivory3, marginBottom: "1rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>Daily Revenue (Ksh)</div>
          {loading ? <Skeleton h={200} /> : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={o?.revenueTrend ?? []} margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
                <CartesianGrid stroke={C.rule} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={MonoTick} tickFormatter={d => d.slice(5)} interval={Math.floor((o?.revenueTrend?.length ?? 1) / 6)} axisLine={{ stroke: C.rule }} tickLine={false} />
                <YAxis tick={MonoYTick} axisLine={false} tickLine={false} width={48} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip {...tooltipStyle} formatter={(v: any, n: string) => [n === "revenue" ? ksh(Number(v)) : v, n === "revenue" ? "Revenue" : "Orders"]} labelFormatter={l => `Date: ${l}`} />
                <Line type="monotone" dataKey="revenue" stroke={C.ember} strokeWidth={2} dot={false} name="revenue" />
                <Line type="monotone" dataKey="orders" stroke={C.ivory3} strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="orders" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
          <Panel>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.58rem", color: C.ivory3, marginBottom: "1rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>Top Items by Revenue</div>
            {loading ? <Skeleton h={220} /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={o?.topItems ?? []} layout="vertical" margin={{ left: 8, right: 24 }}>
                  <XAxis type="number" tick={MonoTick} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={80} tick={(props) => <text x={props.x - 4} y={props.y + 4} textAnchor="end" fill={C.ivory2} style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.55rem" }}>{props.payload.value.length > 12 ? props.payload.value.slice(0, 12) + "..." : props.payload.value}</text>} axisLine={false} tickLine={false} />
                  <Bar dataKey="revenue" fill={C.ember} barSize={14} radius={0} name="Revenue (Ksh)" />
                  <Tooltip {...tooltipStyle} formatter={(v: any) => [ksh(Number(v)), "Revenue"]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Panel>

          <Panel>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.58rem", color: C.ivory3, marginBottom: "1rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>Order Status</div>
            {loading ? <Skeleton h={220} /> : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {(o?.statusBreakdown ?? []).map((s, i) => {
                  const total = o?.statusBreakdown.reduce((a, b) => a + b.count, 0) ?? 1;
                  const pct = Math.round((s.count / total) * 100);
                  return (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'DM Mono',monospace", fontSize: "0.6rem", marginBottom: "0.25rem" }}>
                        <span style={{ color: STATUS_COLORS[s.status] ?? C.ivory2, textTransform: "capitalize" }}>{s.status}</span>
                        <span style={{ color: C.ivory3 }}>{s.count} ({pct}%)</span>
                      </div>
                      <div style={{ height: 4, background: C.rule2 }}><div style={{ height: "100%", width: `${pct}%`, background: STATUS_COLORS[s.status] ?? C.ember, transition: "width 0.6s ease" }} /></div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>

        <Panel>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.58rem", color: C.ivory3, marginBottom: "1rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>Peak Order Hours (30d)</div>
          {loading ? <Skeleton h={160} /> : (
            <>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={o?.peakHours ?? []} margin={{ top: 4, right: 8, bottom: 0, left: 0 }} barCategoryGap="15%">
                <CartesianGrid stroke={C.rule} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={MonoTick} interval={1} axisLine={{ stroke: C.rule }} tickLine={false} />
                <YAxis tick={MonoYTick} axisLine={false} tickLine={false} width={24} />
                <Tooltip {...tooltipStyle} formatter={(v: any) => [v, "Orders"]} labelFormatter={l => `Hour: ${l}`} />
                <Bar dataKey="orders" name="Orders" radius={0}>
                  {(o?.peakHours ?? []).map((h: any, i: number) => {
                    const max = Math.max(...(o?.peakHours ?? []).map(x => x.orders), 1);
                    const intensity = h.orders / max;
                    return <Cell key={i} fill={intensity > 0.8 ? C.ember2 : intensity > 0.4 ? C.ember : C.sienna} opacity={intensity < 0.05 ? 0.2 : 1} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.8rem", fontFamily: "'DM Mono',monospace", fontSize: "0.55rem", color: C.ivory3 }}>
              {[{ color: C.ember2, label: "Peak" }, { color: C.ember, label: "Active" }, { color: C.sienna, label: "Low" }].map(({ color, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <div style={{ width: 8, height: 8, background: color }} />{label}
                </div>
              ))}
            </div>
            </>
          )}
        </Panel>
      </div>

      <style>{`@keyframes pb-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
}
