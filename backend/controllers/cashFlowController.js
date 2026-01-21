const db = require("../config/db.js");

// Get all cash flow transactions
exports.getAllTransactions = async (req, res) => {
  try {
    const [transactions] = await db.execute(
      `SELECT * FROM tbl_cashflow ORDER BY date DESC, created_at DESC`
    );
    res.json(transactions || []);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Error fetching transactions' });
  }
};

// Get transaction by ID
exports.getTransactionById = async (req, res) => {
  const { id } = req.params;
  try {
    const [transactions] = await db.execute(
      `SELECT * FROM tbl_cashflow WHERE id = ?`,
      [id]
    );
    if (transactions.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json(transactions[0]);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ message: 'Error fetching transaction' });
  }
};

// Create transaction
exports.createTransaction = async (req, res) => {
  const { type, category, description, amount, date, reference } = req.body;

  if (!type || !category || !description || !amount || !date) {
    return res.status(400).json({ message: 'All required fields must be provided' });
  }

  try {
    const result = await db.execute(
      `INSERT INTO tbl_cashflow (type, category, description, amount, date, reference)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [type, category, description, amount, date, reference || null]
    );
    res.status(201).json({ 
      message: 'Transaction recorded successfully',
      id: result[0].insertId
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ message: 'Error creating transaction' });
  }
};

// Update transaction
exports.updateTransaction = async (req, res) => {
  const { id } = req.params;
  const { type, category, description, amount, date, reference } = req.body;

  if (!type || !category || !description || !amount || !date) {
    return res.status(400).json({ message: 'All required fields must be provided' });
  }

  try {
    const [checkTransaction] = await db.execute(
      `SELECT id FROM tbl_cashflow WHERE id = ?`,
      [id]
    );

    if (checkTransaction.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    await db.execute(
      `UPDATE tbl_cashflow 
       SET type = ?, category = ?, description = ?, amount = ?, date = ?, reference = ?
       WHERE id = ?`,
      [type, category, description, amount, date, reference || null, id]
    );

    res.json({ message: 'Transaction updated successfully' });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ message: 'Error updating transaction' });
  }
};

// Delete transaction
exports.deleteTransaction = async (req, res) => {
  const { id } = req.params;

  try {
    const [checkTransaction] = await db.execute(
      `SELECT id FROM tbl_cashflow WHERE id = ?`,
      [id]
    );

    if (checkTransaction.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    await db.execute('DELETE FROM tbl_cashflow WHERE id = ?', [id]);
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ message: 'Error deleting transaction' });
  }
};

// Get transactions by date range
exports.getTransactionsByDateRange = async (req, res) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'Start date and end date are required' });
  }

  try {
    const [transactions] = await db.execute(
      `SELECT * FROM tbl_cashflow 
       WHERE date BETWEEN ? AND ?
       ORDER BY date DESC, created_at DESC`,
      [startDate, endDate]
    );
    res.json(transactions || []);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Error fetching transactions' });
  }
};

// Get transactions by type
exports.getTransactionsByType = async (req, res) => {
  const { type } = req.params;
  
  if (!['payin', 'payout'].includes(type)) {
    return res.status(400).json({ message: 'Invalid transaction type' });
  }

  try {
    const [transactions] = await db.execute(
      `SELECT * FROM tbl_cashflow 
       WHERE type = ?
       ORDER BY date DESC, created_at DESC`,
      [type]
    );
    res.json(transactions || []);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Error fetching transactions' });
  }
};

// Get cash flow summary
exports.getCashFlowSummary = async (req, res) => {
  const { startDate, endDate } = req.query;
  
  try {
    let query = `
      SELECT 
        type,
        SUM(amount) as total,
        COUNT(*) as transaction_count
      FROM tbl_cashflow
    `;
    let params = [];

    if (startDate && endDate) {
      query += ` WHERE date BETWEEN ? AND ?`;
      params = [startDate, endDate];
    }

    query += ` GROUP BY type`;

    const [summary] = await db.execute(query, params);
    
    let payIn = 0;
    let payOut = 0;
    
    summary.forEach(row => {
      if (row.type === 'payin') {
        payIn = parseFloat(row.total) || 0;
      } else if (row.type === 'payout') {
        payOut = parseFloat(row.total) || 0;
      }
    });

    res.json({
      payIn,
      payOut,
      balance: payIn - payOut,
      details: summary
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ message: 'Error fetching summary' });
  }
};

// Get daily balance
exports.getDailyBalance = async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ message: 'Date is required' });
  }

  try {
    const [transactions] = await db.execute(
      `SELECT * FROM tbl_cashflow WHERE date = ? ORDER BY created_at ASC`,
      [date]
    );

    let runningBalance = 0;
    const transactionsWithBalance = transactions.map(t => {
      if (t.type === 'payin') {
        runningBalance += parseFloat(t.amount);
      } else {
        runningBalance -= parseFloat(t.amount);
      }
      return {
        ...t,
        runningBalance: runningBalance.toFixed(2)
      };
    });

    res.json({
      date,
      transactions: transactionsWithBalance,
      totalBalance: runningBalance.toFixed(2)
    });
  } catch (error) {
    console.error('Error fetching daily balance:', error);
    res.status(500).json({ message: 'Error fetching daily balance' });
  }
};