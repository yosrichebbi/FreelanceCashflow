export const SAMPLE_CSV = `Date,Value Date,Transaction Label,Reference,Debit (EUR),Credit (EUR),Balance (EUR)
2026-09-01,2026-09-01,SOLDE INITIAL / OPENING BALANCE,REF-0000,,14250.00,14250.00
2026-09-02,2026-09-02,PRLV SEPA URSSAF ILE DE FRANCE,URSSAF-202609,-1180.00,,13070.00
2026-09-03,2026-09-03,CB FIGMA INC SAN FRANCISCO USD 15.00,CARD-8821,-14.12,,13055.88
2026-09-04,2026-09-04,VIR SEPA RECU CLIENT ACME STUDIO INV-2026-084,ACME-084,,4800.00,17855.88
2026-09-05,2026-09-05,PRLV SEPA GOOGLE WORKSPACE IRELAND,GWS-99102,-27.60,,17828.28
2026-09-07,2026-09-07,CB AWS EMEA SARL LUXEMBOURG,CARD-8821,-64.35,,17763.93
2026-09-08,2026-09-08,VIR INSTANTANE REMUNERATION GERANT SEPT,PERSO-09,-3200.00,,14563.93
2026-09-10,2026-09-10,STRIPE PAYOUT 99482710-BATCH,STRP-9948,,1420.50,15984.43
2026-09-12,2026-09-12,CB SNCF INTERNET PARIS TGV PRO,CARD-8821,-142.00,,15842.43
2026-09-14,2026-09-14,PRLV SEPA QONTO / COTISATION MENSUELLE,FEE-0926,-29.00,,15813.43
2026-09-15,2026-09-15,CB NOTION LABS INC SAN FRANCISCO,CARD-8821,-18.50,,15794.93
2026-09-18,2026-09-18,VIR SEPA SOUS-TRAITANCE DESIGN STUDIO K,SUB-019,-1450.00,,14344.93
2026-09-21,2026-09-21,CB AMZN MKTP FR*291048219 SUPPLIES,CARD-8821,-89.90,,14255.03
2026-09-24,2026-09-24,PRLV SEPA DGFIP TVA COLLECTEE T3,TVA-2026Q3,-2140.00,,12115.03
2026-09-28,2026-09-28,VIR SEPA RECU NORDIC TECH GMBH INV-2026-089,NORDIC-089,,3600.00,15715.03
2026-10-01,2026-10-01,CB OPENAI *CHATGPT SUBSCR USD 20.00,CARD-8821,-18.80,,15696.23
2026-10-02,2026-10-02,PRLV SEPA URSSAF ILE DE FRANCE,URSSAF-202610,-1180.00,,14516.23
2026-10-03,2026-10-03,CB FIGMA INC SAN FRANCISCO USD 15.00,CARD-8821,-14.08,,14502.15
2026-10-05,2026-10-05,PRLV SEPA GOOGLE WORKSPACE IRELAND,GWS-99102,-27.60,,14474.55
2026-10-07,2026-10-07,CB AWS EMEA SARL LUXEMBOURG,CARD-8821,-71.10,,14403.45
2026-10-09,2026-10-09,VIR INSTANTANE REMUNERATION GERANT OCT,PERSO-10,-3200.00,,11203.45
2026-10-12,2026-10-12,STRIPE PAYOUT 10049281-BATCH,STRP-1004,,980.00,12183.45
2026-10-14,2026-10-14,PRLV SEPA QONTO / COTISATION MENSUELLE,FEE-1026,-29.00,,12154.45
2026-10-15,2026-10-15,CB NOTION LABS INC SAN FRANCISCO,CARD-8821,-18.50,,12135.95
2026-10-19,2026-10-19,CB APPLE STORE PARIS MACBOOK PRO,CARD-8821,-2699.00,,9436.95
2026-10-22,2026-10-22,VIR SEPA SOUS-TRAITANCE DESIGN STUDIO K,SUB-024,-1450.00,,7986.95
2026-10-27,2026-10-27,VIR SEPA RECU CLIENT ACME STUDIO INV-2026-092,ACME-092,,4800.00,12786.95
2026-10-30,2026-10-30,CB ADOBE CREATIVE CLOUD DUBLIN,CARD-8821,-62.99,,12723.96`;

