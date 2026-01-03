import { useState, useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useApp } from '../context/AppContext';

// ============================================================================
// INSIGHTS PAGE - Analytics and trends
// ============================================================================

const COLORS = ['#00A3E0', '#003D5B', '#E67E22', '#00B894', '#9B59B6', '#E74C3C', '#F39C12', '#1ABC9C'];

export default function InsightsPage() {
  const { 
    t, language, transactions, categories, subcategories, formatAmount 
  } = useApp();
  
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [activeTab, setActiveTab] = useState('overview'); // overview, categories, merchants

  // ============================================================================
  // DATA CALCULATIONS
  // ============================================================================

  // Filter transactions for selected year
  const yearTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const d = new Date(tx.date);
      return d.getFullYear() === selectedYear;
    });
  }, [transactions, selectedYear]);

  // Previous year transactions (for comparison)
  const prevYearTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const d = new Date(tx.date);
      return d.getFullYear() === selectedYear - 1;
    });
  }, [transactions, selectedYear]);

  // KPI calculations
  const yearTotal = yearTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const prevYearTotal = prevYearTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const yearDiff = prevYearTotal > 0 
    ? ((yearTotal - prevYearTotal) / prevYearTotal) * 100 
    : 0;
  const avgMonthly = yearTotal / 12;
  const txCount = yearTransactions.length;

  // ============================================================================
  // MONTHLY BREAKDOWN
  // ============================================================================
  const monthlyData = useMemo(() => {
    const monthNames = language === 'fr'
      ? ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const data = monthNames.map((name, index) => {
      const thisYearTotal = yearTransactions
        .filter(tx => new Date(tx.date).getMonth() === index)
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      const prevYearTotal = prevYearTransactions
        .filter(tx => new Date(tx.date).getMonth() === index)
        .reduce((sum, tx) => sum + tx.amount, 0);

      return {
        name,
        [selectedYear]: Math.round(thisYearTotal),
        [selectedYear - 1]: Math.round(prevYearTotal),
      };
    });

    return data;
  }, [yearTransactions, prevYearTransactions, selectedYear, language]);

  // ============================================================================
  // CATEGORY BREAKDOWN
  // ============================================================================
  const categoryData = useMemo(() => {
    const totals = {};

    yearTransactions.forEach(tx => {
      const sub = subcategories.find(s => s.id === tx.subcategory_id);
      if (sub) {
        const cat = categories.find(c => c.id === sub.category_id);
        if (cat) {
          const key = cat.id;
          if (!totals[key]) {
            totals[key] = {
              id: cat.id,
              name: language === 'fr' ? cat.name_fr : cat.name_en,
              color: cat.color,
              total: 0,
              count: 0,
            };
          }
          totals[key].total += tx.amount;
          totals[key].count += 1;
        }
      }
    });

    return Object.values(totals)
      .sort((a, b) => b.total - a.total);
  }, [yearTransactions, categories, subcategories, language]);

  // Top 6 for pie chart
  const pieData = useMemo(() => {
    const top6 = categoryData.slice(0, 6);
    const others = categoryData.slice(6);
    const othersTotal = others.reduce((sum, c) => sum + c.total, 0);
    
    if (othersTotal > 0) {
      top6.push({
        id: 'others',
        name: t('Autres', 'Others'),
        color: '#BDC3C7',
        total: othersTotal,
      });
    }
    
    return top6;
  }, [categoryData, t]);

  // ============================================================================
  // TOP MERCHANTS
  // ============================================================================
  const merchantData = useMemo(() => {
    const totals = {};

    yearTransactions.forEach(tx => {
      const key = tx.description.toLowerCase().trim();
      if (!totals[key]) {
        totals[key] = {
          name: tx.description,
          total: 0,
          count: 0,
        };
      }
      totals[key].total += tx.amount;
      totals[key].count += 1;
    });

    return Object.values(totals)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [yearTransactions]);

  // ============================================================================
  // CATEGORY TRENDS (monthly per category)
  // ============================================================================
  const categoryTrends = useMemo(() => {
    const monthNames = language === 'fr'
      ? ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
      : ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

    // Get top 4 categories
    const topCategories = categoryData.slice(0, 4);
    
    const data = monthNames.map((name, monthIndex) => {
      const point = { name };
      
      topCategories.forEach(cat => {
        const monthTotal = yearTransactions
          .filter(tx => {
            const d = new Date(tx.date);
            if (d.getMonth() !== monthIndex) return false;
            const sub = subcategories.find(s => s.id === tx.subcategory_id);
            return sub && sub.category_id === cat.id;
          })
          .reduce((sum, tx) => sum + tx.amount, 0);
        
        point[cat.name] = Math.round(monthTotal);
      });

      return point;
    });

    return { data, categories: topCategories };
  }, [yearTransactions, categoryData, subcategories, language]);

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>{t('Analyses', 'Insights')}</h1>

      {/* Year selector */}
      <div style={styles.yearSelector}>
        <button 
          onClick={() => setSelectedYear(y => y - 1)} 
          style={styles.yearBtn}
        >
          ◀
        </button>
        <span style={styles.yearText}>{selectedYear}</span>
        <button 
          onClick={() => setSelectedYear(y => y + 1)} 
          style={{
            ...styles.yearBtn,
            opacity: selectedYear >= currentYear ? 0.3 : 1
          }}
          disabled={selectedYear >= currentYear}
        >
          ▶
        </button>
      </div>

      {/* Tab selector */}
      <div style={styles.tabs}>
        <button 
          onClick={() => setActiveTab('overview')}
          style={{
            ...styles.tab,
            ...(activeTab === 'overview' ? styles.tabActive : {})
          }}
        >
          📊 {t('Aperçu', 'Overview')}
        </button>
        <button 
          onClick={() => setActiveTab('categories')}
          style={{
            ...styles.tab,
            ...(activeTab === 'categories' ? styles.tabActive : {})
          }}
        >
          🏷️ {t('Catégories', 'Categories')}
        </button>
        <button 
          onClick={() => setActiveTab('merchants')}
          style={{
            ...styles.tab,
            ...(activeTab === 'merchants' ? styles.tabActive : {})
          }}
        >
          🏪 {t('Marchands', 'Merchants')}
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <>
          {/* KPI Cards */}
          <div style={styles.kpiGrid}>
            <div style={styles.kpiCard}>
              <span style={styles.kpiIcon}>💰</span>
              <div>
                <span style={styles.kpiLabel}>{t('Total annuel', 'Yearly total')}</span>
                <span style={styles.kpiValue}>{formatAmount(yearTotal)}</span>
              </div>
            </div>
            
            <div style={styles.kpiCard}>
              <span style={styles.kpiIcon}>{yearDiff <= 0 ? '📉' : '📈'}</span>
              <div>
                <span style={styles.kpiLabel}>vs {selectedYear - 1}</span>
                <span style={{
                  ...styles.kpiValue,
                  color: yearDiff <= 0 ? '#00B894' : '#E74C3C',
                  fontSize: '16px',
                }}>
                  {yearDiff > 0 ? '+' : ''}{yearDiff.toFixed(0)}%
                </span>
              </div>
            </div>

            <div style={styles.kpiCard}>
              <span style={styles.kpiIcon}>📅</span>
              <div>
                <span style={styles.kpiLabel}>{t('Moyenne/mois', 'Avg/month')}</span>
                <span style={styles.kpiValue}>{formatAmount(avgMonthly)}</span>
              </div>
            </div>

            <div style={styles.kpiCard}>
              <span style={styles.kpiIcon}>🧾</span>
              <div>
                <span style={styles.kpiLabel}>{t('Transactions', 'Transactions')}</span>
                <span style={styles.kpiValue}>{txCount}</span>
              </div>
            </div>
          </div>

          {/* Monthly comparison chart */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              📊 {t('Comparaison mensuelle', 'Monthly comparison')}
            </h2>
            <div style={styles.chartCard}>
              {yearTransactions.length === 0 ? (
                <p style={styles.emptyText}>{t('Aucune donnée', 'No data')}</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#636E72' }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#636E72' }}
                      tickFormatter={v => `${(v/1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(value) => [`€${value}`, '']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey={selectedYear} fill="#00A3E0" radius={[4, 4, 0, 0]} />
                    <Bar dataKey={selectedYear - 1} fill="#E1E8ED" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
              <div style={styles.legend}>
                <span style={styles.legendItem}>
                  <span style={{...styles.legendDot, backgroundColor: '#00A3E0'}} />
                  {selectedYear}
                </span>
                <span style={styles.legendItem}>
                  <span style={{...styles.legendDot, backgroundColor: '#E1E8ED'}} />
                  {selectedYear - 1}
                </span>
              </div>
            </div>
          </div>

          {/* Category pie chart */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              🥧 {t('Répartition des dépenses', 'Spending breakdown')}
            </h2>
            <div style={styles.chartCard}>
              {pieData.length === 0 ? (
                <p style={styles.emptyText}>{t('Aucune donnée', 'No data')}</p>
              ) : (
                <div style={styles.pieContainer}>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="total"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={40}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={entry.id} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [formatAmount(value), '']}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={styles.pieLegend}>
                    {pieData.map(cat => (
                      <div key={cat.id} style={styles.pieLegendItem}>
                        <span style={{...styles.pieLegendDot, backgroundColor: cat.color}} />
                        <span style={styles.pieLegendName}>{cat.name}</span>
                        <span style={styles.pieLegendValue}>{formatAmount(cat.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* CATEGORIES TAB */}
      {activeTab === 'categories' && (
        <>
          {/* Category ranking */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              🏆 {t('Classement des catégories', 'Category ranking')}
            </h2>
            <div style={styles.rankingList}>
              {categoryData.length === 0 ? (
                <p style={styles.emptyText}>{t('Aucune donnée', 'No data')}</p>
              ) : (
                categoryData.map((cat, index) => {
                  const percentage = yearTotal > 0 ? (cat.total / yearTotal) * 100 : 0;
                  return (
                    <div key={cat.id} style={styles.rankingRow}>
                      <span style={styles.rankNumber}>#{index + 1}</span>
                      <span style={{...styles.rankDot, backgroundColor: cat.color}} />
                      <div style={styles.rankInfo}>
                        <span style={styles.rankName}>{cat.name}</span>
                        <div style={styles.rankBarContainer}>
                          <div style={{
                            ...styles.rankBar,
                            width: `${percentage}%`,
                            backgroundColor: cat.color,
                          }} />
                        </div>
                      </div>
                      <div style={styles.rankRight}>
                        <span style={styles.rankAmount}>{formatAmount(cat.total)}</span>
                        <span style={styles.rankPercent}>{percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Category trends */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              📈 {t('Évolution par catégorie', 'Category trends')}
            </h2>
            <div style={styles.chartCard}>
              {categoryTrends.categories.length === 0 ? (
                <p style={styles.emptyText}>{t('Aucune donnée', 'No data')}</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={categoryTrends.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#636E72' }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#636E72' }}
                        tickFormatter={v => `${(v/1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        formatter={(value) => [`€${value}`, '']}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                      />
                      {categoryTrends.categories.map((cat, i) => (
                        <Line 
                          key={cat.id}
                          type="monotone" 
                          dataKey={cat.name} 
                          stroke={cat.color}
                          strokeWidth={2}
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                  <div style={styles.legend}>
                    {categoryTrends.categories.map(cat => (
                      <span key={cat.id} style={styles.legendItem}>
                        <span style={{...styles.legendDot, backgroundColor: cat.color}} />
                        {cat.name}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* MERCHANTS TAB */}
      {activeTab === 'merchants' && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            🏪 {t('Top marchands', 'Top merchants')}
          </h2>
          <div style={styles.merchantList}>
            {merchantData.length === 0 ? (
              <p style={styles.emptyText}>{t('Aucune donnée', 'No data')}</p>
            ) : (
              merchantData.map((merchant, index) => {
                const maxTotal = merchantData[0]?.total || 1;
                const widthPercent = (merchant.total / maxTotal) * 100;
                
                return (
                  <div key={merchant.name} style={styles.merchantRow}>
                    <span style={styles.merchantRank}>#{index + 1}</span>
                    <div style={styles.merchantInfo}>
                      <span style={styles.merchantName}>{merchant.name}</span>
                      <div style={styles.merchantBarContainer}>
                        <div style={{
                          ...styles.merchantBar,
                          width: `${widthPercent}%`,
                        }} />
                      </div>
                      <span style={styles.merchantCount}>
                        {merchant.count} {t('transactions', 'transactions')}
                      </span>
                    </div>
                    <span style={styles.merchantAmount}>{formatAmount(merchant.total)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px 16px 100px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: '16px',
  },
  yearSelector: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    marginBottom: '16px',
  },
  yearBtn: {
    width: '36px',
    height: '36px',
    border: '1px solid #E1E8ED',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#2D3436',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearText: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#2D3436',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    overflowX: 'auto',
  },
  tab: {
    padding: '10px 16px',
    border: '1px solid #E1E8ED',
    borderRadius: '20px',
    backgroundColor: 'white',
    fontSize: '13px',
    color: '#636E72',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  tabActive: {
    backgroundColor: '#00A3E0',
    borderColor: '#00A3E0',
    color: 'white',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '24px',
  },
  kpiCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '14px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  kpiIcon: {
    fontSize: '22px',
  },
  kpiLabel: {
    display: 'block',
    fontSize: '11px',
    color: '#636E72',
    marginBottom: '2px',
  },
  kpiValue: {
    display: 'block',
    fontSize: '16px',
    fontWeight: '700',
    color: '#2D3436',
  },
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: '12px',
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  legend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    marginTop: '12px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#636E72',
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '3px',
  },
  pieContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  pieLegend: {
    width: '100%',
    marginTop: '12px',
  },
  pieLegendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 0',
    borderBottom: '1px solid #F0F0F0',
  },
  pieLegendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '3px',
    flexShrink: 0,
  },
  pieLegendName: {
    flex: 1,
    fontSize: '13px',
    color: '#2D3436',
  },
  pieLegendValue: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#2D3436',
  },
  rankingList: {
    backgroundColor: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  rankingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 16px',
    borderBottom: '1px solid #F0F0F0',
  },
  rankNumber: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#00A3E0',
    width: '28px',
  },
  rankDot: {
    width: '10px',
    height: '10px',
    borderRadius: '3px',
    flexShrink: 0,
  },
  rankInfo: {
    flex: 1,
    minWidth: 0,
  },
  rankName: {
    display: 'block',
    fontSize: '14px',
    color: '#2D3436',
    marginBottom: '4px',
  },
  rankBarContainer: {
    height: '6px',
    backgroundColor: '#F0F0F0',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  rankBar: {
    height: '100%',
    borderRadius: '3px',
  },
  rankRight: {
    textAlign: 'right',
    flexShrink: 0,
  },
  rankAmount: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#2D3436',
  },
  rankPercent: {
    display: 'block',
    fontSize: '11px',
    color: '#636E72',
  },
  merchantList: {
    backgroundColor: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  merchantRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    borderBottom: '1px solid #F0F0F0',
  },
  merchantRank: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#00A3E0',
    width: '28px',
  },
  merchantInfo: {
    flex: 1,
    minWidth: 0,
  },
  merchantName: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#2D3436',
    marginBottom: '4px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  merchantBarContainer: {
    height: '6px',
    backgroundColor: '#F0F0F0',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '4px',
  },
  merchantBar: {
    height: '100%',
    borderRadius: '3px',
    backgroundColor: '#00A3E0',
  },
  merchantCount: {
    fontSize: '11px',
    color: '#636E72',
  },
  merchantAmount: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2D3436',
    flexShrink: 0,
  },
  emptyText: {
    color: '#636E72',
    textAlign: 'center',
    padding: '20px',
    fontStyle: 'italic',
  },
};