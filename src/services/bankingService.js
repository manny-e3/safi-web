import authService from './authService';

/**
 * Core Banking & SAFI Service
 * Handles live wallet balances, fund deposits, peer/external transfers, and transaction history.
 */
class BankingService {
  /**
   * Fetch current authenticated user's wallet
   * Backend: GET /api/v1/core-banking/wallet
   */
  async getWallet() {
    return await authService.request('/core-banking/wallet', {
      method: 'GET',
    });
  }

  /**
   * Fetch live ledger transactions for current user's wallet
   * Backend: GET /api/v1/core-banking/wallet/transactions
   */
  async getTransactions(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.type) query.append('type', params.type);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return await authService.request(`/core-banking/wallet/transactions${queryString}`, {
      method: 'GET',
    });
  }

  /**
   * Deposit funds into wallet
   * Backend: POST /api/v1/core-banking/wallet/fund
   * @param {Object} payload { amount: number, description?: string }
   */
  async fundWallet({ amount, description }) {
    return await authService.request('/core-banking/wallet/fund', {
      method: 'POST',
      body: JSON.stringify({
        amount: Number(amount),
        description: description || 'Account Deposit',
      }),
    });
  }

  /**
   * Transfer funds to another account with SAFI governance assertions
   * Backend: POST /api/v1/core-banking/wallet/transfer
   * @param {Object} payload { amount, recipientAccountNumber, recipientBank, recipientName, narration }
   */
  async transferFunds({
    amount,
    recipientAccountNumber,
    recipientBank,
    recipientName,
    narration,
  }) {
    return await authService.request('/core-banking/wallet/transfer', {
      method: 'POST',
      body: JSON.stringify({
        amount: Number(amount),
        recipientAccountNumber: String(recipientAccountNumber).trim(),
        recipientBank: recipientBank || 'Meridian Core / Commercial Bank',
        recipientName: recipientName || 'Beneficiary Account',
        narration: narration || 'Funds Transfer',
      }),
    });
  }

  /**
   * Resolve account number to verify recipient name
   * Backend: GET /api/v1/core-banking/wallet/resolve/:accountNumber
   */
  async resolveAccount(accountNumber) {
    if (!accountNumber || accountNumber.length < 5) return null;
    return await authService.request(`/core-banking/wallet/resolve/${encodeURIComponent(accountNumber)}`, {
      method: 'GET',
    });
  }

  /**
   * Helper to format backend transaction entity to UI model
   */
  formatTransaction(tx) {
    if (!tx) return null;
    const isCredit = tx.type === 'credit';
    const rawDate = tx.createdAt ? new Date(tx.createdAt) : new Date();
    const formattedDate = rawDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return {
      id: tx.id || `tx-${Date.now()}`,
      date: formattedDate,
      reference: tx.reference || 'REF-' + (tx.id || Math.floor(Math.random() * 900000)),
      description: tx.description || (isCredit ? 'Account Deposit' : 'Funds Transfer'),
      category: isCredit ? 'Receivable' : 'Transfer',
      amount: Number(tx.amount || 0),
      isCredit,
      status: tx.status === 'successful' || tx.status === 'Completed' ? 'Completed' : 'Pending',
      balanceBefore: tx.balanceBefore !== undefined ? Number(tx.balanceBefore) : undefined,
      balanceAfter: tx.balanceAfter !== undefined ? Number(tx.balanceAfter) : undefined,
      raw: tx,
    };
  }
}

export const bankingService = new BankingService();
export default bankingService;
