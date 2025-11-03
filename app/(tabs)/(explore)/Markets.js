import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  Button,
  BasePagerView,
} from '@/components/ui';
import { useRouter } from 'expo-router';
import ContainerView from '@/components/ContainerView';
import { useMarketSnapshot } from '@/hooks/useMarketSnapshot';
import { useTradingData } from '@/hooks/useTradingData';
import { useMockAccountBalance } from '@/hooks/useMockAccountBalance';
import {
  TradingViewChart,
  OrderEntry,
  TickerSelector,
  PositionTracker,
  TradeHistory,
  OrderBook,
  AccountBalance,
} from '@/components/trading';
import { useTheme } from '@/contexts/ThemeContext';
import { withOpacity } from '@/theme/utils';
import SectionTitle from '@/components/SectionTitle';

const { width } = Dimensions.get('window');

const LEDGER_TABLE_CONFIG = {
  positions: {
    label: 'Positions',
    emptyText: 'No positions yet.',
    columns: [
      {
        key: 'symbol',
        label: 'Symbol',
        accessor: (row) => row.symbol ?? '-',
      },
      {
        key: 'long',
        label: 'Long',
        accessor: (row) => row.long ?? 0,
      },
      {
        key: 'short',
        label: 'Short',
        accessor: (row) => row.short ?? 0,
      },
      {
        key: 'net',
        label: 'Net',
        accessor: (row) => row.net ?? 0,
      },
      {
        key: 'pnl',
        label: 'P&L',
        accessor: (row) => row.pnl ?? 0,
      },
    ],
  },
  openOrders: {
    label: 'Open orders',
    emptyText: 'No open orders.',
    columns: [
      { key: 'id', label: 'Order ID', accessor: (row) => row.id ?? '-' },
      { key: 'symbol', label: 'Symbol', accessor: (row) => row.symbol ?? '-' },
      { key: 'side', label: 'Side', accessor: (row) => row.side ?? '-' },
      {
        key: 'quantity',
        label: 'Quantity',
        accessor: (row) => row.quantity ?? '-',
      },
      {
        key: 'price',
        label: 'Price',
        accessor: (row) => row.price ?? '-',
      },
      {
        key: 'status',
        label: 'Status',
        accessor: (row) => row.status ?? '-',
      },
    ],
  },
  orderHistory: {
    label: 'Order history',
    emptyText: 'No order history yet.',
    columns: [
      { key: 'id', label: 'Order ID', accessor: (row) => row.id ?? '-' },
      { key: 'symbol', label: 'Symbol', accessor: (row) => row.symbol ?? '-' },
      { key: 'side', label: 'Side', accessor: (row) => row.side ?? '-' },
      {
        key: 'quantity',
        label: 'Quantity',
        accessor: (row) => row.quantity ?? '-',
      },
      {
        key: 'filled',
        label: 'Filled',
        accessor: (row) => row.filled ?? '-',
      },
      {
        key: 'status',
        label: 'Status',
        accessor: (row) => row.status ?? '-',
      },
    ],
  },
  tradeHistory: {
    label: 'Trade history',
    emptyText: 'No trade history yet.',
    columns: [
      {
        key: 'executedAt',
        label: 'Time',
        accessor: (row) => row.executedAt ?? '-',
      },
      { key: 'symbol', label: 'Symbol', accessor: (row) => row.symbol ?? '-' },
      { key: 'side', label: 'Side', accessor: (row) => row.side ?? '-' },
      {
        key: 'quantity',
        label: 'Quantity',
        accessor: (row) => row.quantity ?? '-',
      },
      {
        key: 'price',
        label: 'Price',
        accessor: (row) => row.price ?? '-',
      },
      { key: 'fee', label: 'Fee', accessor: (row) => row.fee ?? '-' },
    ],
  },
  transactionHistory: {
    label: 'Transaction history',
    emptyText: 'No transactions yet.',
    columns: [
      {
        key: 'occurredAt',
        label: 'Time',
        accessor: (row) => row.occurredAt ?? '-',
      },
      {
        key: 'category',
        label: 'Category',
        accessor: (row) => row.category ?? row.type ?? '-',
      },
      {
        key: 'amount',
        label: 'Amount',
        accessor: (row) => row.amount ?? '-',
      },
      {
        key: 'balance',
        label: 'Balance',
        accessor: (row) => row.balance ?? '-',
      },
      {
        key: 'description',
        label: 'Description',
        accessor: (row) => row.description ?? '-',
      },
    ],
  },
  depositsWithdrawals: {
    label: 'Deposits & withdrawals',
    emptyText: 'No deposits or withdrawals yet.',
    columns: [
      {
        key: 'occurredAt',
        label: 'Time',
        accessor: (row) => row.occurredAt ?? '-',
      },
      {
        key: 'category',
        label: 'Category',
        accessor: (row) => row.category ?? row.type ?? '-',
      },
      {
        key: 'amount',
        label: 'Amount',
        accessor: (row) => row.amount ?? '-',
      },
      {
        key: 'status',
        label: 'Status',
        accessor: (row) => row.status ?? '-',
      },
      {
        key: 'reference',
        label: 'Reference',
        accessor: (row) => row.reference ?? '-',
      },
    ],
  },
  assets: {
    label: 'Assets',
    emptyText: 'No assets allocated.',
    columns: [
      { key: 'symbol', label: 'Symbol', accessor: (row) => row.symbol ?? '-' },
      {
        key: 'quantity',
        label: 'Quantity',
        accessor: (row) => row.quantity ?? '-',
      },
      {
        key: 'value',
        label: 'Value',
        accessor: (row) => row.value ?? '-',
      },
      {
        key: 'allocation',
        label: 'Allocation',
        accessor: (row) => row.allocation ?? '-',
      },
    ],
  },
};

