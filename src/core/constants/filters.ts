// Keywords indicating non-leisure transactions to filter out
export const NON_LEISURE_KEYWORDS = [
  // English
  'electric', 'electricity', 'rent', 'tax', 'mortgage', 'insurance',
  'water', 'gas', 'salary', 'payroll', 'transfer', 'atm', 'withdrawal',
  'deposit', 'refund', 'municipal', 'government', 'health', 'medical',
  'pharmacy', 'doctor', 'hospital', 'school', 'tuition', 'daycare',
  'kindergarten', 'parking fine', 'court', 'lawyer',
  // Hebrew
  'חשמל', 'שכירות', 'שכ"ד', 'ארנונה', 'מס', 'מיסים', 'ביטוח',
  'משכנתא', 'מים', 'גז', 'משכורת', 'העברה', 'כספומט', 'משיכה',
  'הפקדה', 'החזר', 'עירייה', 'ממשלת', 'קופת חולים', 'בית חולים',
  'רופא', 'בית מרקחת', 'גן ילדים', 'בית ספר', 'שכר לימוד',
  'ועד בית', 'חניה', 'קנס',
];

export function isNonLeisure(description: string): boolean {
  const lower = description.toLowerCase();
  return NON_LEISURE_KEYWORDS.some(
    (keyword) => lower.includes(keyword.toLowerCase())
  );
}
