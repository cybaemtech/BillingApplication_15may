export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export function normalizeJournalLines(entry: any) {
  return entry?.journal_entry_lines || entry?.lines || [];
}

export function computeAccountMovement(accounts: any[], entries: any[]) {
  return accounts.map((account: any) => {
    let debitMovement = 0;
    let creditMovement = 0;

    entries.forEach((entry: any) => {
      normalizeJournalLines(entry).forEach((line: any) => {
        if (line.account_id === account.id) {
          debitMovement += Number(line.debit || 0);
          creditMovement += Number(line.credit || 0);
        }
      });
    });

    const openingBalance = Number(account.balance || 0);
    const normalDebit = ["asset", "expense"].includes(String(account.account_type || "").toLowerCase());
    const closingBalance = normalDebit
      ? openingBalance + debitMovement - creditMovement
      : openingBalance + creditMovement - debitMovement;

    return {
      ...account,
      openingBalance,
      debitMovement,
      creditMovement,
      closingBalance,
      trialDebit: closingBalance > 0 && normalDebit ? closingBalance : (!normalDebit && closingBalance < 0 ? Math.abs(closingBalance) : 0),
      trialCredit: closingBalance > 0 && !normalDebit ? closingBalance : (normalDebit && closingBalance < 0 ? Math.abs(closingBalance) : 0),
    };
  });
}
