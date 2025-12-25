import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Недвижимость в Узбекистане</Text>
        <Text style={styles.subtitle}>Найдите свою идеальную недвижимость</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Популярные категории</Text>
        
        <View style={styles.categoryGrid}>
          <TouchableOpacity style={styles.categoryCard}>
            <Ionicons name="home" size={32} color="#3b82f6" />
            <Text style={styles.categoryText}>Квартиры</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.categoryCard}>
            <Ionicons name="business" size={32} color="#3b82f6" />
            <Text style={styles.categoryText}>Коммерческая</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.categoryCard}>
            <Ionicons name="earth" size={32} color="#3b82f6" />
            <Text style={styles.categoryText}>Земля</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.categoryCard}>
            <Ionicons name="key" size={32} color="#3b82f6" />
            <Text style={styles.categoryText}>Аренда</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Недавние объявления</Text>
        <Text style={styles.placeholder}>Загрузка...</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#3b82f6',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  placeholder: {
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
});
