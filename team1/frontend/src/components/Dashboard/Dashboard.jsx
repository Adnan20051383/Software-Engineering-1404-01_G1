import React, { useState, useEffect, useContext } from 'react';
import { dashboardService } from '../../services/dashboard-service';
import { SettingsContext } from '../../context/SettingsContext';
import './Dashboard.css';

const Dashboard = () => {
  const { strings, lang } = useContext(SettingsContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardService.getStats();
        setStats(data);
      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="status-msg">...</div>;
  if (!stats) return <div className="status-msg">{strings.dashboard_load_error}</div>;

  // --- RTL-Aware Sequential Chart Logic ---
  const prepareChartData = () => {
    const recent = [...(stats.quizzes?.recent || [])].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );

    if (recent.length === 0) return null;

    const width = 600,
      height = 200,
      padding = 40;
    const isRTL = lang === 'fa';

    const getY = (score) =>
      height - padding - (score * (height - 2 * padding)) / 100;

    const getX = (i) => {
      if (recent.length === 1) return width / 2;
      let xPos = padding + (i * (width - 2 * padding)) / (recent.length - 1);
      return isRTL ? width - xPos : xPos;
    };

    const types = [
      { id: 1, label: strings.daily || 'Daily', color: '#3182ce' },
      { id: 2, label: strings.weekly || 'Weekly', color: '#805ad5' },
      { id: 3, label: strings.monthly || 'Monthly', color: '#38a169' }
    ];

    const lines = types.map((t) => {
      const filteredPoints = recent
        .map((q, i) => ({ ...q, originalIdx: i }))
        .filter((q) => Number(q.type) === t.id);

      const path =
        filteredPoints.length > 1
          ? filteredPoints
              .map((q) => `${getX(q.originalIdx)},${getY(q.score)}`)
              .join(' ')
          : null;

      return { ...t, points: path, data: filteredPoints };
    });

    return { recent, getX, getY, width, height, lines };
  };

  const chartData = prepareChartData();

  const boxes = [
    { key: 'new', label: strings.box_new, color: '#3182ce' },
    { key: '1_day', label: strings.box_1day, color: '#63b3ed' },
    { key: '3_days', label: strings.box_3days, color: '#805ad5' },
    { key: '7_days', label: strings.box_7days, color: '#d69e2e' },
    { key: 'mastered', label: strings.box_mastered, color: '#38a169' }
  ];

  return (
    <div className="dashboard-wrapper" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
      <header className="db-header">
        <h1>{strings.dashboard_title}</h1>
      </header>

      <div className="db-top-row">
        <div className="db-card main-stat">
          <span>{strings.total_vocab}</span>
          <strong>{stats.words?.total || 0}</strong>
        </div>

        <div className="db-card main-stat highlight">
          <span>{strings.total_games}</span>
          <strong>{stats.games?.count || 0}</strong>
          <small>
            {strings.avg_score}: {stats.games?.avg_score?.toFixed(0) || 0}
          </small>
        </div>
      </div>

      {/* --- Leitner Breakdown --- */}
      <section className="db-section-card">
        <h3>{strings.leitner_breakdown_title}</h3>

        <div className="boxes-grid">
          {boxes.map((box) => {
            const count = stats.words?.by_leitner?.[box.key] || 0;
            return (
              <div key={box.key} className="box-stat-item">
                <div
                  className="box-color-dot"
                  style={{ backgroundColor: box.color }}
                ></div>
                <div className="box-info">
                  <label>{box.label}</label>
                  <strong>{count}</strong>
                </div>
              </div>
            );
          })}
        </div>

        <div className="leitner-progress-full">
          {boxes.map((box) => {
            const count = stats.words?.by_leitner?.[box.key] || 0;
            const width = (count / (stats.words?.total || 1)) * 100;
            return (
              <div
                key={box.key}
                className="p-seg"
                style={{ width: `${width}%`, backgroundColor: box.color }}
              />
            );
          })}
        </div>
      </section>

      {/* --- Multi-Line Chart --- */}
      <section className="db-section-card chart-section">
        <div className="chart-header">
          <h3>{strings.quiz_performance}</h3>

          <div className="chart-legend">
            {chartData?.lines.map((l) => (
              <span key={l.id} className="legend-item">
                <i style={{ backgroundColor: l.color }}></i> {l.label}
              </span>
            ))}
          </div>
        </div>

        <div className="svg-container">
          {chartData ? (
            <svg
              viewBox={`0 0 ${chartData.width} ${chartData.height}`}
              preserveAspectRatio="xMidYMid meet"
            >
              <line
                x1="40"
                y1={chartData.height - 40}
                x2={chartData.width - 40}
                y2={chartData.height - 40}
                stroke="#e2e8f0"
                strokeWidth="1"
              />

              {chartData.lines.map((line) => (
                <g key={line.id}>
                  {line.points && (
                    <polyline
                      fill="none"
                      stroke={line.color}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={line.points}
                      className="fade-in-path"
                    />
                  )}

                  {line.data.map((q, i) => (
                    <g key={i}>
                      <circle
                        cx={chartData.getX(q.originalIdx)}
                        cy={chartData.getY(q.score)}
                        r="5"
                        fill={line.color}
                        stroke="white"
                        strokeWidth="2"
                      />
                      <text
                        x={chartData.getX(q.originalIdx)}
                        y={chartData.getY(q.score) - 12}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="bold"
                        fill={line.color}
                      >
                        {q.score}%
                      </text>
                    </g>
                  ))}
                </g>
              ))}
            </svg>
          ) : (
            <p className="no-data-msg">{strings.no_data}</p>
          )}
        </div>

        <div className="chart-labels">
          {chartData?.recent.map((q, i) => (
            <span
              key={i}
              style={{
                left: `${(chartData.getX(i) / chartData.width) * 100}%`
              }}
            >
              {new Date(q.created_at).toLocaleDateString(
                lang === 'fa' ? 'fa-IR' : 'en-US',
                { day: 'numeric', month: 'short' }
              )}
            </span>
          ))}
        </div>
      </section>

      <div className="db-history-grid">
        <div className="db-section-card">
          <h3>{strings.recent_quizzes}</h3>
          <table className="db-table">
            <tbody>
              {(stats.quizzes?.recent || []).map((q) => (
                <tr key={q.quiz_id}>
                  <td>
                    <span
                      className="badge-score"
                    >
                      {q.score}%
                    </span>
                  </td>
                  <td className="date-col">
                    {new Date(q.created_at).toLocaleDateString(
                      lang === 'fa' ? 'fa-IR' : 'en-US'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="db-section-card">
          <h3>{strings.recent_games}</h3>
          <table className="db-table">
            <tbody>
              {(stats.games?.recent || []).map((g) => (
                <tr key={g.survival_game_id}>
                  <td className="gold-text">
                    {g.score} {strings.points_short}
                  </td>
                  <td className="date-col">
                    {new Date(g.created_at).toLocaleDateString(
                      lang === 'fa' ? 'fa-IR' : 'en-US'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