const RECURRING_KEYWORDS = [
  'URSSAF',
  'TVA',
  'DGFIP',
  'PROVISION',
  'GOOGLE',
  'ADOBE',
  'FIGMA',
  'AWS',
  'NOTION',
  'QONTO',
  'OPENAI',
  'REMUNERATION',
  'SOUS-TRAITANCE'
];

const EXCEPTIONAL_KEYWORDS = ['APPLE STORE', 'MACBOOK', 'APPLE.COM'];
const TAX_KEYWORDS = ['URSSAF', 'TVA', 'DGFIP', 'IMPOT', 'TAX'];
const INVOICE_KEYWORDS = ['CLIENT', 'INVOICE', 'FACTURE', 'ACME'];

function splitCsvLine(line, delimiter) {
  const fields = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === delimiter && !quoted) {
      fields.push(field.trim());
      field = '';
    } else {
      field += character;
    }
  }

  fields.push(field.trim());
  return fields;
}

function detectDelimiter(header) {
  let inQuotes = false;
  let commas = 0;
  let semicolons = 0;

  for (let index = 0; index < header.length; index += 1) {
    const character = header[index];
    if (character === '"') inQuotes = !inQuotes;
    if (!inQuotes && character === ',') commas += 1;
    if (!inQuotes && character === ';') semicolons += 1;
  }

  return semicolons > commas ? ';' : ',';
}

