import { useState, useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useApp } from '../context/AppContext';

// ============================================================================
// INSIGHTS PAGE - Analytics and trends with configurable options
// ============================================================================

const COLORS = ['#00A3E0', '#003D5B', '#E67E22', '#00B894', '#9B59B6', '#E74C3C', '#F39C12', '#1ABC9C', '#3498DB', '#2ECC71'];
const YEAR_COLORS = {
  0: '#00A3E0', // Current/selected year
  1: '#003D5B',
  2: '#E67E22',
  3: '#00B894',
  4: '#9B59B6',
};

export default function InsightsPage() {
  const { 
    t, language, transactions, categories, subcategories, accounts, formatAmount 
  } = useApp();
  
  const currentYear = new Date().getFullYear();
  
  // ============================================================================
  // STATE
  // ============================================================================
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [activeTab, setActiveTab] = useState('overview');
  const [showSettings, setShowSettings] = useState(false);
  
  // Settings/Options
  const [yearsToCompare, setYearsToCompare] = useState(2); // 1-5 years
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showMonthlyChart, setShowMonthlyChart] = useState(true);
  const [showCategoryTrends, setShowCategoryTrends] = useState(true);
  const [showKPIs, setShowKPIs] = useState(true);
  const [chartType, setChartType] = useState('bar'); // 'bar' or 'line'

  // ============================================================================
  // AVAILABLE YEARS
  // ============================================================================
  const availableYears = useMemo(() => {
    const years = new Set();
    transactions.forEach(tx => {
      const year = new Date(tx.date).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  // ============================================================================
  // FILTERED TRANSACTIONS
  // ============================================================================
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Filter by account
      if (selectedAccount !== 'all' && tx.account_id !== selectedAccount) {
        return false;
      }
      // Filter by category
      if (selectedCategory !== 'all') {
        const sub = subcategories.find(s => s.id === tx.subcategory_id);
        if (!sub || sub.category_id !== selectedCategory) {
          return false;
        }
      }
      return true;
    });
  }, [transactions, selectedAccount, selectedCategory, subcategories]);

  // ============================================================================
  // TRANSACTIONS BY YEAR (for comparison)
  // ============================================================================
  const transactionsByYear = useMemo(() => {
    const result = {};
    for (let i = 0; i < yearsToCompare; i++) {
      const year = selectedYear - i;
      result[year] = filteredTransactions.filter(tx => {
        const d = new Date(tx.date);
        return d.getFullYear() === year;
      });
    }
    return result;
  }, [filteredTransactions, selectedYear, yearsToCompare]);

  // Current year transactions (for category breakdowns etc)
  const yearTransactions = transactionsByYear[selectedYear] || [];

  // ============================================================================
  // KPI CALCULATIONS
  // ============================================================================
  const kpiData = useMemo(() => {
    const years = Object.keys(transactionsByYear).map(Number).sort((a, b) => b - a);
    const currentYearTx = transactionsByYear[years[0]] || [];
    const prevYearTx = transactionsByYear[years[1]] || [];
    
    const currentTotal = currentYearTx.reduce((sum, tx) => sum + tx.amount, 0);
    const prevTotal = prevYearTx.reduce((sum, tx) => sum + tx.amount, 0);
    const yearDiff = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0;
    
    // Current month stats
    const now = new Date();
    const currentMonthTx = currentYearTx.filter(tx => {
      const d = new Date(tx.date);
      return d.getMonth() === now.getMonth();
    });
    const currentMonthTotal = currentMonthTx.reduce((sum, tx) => sum + tx.amount, 0);
    
    // Average monthly (only count months with data)
    const monthsWithData = new Set(currentYearTx.map(tx => new Date(tx.date).getMonth())).size;
    const avgMonthly = monthsWithData > 0 ? currentTotal / monthsWithData : 0;

    return {
      yearTotal: currentTotal,
      yearDiff,
      avgMonthly,
      txCount: currentYearTx.length,
      currentMonthTotal,
      currentMonthTxCount: currentMonthTx.length,
    };
  }, [transactionsByYear]);

  // ============================================================================
  // MONTHLY DATA (multi-year)
  // ============================================================================
  const monthlyData = useMemo(() => {
    const monthNames = language === 'fr'
      ? ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const years = Object.keys(transactionsByYear).map(Number).sort((a, b) => b - a);

    const data = monthNames.map((name, monthIndex) => {
      const point = { name };
      
      years.forEach(year => {
        const monthTotal = (transactionsByYear[year] || [])
          .filter(tx => new Date(tx.date).getMonth() === monthIndex)
          .reduce((sum, tx) => sum + tx.amount, 0);
        point[year] = Math.round(monthTotal);
      });

      return point;
    });

    return { data, years };
  }, [transactionsByYear, language]);

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

    return Object.values(totals).sort((a, b) => b.total - a.total);
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
      .slice(0, 15);
  }, [yearTransactions]);

  // ============================================================================
  // CATEGORY TRENDS (monthly per category)
  // ============================================================================
  const categoryTrends = useMemo(() => {
    const monthNames = language === 'fr'
      ? ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
      : ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

    // Get top 5 categories
    const topCategories = categoryData.slice(0, 5);
    
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
      <div style={styles.headerRow}>
        <h1 style={styles.title}>{t('Analyses', 'Insights')}</h1>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          style={{
            ...styles.settingsBtn,
            backgroundColor: showSettings ? '#00A3E0' : 'white',
            color: showSettings ? 'white' : '#2D3436',
          }}
        >
          ⚙️
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div style={styles.settingsPanel}>
          <h3 style={styles.settingsTitle}>{t('Options', 'Options')}</h3>
          
          {/* Years to compare */}
          <div style={styles.settingRow}>
            <span style={styles.settingLabel}>{t('Années à comparer', 'Years to compare')}</span>
            <div style={styles.chipGroup}>
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setYearsToCompare(n)}
                  style={{
                    ...styles.chip,
                    ...(yearsToCompare === n ? styles.chipActive : {}),
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Chart type */}
          <div style={styles.settingRow}>
            <span style={styles.settingLabel}>{t('Type de graphique', 'Chart type')}</span>
            <div style={styles.chipGroup}>
              <button
                onClick={() => setChartType('bar')}
                style={{
                  ...styles.chip,
                  ...(chartType === 'bar' ? styles.chipActive : {}),
                }}
              >
                📊 {t('Barres', 'Bar')}
              </button>
              <button
                onClick={() => setChartType('line')}
                style={{
                  ...styles.chip,
                  ...(chartType === 'line' ? styles.chipActive : {}),
                }}
              >
                📈 {t('Lignes', 'Line')}
              </button>
            </div>
          </div>

          {/* Filter by account */}
          <div style={styles.settingRow}>
            <span style={styles.settingLabel}>{t('Compte', 'Account')}</span>
            <select
              value={selectedAccount}
              onChange={e => setSelectedAccount(e.target.value)}
              style={styles.select}
            >
              <option value="all">{t('Tous les comptes', 'All accounts')}</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>

          {/* Filter by category */}
          <div style={styles.settingRow}>
            <span style={styles.settingLabel}>{t('Catégorie', 'Category')}</span>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={styles.select}
            >
              <option value="all">{t('Toutes les catégories', 'All categories')}</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {language === 'fr' ? cat.name_fr : cat.name_en}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle sections */}
          <div style={styles.settingRow}>
            <span style={styles.settingLabel}>{t('Afficher', 'Show')}</span>
            <div style={styles.toggleGroup}>
              <label style={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={showKPIs}
                  onChange={e => setShowKPIs(e.target.checked)}
                />
                KPIs
              </label>
              <label style={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={showMonthlyChart}
                  onChange={e => setShowMonthlyChart(e.target.checked)}
                />
                {t('Mensuel', 'Monthly')}
              </label>
              <label style={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={showCategoryTrends}
                  onChange={e => setShowCategoryTrends(e.target.checked)}
                />
                {t('Tendances', 'Trends')}
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Active filters indicator */}
      {(selectedAccount !== 'all' || selectedCategory !== 'all') && (
        <div style={styles.activeFilters}>
          {selectedAccount !== 'all' && (
            <span style={styles.filterTag}>
              🏦 {accounts.find(a => a.id === selectedAccount)?.name}
              <button onClick={() => setSelectedAccount('all')} style={styles.filterClose}>✕</button>
            </span>
          )}
          {selectedCategory !== 'all' && (
            <span style={styles.filterTag}>
              🏷️ {language === 'fr' 
                ? categories.find(c => c.id === selectedCategory)?.name_fr
                : categories.find(c => c.id === selectedCategory)?.name_en}
              <button onClick={() => setSelectedCategory('all')} style={styles.filterClose}>✕</button>
            </span>
          )}
        </div>
      )}

      {/* Year selector */}
      <div style={styles.yearSelector}>
        <button 
          onClick={() => setSelectedYear(y => y - 1)} 
          style={styles.yearBtn}
          disabled={!availableYears.includes(selectedYear - 1)}
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
          🏪 {t('Bénéficiaires', 'Merchants')}
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <>
          {/* KPI Cards */}
          {showKPIs && (
            <div style={styles.kpiGrid}>
              <div style={styles.kpiCard}>
                <span style={styles.kpiIcon}>💰</span>
                <div>
                  <span style={styles.kpiLabel}>{t('Total', 'Total')} {selectedYear}</span>
                  <span style={styles.kpiValue}>{formatAmount(kpiData.yearTotal)}</span>
                </div>
              </div>
              
              <div style={styles.kpiCard}>
                <span style={styles.kpiIcon}>{kpiData.yearDiff <= 0 ? '📉' : '📈'}</span>
                <div>
                  <span style={styles.kpiLabel}>vs {selectedYear - 1}</span>
                  <span style={{
                    ...styles.kpiValue,
                    color: kpiData.yearDiff <= 0 ? '#00B894' : '#E74C3C',
                    fontSize: '16px',
                  }}>
                    {kpiData.yearDiff > 0 ? '+' : ''}{kpiData.yearDiff.toFixed(0)}%
                  </span>
                </div>
              </div>

              <div style={styles.kpiCard}>
                <span style={styles.kpiIcon}>📅</span>
                <div>
                  <span style={styles.kpiLabel}>{t('Moyenne/mois', 'Avg/month')}</span>
                  <span style={styles.kpiValue}>{formatAmount(kpiData.avgMonthly)}</span>
                </div>
              </div>

              <div style={styles.kpiCard}>
                <span style={styles.kpiIcon}>🧾</span>
                <div>
                  <span style={styles.kpiLabel}>{t('Transactions', 'Transactions')}</span>
                  <span style={styles.kpiValue}>{kpiData.txCount}</span>
                </div>
              </div>
            </div>
          )}

          {/* Monthly comparison chart (multi-year) */}
          {showMonthlyChart && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>
                📊 {t('Comparaison mensuelle', 'Monthly comparison')} 
                <span style={styles.sectionSubtitle}>
                  ({yearsToCompare} {t('ans', 'years')})
                </span>
              </h2>
              <div style={styles.chartCard}>
                {yearTransactions.length === 0 ? (
                  <p style={styles.emptyText}>{t('Aucune donnée', 'No data')}</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={220}>
                      {chartType === 'bar' ? (
                        <BarChart data={monthlyData.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 10 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                          <Tooltip 
                            formatter={(value) => formatAmount(value)}
                            contentStyle={{ fontSize: '12px' }}
                          />
                          {monthlyData.years.map((year, index) => (
                            <Bar 
                              key={year} 
                              dataKey={year} 
                              fill={YEAR_COLORS[index] || COLORS[index % COLORS.length]}
                              radius={[2, 2, 0, 0]}
                            />
                          ))}
                        </BarChart>
                      ) : (
                        <LineChart data={monthlyData.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 10 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                          <Tooltip 
                            formatter={(value) => formatAmount(value)}
                            contentStyle={{ fontSize: '12px' }}
                          />
                          {monthlyData.years.map((year, index) => (
                            <Line 
                              key={year} 
                              type="monotone"
                              dataKey={year} 
                              stroke={YEAR_COLORS[index] || COLORS[index % COLORS.length]}
                              strokeWidth={2}
                              dot={{ r: 3 }}
                            />
                          ))}
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                    <div style={styles.legend}>
                      {monthlyData.years.map((year, index) => (
                        <span key={year} style={styles.legendItem}>
                          <span style={{
                            ...styles.legendDot,
                            backgroundColor: YEAR_COLORS[index] || COLORS[index % COLORS.length],
                          }} />
                          {year}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Category trends */}
          {showCategoryTrends && categoryTrends.categories.length > 0 && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>
                📈 {t('Tendances par catégorie', 'Category trends')}
              </h2>
              <div style={styles.chartCard}>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={categoryTrends.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                    <Tooltip 
                      formatter={(value) => formatAmount(value)}
                      contentStyle={{ fontSize: '12px' }}
                    />
                    {categoryTrends.categories.map((cat, index) => (
                      <Line 
                        key={cat.id}
                        type="monotone"
                        dataKey={cat.name}
                        stroke={cat.color || COLORS[index % COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 2 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
                <div style={styles.legend}>
                  {categoryTrends.categories.map((cat, index) => (
                    <span key={cat.id} style={styles.legendItem}>
                      <span style={{
                        ...styles.legendDot,
                        backgroundColor: cat.color || COLORS[index % COLORS.length],
                      }} />
                      {cat.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* CATEGORIES TAB */}
      {activeTab === 'categories' && (
        <>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>🥧 {t('Répartition', 'Breakdown')}</h2>
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
                          <Cell key={index} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatAmount(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={styles.pieLegend}>
                    {pieData.map((cat, index) => (
                      <div key={index} style={styles.pieLegendItem}>
                        <span style={{
                          ...styles.pieLegendDot,
                          backgroundColor: cat.color || COLORS[index % COLORS.length],
                        }} />
                        <span style={styles.pieLegendName}>{cat.name}</span>
                        <span style={styles.pieLegendValue}>{formatAmount(cat.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>🏆 {t('Classement', 'Ranking')}</h2>
            <div style={styles.rankingList}>
              {categoryData.length === 0 ? (
                <p style={styles.emptyText}>{t('Aucune donnée', 'No data')}</p>
              ) : (
                categoryData.map((cat, index) => {
                  const percent = kpiData.yearTotal > 0 
                    ? (cat.total / kpiData.yearTotal * 100).toFixed(1) 
                    : 0;
                  const maxTotal = categoryData[0]?.total || 1;
                  const widthPercent = (cat.total / maxTotal) * 100;
                  
                  return (
                    <div key={cat.id} style={styles.rankingRow}>
                      <span style={styles.rankNumber}>#{index + 1}</span>
                      <span style={{
                        ...styles.rankDot,
                        backgroundColor: cat.color || COLORS[index % COLORS.length],
                      }} />
                      <div style={styles.rankInfo}>
                        <span style={styles.rankName}>{cat.name}</span>
                        <div style={styles.rankBarContainer}>
                          <div style={{
                            ...styles.rankBar,
                            width: `${widthPercent}%`,
                            backgroundColor: cat.color || COLORS[index % COLORS.length],
                          }} />
                        </div>
                      </div>
                      <div style={styles.rankRight}>
                        <span style={styles.rankAmount}>{formatAmount(cat.total)}</span>
                        <span style={styles.rankPercent}>{percent}%</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {/* MERCHANTS TAB */}
      {activeTab === 'merchants' && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            🏪 Top {t('Bénéficiaires', 'Merchants')} {selectedYear}
          </h2>
          <div style={styles.merchantList}>
            {merchantData.length === 0 ? (
              <p style={styles.emptyText}>{t('Aucune donnée', 'No data')}</p>
            ) : (
              merchantData.map((merchant, index) => {
                const maxTotal = merchantData[0]?.total || 1;
                const widthPercent = (merchant.total / maxTotal) * 100;
                
                return (
                  <div key={index} style={styles.merchantRow}>
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
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#2D3436',
    margin: 0,
  },
  settingsBtn: {
    width: '40px',
    height: '40px',
    border: '1px solid #E1E8ED',
    borderRadius: '10px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsPanel: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  settingsTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2D3436',
    marginTop: 0,
    marginBottom: '12px',
  },
  settingRow: {
    marginBottom: '12px',
  },
  settingLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#636E72',
    marginBottom: '6px',
  },
  chipGroup: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  chip: {
    padding: '6px 12px',
    border: '1px solid #E1E8ED',
    borderRadius: '16px',
    backgroundColor: 'white',
    fontSize: '12px',
    color: '#636E72',
    cursor: 'pointer',
  },
  chipActive: {
    backgroundColor: '#00A3E0',
    borderColor: '#00A3E0',
    color: 'white',
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #E1E8ED',
    borderRadius: '8px',
    fontSize: '13px',
    backgroundColor: 'white',
  },
  toggleGroup: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  toggleLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    color: '#2D3436',
    cursor: 'pointer',
  },
  activeFilters: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '12px',
  },
  filterTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    backgroundColor: '#E8F4FD',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#00A3E0',
  },
  filterClose: {
    background: 'none',
    border: 'none',
    color: '#00A3E0',
    cursor: 'pointer',
    padding: '0 2px',
    fontSize: '12px',
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
  sectionSubtitle: {
    fontSize: '12px',
    fontWeight: '400',
    color: '#636E72',
    marginLeft: '8px',
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
    gap: '12px',
    marginTop: '12px',
    flexWrap: 'wrap',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
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