import { StyleSheet } from 'react-native';

export const formStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 24, paddingBottom: 40 },
  budgetHint: { fontSize: 15, color: '#2563eb', fontWeight: '600', marginBottom: 20, textAlign: 'center', backgroundColor: '#eff6ff', padding: 12, borderRadius: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
});
