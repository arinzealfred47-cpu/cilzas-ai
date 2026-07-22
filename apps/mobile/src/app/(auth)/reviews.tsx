import { StyleSheet, Text, View } from 'react-native';

// Placeholder social-proof content for the boilerplate — swap for real
// reviews once you have them. Star ratings are constrained to 3-5.
const REVIEWS: { name: string; quote: string; stars: 3 | 4 | 5 }[] = [
  { name: 'J. Alvarez', quote: 'Set up in an afternoon. Exactly what I needed to get moving.', stars: 5 },
  { name: 'M. Chen', quote: 'Clean codebase, easy to extend. A couple rough edges but solid.', stars: 4 },
  { name: 'S. Okafor', quote: 'Saved me a week of boilerplate work. Would use again.', stars: 5 },
  { name: 'R. Novak', quote: 'Does what it says. Documentation could be better.', stars: 3 },
  { name: 'P. Dubois', quote: 'Great starting point for a new product. Recommended.', stars: 5 },
];

function Stars({ count }: { count: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <Text key={i} style={{ color: i < count ? '#00FF87' : 'rgba(255,255,255,0.2)' }}>
          ★
        </Text>
      ))}
    </View>
  );
}

export function ReviewsSection({ title }: { title: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {REVIEWS.map((r) => (
        <View key={r.name} style={styles.card}>
          <Stars count={r.stars} />
          <Text style={styles.quote}>&ldquo;{r.quote}&rdquo;</Text>
          <Text style={styles.name}>{r.name}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', gap: 12 },
  title: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 4 },
  card: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  quote: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  name: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
});
