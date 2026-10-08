import React, { useState } from 'react';
import SidebarNav from './SidebarNav';
import {
  Search,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Shield,
  Layers,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Plus,
  ArrowLeftRight,
  LayoutGrid,
  Landmark,
  Receipt,
  FileText,
  Settings,
  X,
  LogOut,
  Menu,
} from 'lucide-react';

export default function TransactionsPage({
  transactions = [],
  currentUser = null,
  wallet = null,
  safiConfig = null,
  onNavigate,
  onOpenTransfer,
  onOpenFund,
  onLogout,
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedTx, setSelectedTx] = useState(null);

  // Compute summary stats
  const totalInflow = (transactions || [])
    .filter((t) => t.isCredit && (t.status === 'Completed' || t.status === 'successful'))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalOutflow = (transactions || [])
    .filter((t) => !t.isCredit && (t.status === 'Completed' || t.status === 'successful'))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // Filter transactions
  const filtered = (transactions || []).filter((t) => {
    const desc = (t.description || '').toLowerCase();
    const ref = (t.reference || '').toLowerCase();
    const recip = (t.recipient || '').toLowerCase();
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      desc.includes(search) ||
      ref.includes(search) ||
      recip.includes(search);

    const matchesCategory =
      categoryFilter === 'All' ||
      (categoryFilter === 'Credits' && t.isCredit) ||
      (categoryFilter === 'Debits' && !t.isCredit) ||
      (categoryFilter === 'SAFI' && t.category === 'Internal');

    const matchesStatus =
      statusFilter === 'All' || t.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="app-container">
      {/* Reusable Sidebar Navigation with Mobile Drawer */}
      <SidebarNav
        activeNav="statements"
        safiConfig={safiConfig}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onNavigate={onNavigate}
        onOpenTransfer={onOpenTransfer}
        onLogout={onLogout}
      />

      {/* Main Viewport */}
      <div className="main-viewport">
        {/* Top Header */}
        <header className="top-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="mobile-menu-trigger"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open Navigation Menu"
            >
              <Menu size={20} />
            </button>
            <div className="top-header-title">Transactions & Audit Trail</div>
          </div>
          <div className="header-actions">
            <div className="search-bar">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="header-user-pill" title={currentUser?.email || 'Corporate Account'}>
              <div className="header-user-avatar">
                {(currentUser?.name || 'Alexander').charAt(0).toUpperCase()}
              </div>
              <div className="header-user-details">
                <span className="header-user-name">
                  {currentUser?.name || 'Alexander Wright'}
                </span>
                <span className="header-user-role">Institutional Tier</span>
              </div>
            </div>
            <button
              className="header-icon-btn"
              onClick={onLogout || (() => onNavigate('login'))}
              title="Sign Out of Session"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content">
          {/* Header Title and Actions */}
          <div className="tx-page-header">
            <div>
              <h1 className="page-title">Transaction Ledger</h1>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Complete verifiable history of institutional payments, funding, and SAFI operations.
              </p>
            </div>
            <div className="tx-header-actions">
              <button className="btn-primary-teal" onClick={onOpenFund}>
                <Plus size={16} />
                <span>Fund Account</span>
              </button>
              <button className="btn-primary-dark" onClick={onOpenTransfer}>
                <ArrowLeftRight size={16} />
                <span>Transfer Funds</span>
              </button>
            </div>
          </div>

          {/* 3 Metric Cards Bar */}
          <div className="tx-metrics-bar">
            <div className="tx-metric-card">
              <div className="tx-metric-info">
                <span className="tx-metric-label">Total Inflow</span>
                <span className="tx-metric-val" style={{ color: '#059669' }}>
                  +₦{totalInflow.toLocaleString()}
                </span>
              </div>
              <div className="tx-metric-icon-wrap inflow">
                <ArrowDownLeft size={22} />
              </div>
            </div>

            <div className="tx-metric-card">
              <div className="tx-metric-info">
                <span className="tx-metric-label">Total Outflow</span>
                <span className="tx-metric-val" style={{ color: '#DC2626' }}>
                  -₦{totalOutflow.toLocaleString()}
                </span>
              </div>
              <div className="tx-metric-icon-wrap outflow">
                <ArrowUpRight size={22} />
              </div>
            </div>

            <div className="tx-metric-card">
              <div className="tx-metric-info">
                <span className="tx-metric-label">Ledger Entries</span>
                <span className="tx-metric-val">{transactions.length} Records</span>
              </div>
              <div className="tx-metric-icon-wrap protected">
                <Layers size={22} />
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="tx-filters-bar">
            <div className="tx-category-pills">
              {['All', 'Credits', 'Debits', 'SAFI'].map((cat) => (
                <button
                  key={cat}
                  className={`tx-filter-pill ${categoryFilter === cat ? 'active' : ''}`}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat === 'All'
                    ? 'All Entries'
                    : cat === 'Credits'
                    ? 'Inflows (+)'
                    : cat === 'Debits'
                    ? 'Outflows (-)'
                    : 'SAFI Internal'}
                </button>
              ))}
            </div>

            <div className="tx-search-filter-group">
              <select
                className="tx-status-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>

              <button
                className="export-btn"
                onClick={() => alert('Exporting transaction ledger CSV...')}
              >
                <Download size={14} />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Transactions Table Card with Horizontal Scroll Wrap */}
          <div className="transactions-card">
            <div className="transactions-table-wrap">
              <table className="custom-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>REFERENCE</th>
                  <th>DESCRIPTION</th>
                  <th>CATEGORY</th>
                  <th>AMOUNT</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((tx) => (
                    <tr
                      key={tx.id}
                      className="clickable-row"
                      onClick={() => setSelectedTx(tx)}
                      title="Click to view full transaction details"
                    >
                      <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {tx.date}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600 }}>
                        {tx.reference || 'REF-N/A'}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{tx.description}</div>
                        {tx.recipient && (
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                            To: {tx.recipient}
                          </div>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{tx.category}</td>
                      <td
                        style={{
                          fontWeight: 700,
                          color: tx.isCredit ? '#059669' : '#0F172A',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {tx.isCredit ? '+' : '-'}₦{tx.amount.toLocaleString()}.00
                      </td>
                      <td>
                        {tx.status === 'Completed' ? (
                          <span className="badge-completed">
                            <span className="dot"></span> Completed
                          </span>
                        ) : tx.status === 'Pending' ? (
                          <span className="badge-pending">
                            <span className="dot"></span> Pending
                          </span>
                        ) : (
                          <span className="badge-failed">
                            <span className="dot"></span> Failed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#64748B' }}>
                      No transactions match your current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="modal-overlay" onClick={() => setSelectedTx(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-title">
                <div
                  className={`modal-header-icon ${
                    selectedTx.isCredit ? 'fund' : 'transfer'
                  }`}
                >
                  {selectedTx.isCredit ? (
                    <ArrowDownLeft size={22} />
                  ) : (
                    <ArrowUpRight size={22} />
                  )}
                </div>
                <div className="modal-header-text">
                  <h3>Transaction Details</h3>
                  <p>Reference: {selectedTx.reference}</p>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setSelectedTx(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: '8px 0 16px 0' }}>
                <div
                  style={{
                    fontSize: '32px',
                    fontWeight: 800,
                    color: selectedTx.isCredit ? '#059669' : '#0F172A',
                  }}
                >
                  {selectedTx.isCredit ? '+' : '-'}₦
                  {selectedTx.amount.toLocaleString()}.00
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#64748B',
                    marginTop: '4px',
                  }}
                >
                  {selectedTx.description}
                </div>
              </div>

              <div className="receipt-summary-box">
                <div className="receipt-item">
                  <span className="key">Transaction Date</span>
                  <span className="val">{selectedTx.date}</span>
                </div>
                <div className="receipt-item">
                  <span className="key">Category</span>
                  <span className="val">{selectedTx.category}</span>
                </div>
                {selectedTx.recipient && (
                  <div className="receipt-item">
                    <span className="key">Beneficiary</span>
                    <span className="val">{selectedTx.recipient}</span>
                  </div>
                )}
                {selectedTx.bank && (
                  <div className="receipt-item">
                    <span className="key">Destination Bank</span>
                    <span className="val">{selectedTx.bank}</span>
                  </div>
                )}
                <div className="receipt-item">
                  <span className="key">Processing Fee</span>
                  <span className="val" style={{ color: '#059669' }}>
                    ₦0.00 (Waived)
                  </span>
                </div>
                <div className="receipt-item">
                  <span className="key">SAFI Governance</span>
                  <span className="val">
                    {selectedTx.protectedUsed
                      ? `Protected: ₦${selectedTx.protectedUsed.toLocaleString()}`
                      : 'Spendable Segment'}
                  </span>
                </div>
                <div className="receipt-item">
                  <span className="key">Status</span>
                  <span className="badge-completed">
                    <span className="dot"></span> {selectedTx.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-modal-submit"
                onClick={() => setSelectedTx(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