function TradingLedgerWidget({ data, styles, theme, isLoading, mode = 'paper' }) {
  const [activeTab, setActiveTab] = useState('positions');
  const tabData = useMemo(() => data ?? {}, [data]);

  const tabs = useMemo(() => {
    return Object.entries(LEDGER_TABLE_CONFIG).map(([key, config]) => {
      const rows = tabData[key] ?? [];
      const count = Array.isArray(rows) ? rows.length : 0;
      const showCount = key === 'positions' || key === 'openOrders';
      const label = showCount ? `${config.label} (${count})` : config.label;
      return { key, label, count };
    });
  }, [tabData]);

  const currentConfig =
    LEDGER_TABLE_CONFIG[activeTab] ?? LEDGER_TABLE_CONFIG.positions;
  const rows = tabData[activeTab] ?? [];

  return (
    <View style={styles.paperCard}>
      {isLoading && (
        <View style={styles.paperLoading}>
          <ActivityIndicator size="small" color={theme.colors.primary.DEFAULT} />
          <Text style={styles.paperLoadingText}>
            Loading {mode === 'real' ? 'real' : 'paper'} ledger...
          </Text>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.paperTabRow}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[
              styles.paperTabButton,
              activeTab === tab.key && styles.paperTabButtonActive,
            ]}
          >
            <Text
              style={[
                styles.paperTabText,
                activeTab === tab.key && {
                  color: theme.colors.primary.DEFAULT,
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {currentConfig ? (
        <View style={styles.paperTable}>
          <View style={styles.paperTableHeader}>
            {currentConfig.columns.map((column) => (
              <Text key={column.key} style={styles.paperTableHeaderText}>
                {column.label}
              </Text>
            ))}
          </View>

          {!isLoading && Array.isArray(rows) && rows.length > 0 ? (
            rows.map((row, index) => (
              <View
                key={row.id ?? `${activeTab}-${index}`}
                style={[
                  styles.paperTableRow,
                  index % 2 === 0 && styles.paperTableRowAlt,
                ]}
              >
                {currentConfig.columns.map((column) => (
                  <Text key={column.key} style={styles.paperTableCell}>
                    {column.accessor(row)}
                  </Text>
                ))}
              </View>
            ))
          ) : (
            !isLoading && (
              <View style={styles.paperEmptyState}>
                <Text style={styles.paperEmptyText}>
                  {currentConfig.emptyText}
                </Text>
              </View>
            )
          )}
        </View>
      ) : null}
    </View>
  );
}

export default function MarketsScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [ledgerType, setLedgerType] = useState('paper');
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState('ALL');
  const { assets, isLoading: pricesLoading } = useMarketSnapshot();
  const {
    trades,
    positions,
    stats,
    placeOrder,
    closePosition,
    isPlacingOrder,
    isClosingPosition,
    ledger,
  } = useTradingData({
    ledgerType,
    ledgerAccountId: selectedLedgerAccount === 'ALL' ? null : selectedLedgerAccount,
  });

  const accountBalance = useMockAccountBalance();
  const ledgerAccounts = useMemo(
    () => ledger?.raw?.accounts ?? [],
    [ledger?.raw?.accounts],
  );

  useEffect(() => {
    if (selectedLedgerAccount === 'ALL') return;
    const exists = ledgerAccounts.some((account) => account.id === selectedLedgerAccount);
    if (!exists) {
      setSelectedLedgerAccount('ALL');
    }
  }, [ledgerAccounts, selectedLedgerAccount]);

  const ledgerTableData = useMemo(() => {
    const snapshot = ledger?.data ?? {};
    return {
      positions: snapshot.positions ?? [],
      openOrders: snapshot.openOrders ?? [],
      orderHistory: snapshot.orderHistory ?? [],
      tradeHistory: snapshot.trades ?? [],
      transactionHistory: snapshot.transactions ?? [],
      depositsWithdrawals: snapshot.depositsWithdrawals ?? [],
      assets: snapshot.assets ?? [],
    };
  }, [ledger]);

  const prices = useMemo(() => {
    const priceMap = {};
    assets.forEach((asset) => {
      if (asset?.symbol && asset?.price) {
        priceMap[asset.symbol] = asset.price;
      }
    });
    return priceMap;
  }, [assets]);

  const currentPrice = prices[selectedSymbol] || 0;

  const handlePlaceOrder = (order) => {
    Alert.alert(
      'Confirm Order',
      `Place ${order.side} order for ${order.amount} ${order.symbol} at ${
        order.type === 'MARKET' ? 'market price' : `$${order.price}`
      }?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => placeOrder({ ...order, symbol: selectedSymbol }),
        },
      ],
    );
  };

  const handleClosePosition = (position) => {
    Alert.alert(
      'Close Position',
      `Close your ${position.side} position on ${position.asset}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Close', style: 'destructive', onPress: () => closePosition(position) },
      ],
    );
  };

  const handleDeposit = () => {
    Alert.prompt(
      'Deposit Funds',
      'Enter amount to deposit (USD)',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deposit',
          onPress: (amount) => {
            const value = parseFloat(amount);
            if (value > 0) {
              accountBalance.deposit(value);
              Alert.alert('Success', `Deposited $${value.toFixed(2)}`);
            }
          },
        },
      ],
      'plain-text',
      '',
      'decimal-pad',
    );
  };

  const handleWithdraw = () => {
    Alert.prompt(
      'Withdraw Funds',
      'Enter amount to withdraw (USD)',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          onPress: (amount) => {
            const value = parseFloat(amount);
            if (value > 0) {
              try {
                accountBalance.withdraw(value);
                Alert.alert('Success', `Withdrew $${value.toFixed(2)}`);
              } catch (error) {
                Alert.alert('Error', error.message);
              }
            }
          },
        },
      ],
      'plain-text',
      '',
      'decimal-pad',
    );
  };

  // Define tabs with their content
  const tabs = [
    {
      key: 'trade',
      label: 'Trade',
      content: (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <TickerSelector
              selectedSymbol={selectedSymbol}
              onSelectSymbol={setSelectedSymbol}
              prices={prices}
            />
          </View>

          <View style={styles.section}>
            <TradingViewChart
              symbol={selectedSymbol}
              theme={isDark ? 'dark' : 'light'}
              height={400}
            />
          </View>

          <View style={styles.twoColumnRow}>
            <View style={styles.column}>
              <Text style={styles.sectionTitle}>Place Order</Text>
              <OrderEntry
                symbol={selectedSymbol}
                currentPrice={currentPrice}
                onPlaceOrder={handlePlaceOrder}
                isLoading={isPlacingOrder}
              />
            </View>
            <View style={styles.column}>
              <Text style={styles.sectionTitle}>Order Book</Text>
              <OrderBook
                currentPrice={currentPrice}
                isLoading={pricesLoading}
              />
            </View>
          </View>
        </ScrollView>
      ),
    },
    {
      key: 'positions',
      label: 'Positions',
      content: (
        <View style={styles.content}>
          <PositionTracker
            positions={positions}
            onClosePosition={handleClosePosition}
            isLoading={isClosingPosition}
          />
        </View>
      ),
    },
    {
      key: 'history',
      label: 'History',
      content: (
        <View style={styles.content}>
          <TradeHistory trades={trades} isLoading={false} />
        </View>
      ),
    },
    {
      key: 'account',
      label: 'Account',
      content: (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <AccountBalance
              balance={accountBalance.wallet}
              equity={accountBalance.equity}
              margin={accountBalance.margin}
              availableMargin={accountBalance.availableMargin}
              unrealizedPnl={accountBalance.unrealizedPnl}
              onDeposit={handleDeposit}
              onWithdraw={handleWithdraw}
            />

            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>Trading Statistics</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Total Trades</Text>
                  <Text style={styles.statValue}>{stats.totalTrades}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Win Rate</Text>
                  <Text
                    style={[
                      styles.statValue,
                      {
                        color:
                          stats.winRate >= 50
                            ? theme.colors.success.DEFAULT
                            : theme.colors.error.DEFAULT,
                      },
                    ]}
                  >
                    {stats.winRate.toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Total P&L</Text>
                  <Text
                    style={[
                      styles.statValue,
                      {
                        color:
                          stats.totalPnL >= 0
                            ? theme.colors.success.DEFAULT
                            : theme.colors.error.DEFAULT,
                      },
                    ]}
                  >
                    {stats.totalPnL >= 0 ? '+' : '-'}$
                    {Math.abs(stats.totalPnL).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Open Positions</Text>
                  <Text style={styles.statValue}>{stats.openPositions}</Text>
                </View>
              </View>
            </View>

            <View style={styles.paperFilters}>
              <View style={styles.paperFilterRow}>
                <Text style={styles.paperFilterLabel}>Mode</Text>
                <View style={styles.paperToggleGroup}>
                  {['paper', 'real'].map((type) => {
                    const isActive = ledgerType === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        onPress={() => {
                          setLedgerType(type);
                          setSelectedLedgerAccount('ALL');
                        }}
                        style={[
                          styles.paperToggleChip,
                          isActive && styles.paperToggleChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.paperToggleText,
                            isActive && {
                              color: theme.colors.primary.DEFAULT,
                            },
                          ]}
                        >
                          {type === 'paper' ? 'Paper' : 'Real'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.paperFilterRow}>
                <Text style={styles.paperFilterLabel}>Accounts</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.paperAccountScroll}
                >
                  <TouchableOpacity
                    onPress={() => setSelectedLedgerAccount('ALL')}
                    style={[
                      styles.paperAccountChip,
                      selectedLedgerAccount === 'ALL' &&
                        styles.paperAccountChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.paperAccountText,
                        selectedLedgerAccount === 'ALL' && {
                          color: theme.colors.primary.DEFAULT,
                        },
                      ]}
                    >
                      All accounts
                    </Text>
                  </TouchableOpacity>
                  {ledgerAccounts.map((account) => {
                    const isActive = selectedLedgerAccount === account.id;
                    return (
                      <TouchableOpacity
                        key={account.id}
                        onPress={() => setSelectedLedgerAccount(account.id)}
                        style={[
                          styles.paperAccountChip,
                          isActive && styles.paperAccountChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.paperAccountText,
                            isActive && {
                              color: theme.colors.primary.DEFAULT,
                            },
                          ]}
                        >
                          {account.label || 'Account'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            <TradingLedgerWidget
              data={ledgerTableData}
              styles={styles}
              theme={theme}
              isLoading={ledger?.isLoading}
              mode={ledgerType}
            />
          </View>
        </ScrollView>
      ),
    },
  ];

  return (
    <ContainerView>
      <View sx={{ alignSelf: 'flex-start', marginBottom: 3 }}>
        <SectionTitle>Trade</SectionTitle>
      </View>

      <BasePagerView
        tabs={tabs}
        initialPage={0}
        tabTextStyle={{ color: theme.colors.text.secondary }}
        activeTabTextStyle={{ color: theme.colors.accent }}
      />
    </ContainerView>
  );
}

const createStyles = (theme) => {
  const { colors } = theme;
  const divider = withOpacity(colors.border, 0.16);
  return {
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'start',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: divider,
    },
    headerLeft: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text.primary,
    },
    headerSubtitle: {
      fontSize: 13,
      color: colors.text.secondary,
      marginTop: 2,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderColor: colors.backgroundSecondary,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeButtonText: {
      fontSize: 20,
      color: withOpacity(colors.foreground, 0.6),
      fontWeight: '600',
    },
    tabBar: {
      flexDirection: 'row',
      paddingVertical: 12,
      gap: 8,
      borderBottomWidth: 1,
      borderBottomColor: divider,
    },
    tab: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 10,
      backgroundColor: withOpacity(colors.backgroundSecondary, 0.5),
    },
    tabActive: {
      backgroundColor: withOpacity(colors.primary.DEFAULT, 0.18),
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text.secondary,
    },
    tabTextActive: {
      color: colors.primary.DEFAULT,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      paddingBottom: 100,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text.secondary,
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    twoColumnRow: {
      flexDirection: width > 768 ? 'row' : 'column',
      gap: 16,
      marginBottom: 24,
    },
    column: {
      flex: 1,
    },
    statsCard: {
      backgroundColor: withOpacity(colors.card.DEFAULT, 0.92),
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: divider,
      marginTop: 20,
    },
    statsTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text.primary,
      marginBottom: 16,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    statItem: {
      width: '50%',
      marginBottom: 16,
    },
    statLabel: {
      fontSize: 11,
      color: colors.text.secondary,
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    statValue: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text.primary,
    },
    paperCard: {
      marginTop: 24,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: divider,
      backgroundColor: withOpacity(colors.card.DEFAULT, 0.92),
      overflow: 'hidden',
    },
    paperLoading: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    paperLoadingText: {
      fontSize: 13,
      color: colors.text.secondary,
      fontWeight: '600',
    },
    paperFilters: {
      marginTop: 24,
      gap: 16,
    },
    paperFilterRow: {
      gap: 8,
    },
    paperFilterLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    paperToggleGroup: {
      flexDirection: 'row',
      gap: 10,
    },
    paperToggleChip: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 14,
      backgroundColor: withOpacity(colors.backgroundSecondary, 0.45),
    },
    paperToggleChipActive: {
      backgroundColor: withOpacity(colors.primary.DEFAULT, 0.18),
      borderWidth: 1,
      borderColor: withOpacity(colors.primary.DEFAULT, 0.4),
    },
    paperToggleText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text.secondary,
    },
    paperAccountScroll: {
      flexDirection: 'row',
      gap: 10,
      paddingRight: 6,
    },
    paperAccountChip: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 14,
      backgroundColor: withOpacity(colors.backgroundSecondary, 0.32),
    },
    paperAccountChipActive: {
      backgroundColor: withOpacity(colors.primary.DEFAULT, 0.18),
      borderWidth: 1,
      borderColor: withOpacity(colors.primary.DEFAULT, 0.4),
    },
    paperAccountText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text.secondary,
    },
    paperTabRow: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
    },
    paperTabButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: withOpacity(colors.backgroundSecondary, 0.55),
    },
    paperTabButtonActive: {
      backgroundColor: withOpacity(colors.primary.DEFAULT, 0.18),
    },
    paperTabText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text.secondary,
    },
    paperTable: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    paperTableHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: divider,
    },
    paperTableHeaderText: {
      flex: 1,
      fontSize: 12,
      fontWeight: '700',
      color: colors.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    paperTableRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
      paddingVertical: 12,
    },
    paperTableRowAlt: {
      backgroundColor: withOpacity(colors.backgroundSecondary, 0.08),
      borderRadius: 12,
    },
    paperTableCell: {
      flex: 1,
      fontSize: 13,
      fontWeight: '500',
      color: colors.text.primary,
    },
    paperEmptyState: {
      paddingVertical: 24,
      alignItems: 'center',
    },
    paperEmptyText: {
      fontSize: 13,
      color: colors.text.secondary,
    },
  };
};