function normalizeHeader(value) {
  return value
    .replace(/^\uFEFF/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function parseAmount(value) {
  if (!value) return 0;
  const cleaned = value.replace(/[€$£\s]/g, '').replace(/[()]/g, (char) =>
    char === '(' ? '-' : ''
  );
  const normalized =
    cleaned.includes(',') && cleaned.includes('.')
      ? cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')
        ? cleaned.replace(/\./g, '').replace(',', '.')
        : cleaned.replace(/,/g, '')
      : cleaned.replace(',', '.');
  const amount = Number(normalized);
  if (!Number.isFinite(amount)) throw new Error(`Montant invalide dans le CSV : ${value}`);
  return amount;
}

function findColumn(headers, candidates, fallbackIndex) {
  const index = headers.findIndex((header) => candidates.some((candidate) => header.includes(candidate)));
  return index < 0 ? fallbackIndex : index;
}

function includesKeyword(label, keywords) {
  const normalized = label.toUpperCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

function toIsoDate(value) {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  const match = trimmed.match(/^(\d{1,2})[/. -](\d{1,2})[/. -](\d{4})$/);
  if (match) return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
  return trimmed;
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export function parseBankCsv(csvText, suppliedOpeningBalance = null) {
  if (typeof csvText !== 'string' || !csvText.trim()) {
    throw new Error('Le fichier CSV est vide ou illisible.');
  }

  const lines = csvText.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error('Le fichier CSV ne contient aucune transaction.');

  const delimiter = detectDelimiter(lines[0]);
  const headers = splitCsvLine(lines[0], delimiter).map(normalizeHeader);
  const dateIndex = findColumn(headers, ['date', 'bookingdate', 'transactiondate'], -1);
  const labelIndex = findColumn(headers, ['label', 'description', 'libelle', 'counterparty', 'transaction'], -1);
  const debitIndex = findColumn(headers, ['debit', 'withdrawal', 'sortie'], -1);
  const creditIndex = findColumn(headers, ['credit', 'deposit', 'entree'], -1);
  const balanceIndex = findColumn(headers, ['balance', 'solde'], -1);
  const amountIndex = headers.findIndex((header) =>
    ['amount', 'montant', 'totalamountinclvat', 'totalamount', 'montantttc'].includes(header)
  );
  if (dateIndex < 0 || labelIndex < 0 || (amountIndex < 0 && debitIndex < 0 && creditIndex < 0)) {
    throw new Error('Colonnes de date, libellé ou montant introuvables dans le CSV.');
  }
  if (suppliedOpeningBalance !== null && !Number.isFinite(suppliedOpeningBalance)) {
    throw new Error('Le solde initial doit être un nombre valide.');
  }
  const transactions = [];
  let openingBalance = null;
  let openingBalanceRow = null;
  let totalInflows = 0;

  for (const line of lines.slice(1)) {
    const fields = splitCsvLine(line, delimiter);
    const date = toIsoDate(fields[dateIndex] ?? '');
    const parsedDate = new Date(`${date}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
      throw new Error(`Date invalide dans le CSV : ${fields[dateIndex] ?? ''}`);
    }
    const label = fields[labelIndex]?.trim() ?? '';
    if (!label) continue;

    const debit = parseAmount(fields[debitIndex] ?? '');
    const credit = parseAmount(fields[creditIndex] ?? '');
    let amount = debit < 0 ? debit : debit > 0 ? -debit : credit > 0 ? credit : 0;
    if (amount === 0 && amountIndex >= 0) amount = parseAmount(fields[amountIndex] ?? '');

    const hasBalance = balanceIndex >= 0 && Boolean(fields[balanceIndex]?.trim());
    const balance = hasBalance ? parseAmount(fields[balanceIndex]) : null;
    const isOpeningBalance =
      label.toUpperCase().includes('OPENING BALANCE') ||
      label.toUpperCase().includes('SOLDE INITIAL');
    if (isOpeningBalance) {
      openingBalance = balance ?? (credit !== 0 ? credit : Math.abs(amount));
      openingBalanceRow = {
        label,
        amount: Math.abs(openingBalance),
        reason: 'Opening balance row skipped'
      };
      continue;
    }

    if (amount > 0) totalInflows += amount;
    const isTax = amount < 0 && includesKeyword(label, TAX_KEYWORDS);
    const isExceptional = amount < 0 && includesKeyword(label, EXCEPTIONAL_KEYWORDS);
    const isRecurring =
      amount < 0 && !isExceptional && includesKeyword(label, RECURRING_KEYWORDS);
    const isInvoice = amount > 0 && includesKeyword(label, INVOICE_KEYWORDS);

    transactions.push({
      date,
      label,
      amount,
      balance,
      category: isTax
        ? 'tax'
        : isExceptional
          ? 'exceptional'
          : isRecurring
            ? 'recurring'
            : amount > 0
              ? 'income'
              : 'expense',
      isRecurring,
      isExceptional,
      isInvoice
    });
  }

  if (!transactions.length) throw new Error('Aucune transaction exploitable trouvée dans le CSV.');

  transactions.sort((a, b) => a.date.localeCompare(b.date));
  const balanceAnchor = transactions.findIndex((transaction) => transaction.balance !== null);
  if (openingBalance === null && suppliedOpeningBalance !== null) {
    openingBalance = suppliedOpeningBalance;
  } else if (openingBalance === null && balanceAnchor >= 0) {
    openingBalance = transactions[balanceAnchor].balance -
      transactions.slice(0, balanceAnchor + 1).reduce((sum, transaction) => sum + transaction.amount, 0);
  }
  let runningBalance = openingBalance;
  for (const transaction of transactions) {
    if (runningBalance !== null) runningBalance = Math.round((runningBalance + transaction.amount) * 100) / 100;
    if (transaction.balance !== null) runningBalance = transaction.balance;
    else transaction.balance = runningBalance;
  }

  const latestBalance = runningBalance;
  const latestMonth = transactions.at(-1)?.date.slice(0, 7);
  const currentMonthTransactions = transactions.filter((item) => item.date.startsWith(latestMonth));
  const recurringExpenses = currentMonthTransactions
    .filter(
      (item) =>
        item.isRecurring &&
        (item.category !== 'tax' || includesKeyword(item.label, ['URSSAF']))
    )
    .map((item) => ({ ...item, amount: Math.abs(item.amount) }));
  const taxGroups = new Map();

  for (const transaction of transactions.filter((item) => item.category === 'tax')) {
    const group = includesKeyword(transaction.label, ['URSSAF']) ? 'cotisations' : 'impots';
    const current = taxGroups.get(group);
    if (!current || transaction.date > current.date) {
      taxGroups.set(group, { ...transaction, amount: Math.abs(transaction.amount) });
    }
  }

  const exceptionalExpenses = transactions
    .filter((item) => item.isExceptional)
    .map((item) => ({ ...item, amount: Math.abs(item.amount) }));
  const latestMacbook = exceptionalExpenses.at(-1);
  const monthlyRecurring = Math.round(recurringExpenses.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;
  const forecastEvents = [
    ...[...taxGroups.values()].map((item, index) => ({
      id: `tax-${index}`,
      kind: 'tax',
      label: item.label,
      amount: -item.amount,
      day: index === 0 ? 5 : 10
    })),
    ...(latestMacbook
      ? [
          {
            id: 'macbook',
            kind: 'macbook',
            label: latestMacbook.label,
            amount: -latestMacbook.amount,
            day: 18
          }
        ]
      : [])
  ];
  const invoiceAmounts = transactions.filter((item) => item.isInvoice).map((item) => item.amount);
  const expectedInvoice = invoiceAmounts.length
    ? invoiceAmounts.at(-1)
    : average(transactions.filter((item) => item.amount > 0).map((item) => item.amount));
  const excludedItems = [
    ...(openingBalanceRow ? [openingBalanceRow] : []),
    ...exceptionalExpenses.map((item) => ({
      label: item.label,
      amount: item.amount,
      reason: 'One-off purchase isolated'
    })),
    ...transactions
    .filter((item) => item.amount < 0 && !item.isRecurring && !item.isExceptional)
    .map((item) => ({
      label: item.label,
      amount: Math.abs(item.amount),
      reason: 'Dépense ponctuelle'
    }))
  ];
  const latestVatPayment = taxGroups.get('impots');
  const upcomingVatDay = latestVatPayment
    ? Math.max(
        1,
        Math.ceil(
          (new Date(`${latestVatPayment.date}T00:00:00`).getTime() +
            90 * 24 * 60 * 60 * 1000 -
            new Date(`${transactions.at(-1).date}T00:00:00`).getTime()) /
            (24 * 60 * 60 * 1000)
        )
      )
    : null;
  const projectedEvents =
    latestVatPayment && upcomingVatDay <= 90
      ? [
          {
            id: 'vat-payment',
            kind: 'tax',
            label: latestVatPayment.label,
            amount: -latestVatPayment.amount,
            day: upcomingVatDay
          }
        ]
      : [];
  const vatReserve = totalInflows / 6;

  return {
    openingBalance,
    latestBalance,
    transactions,
    recurringExpenses,
    exceptionalExpenses,
    recurringBurn: monthlyRecurring,
    monthlyCommitments: monthlyRecurring,
    taxPayments: [...taxGroups.values()],
    expectedInvoice,
    forecastEvents: projectedEvents,
    vatReserve,
    safeToSpend: latestBalance === null ? null : latestBalance - vatReserve - monthlyRecurring,
    latestDate: transactions.at(-1).date,
    runwayDays:
      latestBalance === null ? null : monthlyRecurring > 0 ? Math.max(0, Math.round((latestBalance / monthlyRecurring) * 30)) : 999,
    latestRecurring: recurringExpenses,
    excludedItems
  };
}
