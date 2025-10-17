import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from '@/components/ui';
import { SafeAreaView } from '@/components/ui';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { getTodaysChallenge } from '@/data/challenges';

export default function HomeScreen() {
  const [showHints, setShowHints] = useState(false);
  const [expandedExample, setExpandedExample] = useState(null);
  const challenge = getTodaysChallenge();

  const difficultyColors = {
    Easy: { backgroundColor: '#22c55e' },
    Medium: { backgroundColor: '#eab308' },
    Hard: { backgroundColor: '#ef4444' },
  };

  const difficultyTextColors = {
    Easy: { color: '#16a34a' },
    Medium: { color: '#ca8a04' },
    Hard: { color: '#dc2626' },
  };

  return (
    <SafeAreaView sx={{ flex: 1, backgroundColor: '#f9fafb', marginBottom: 32 }}>
      <ScrollView sx={{ flex: 1 }}>
        {/* Header */}
        <View sx={{ backgroundColor: 'surface', borderBottomWidth: 1, borderBottomColor: 'border', paddingHorizontal: 6, paddingVertical: 4 }}>
          <View sx={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <View sx={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="calendar-outline" size={20} color="#6b7280" />
              <Text sx={{ color: 'textTertiary', marginLeft: 2, fontSize: 14 }}>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </View>
            <View sx={{ paddingHorizontal: 3, paddingVertical: 1, borderRadius: 'full', ...difficultyColors[challenge.difficulty] }}>
              <Text sx={{ color: 'white', fontSize: 12, fontWeight: '600' }}>{challenge.difficulty}</Text>
            </View>
          </View>

          <Text sx={{ fontSize: 24, fontWeight: '700', color: 'textPrimary', marginTop: 2 }}>{challenge.title}</Text>

          {/* Stats */}
          <View sx={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 4 }}>
            <View sx={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="check-circle" size={16} color="#10b981" />
              <Text sx={{ color: 'textSecondary', fontSize: 12, marginLeft: 1 }}>
                {challenge.acceptanceRate}% Acceptance
              </Text>
            </View>
            <View sx={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="people" size={16} color="#6b7280" />
              <Text sx={{ color: 'textSecondary', fontSize: 12, marginLeft: 1 }}>
                {(challenge.submissions / 1000000).toFixed(1)}M Submissions
              </Text>
            </View>
          </View>

          {/* Topics */}
          <View sx={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 3, gap: 2 }}>
            {challenge.topics.map((topic, index) => (
              <View key={index} sx={{ backgroundColor: '#dbeafe', paddingHorizontal: 3, paddingVertical: 1, borderRadius: 'full' }}>
                <Text sx={{ color: '#2563eb', fontSize: 12, fontWeight: '500' }}>{topic}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Content */}
        <View sx={{ paddingHorizontal: 6, paddingVertical: 5 }}>
          {/* Description */}
          <View sx={{ marginBottom: 6 }}>
            <Text sx={{ fontSize: 16, color: 'textPrimary', lineHeight: 24 }}>
              {challenge.description}
            </Text>
          </View>

          {/* Examples */}
          <View sx={{ marginBottom: 6 }}>
            <Text sx={{ fontSize: 18, fontWeight: '600', color: 'textPrimary', marginBottom: 3 }}>Examples</Text>
            {challenge.examples.map((example, index) => (
              <TouchableOpacity
                key={index}
                sx={{ backgroundColor: 'surface', borderRadius: 'lg', padding: 4, marginBottom: 3, borderWidth: 1, borderColor: 'border' }}
                onPress={() => setExpandedExample(expandedExample === index ? null : index)}
              >
                <View sx={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text sx={{ fontSize: 14, fontWeight: '600', color: 'textPrimary' }}>
                    Example {index + 1}
                  </Text>
                  <MaterialIcons
                    name={expandedExample === index ? "expand-less" : "expand-more"}
                    size={24}
                    color="#6b7280"
                  />
                </View>

                {expandedExample === index && (
                  <View sx={{ marginTop: 3 }}>
                    <View sx={{ backgroundColor: '#f9fafb', borderRadius: 'sm', padding: 3, marginBottom: 2 }}>
                      <Text sx={{ fontSize: 12, color: 'textTertiary', marginBottom: 1 }}>Input:</Text>
                      <Text sx={{ fontSize: 14, fontFamily: 'monospace', color: 'textPrimary' }}>{example.input}</Text>
                    </View>
                    <View sx={{ backgroundColor: '#f9fafb', borderRadius: 'sm', padding: 3, marginBottom: 2 }}>
                      <Text sx={{ fontSize: 12, color: 'textTertiary', marginBottom: 1 }}>Output:</Text>
                      <Text sx={{ fontSize: 14, fontFamily: 'monospace', color: 'textPrimary' }}>{example.output}</Text>
                    </View>
                    <Text sx={{ fontSize: 14, color: 'textSecondary', marginTop: 2 }}>{example.explanation}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Constraints */}
          <View sx={{ marginBottom: 6 }}>
            <Text sx={{ fontSize: 18, fontWeight: '600', color: 'textPrimary', marginBottom: 3 }}>Constraints</Text>
            <View sx={{ backgroundColor: 'surface', borderRadius: 'lg', padding: 4, borderWidth: 1, borderColor: 'border' }}>
              {challenge.constraints.map((constraint, index) => (
                <View key={index} sx={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
                  <Text sx={{ color: '#9ca3af', marginRight: 2 }}>•</Text>
                  <Text sx={{ fontSize: 14, color: 'textPrimary', flex: 1, fontFamily: 'monospace' }}>
                    {constraint}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Hints */}
          <View sx={{ marginBottom: 6 }}>
            <TouchableOpacity
              onPress={() => setShowHints(!showHints)}
              sx={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fef3c7', borderRadius: 'lg', padding: 4, borderWidth: 1, borderColor: '#fde68a' }}
            >
              <View sx={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="lightbulb" size={20} color="#eab308" />
                <Text sx={{ color: '#a16207', fontWeight: '600', marginLeft: 2 }}>
                  {showHints ? 'Hide' : 'Show'} Hints ({challenge.hints.length})
                </Text>
              </View>
              <MaterialIcons
                name={showHints ? "expand-less" : "expand-more"}
                size={24}
                color="#eab308"
              />
            </TouchableOpacity>

            {showHints && (
              <View sx={{ marginTop: 3 }}>
                {challenge.hints.map((hint, index) => (
                  <View key={index} sx={{ backgroundColor: 'surface', borderRadius: 'lg', padding: 4, marginBottom: 2, borderWidth: 1, borderColor: 'border' }}>
                    <Text sx={{ fontSize: 12, color: 'textTertiary', marginBottom: 1 }}>Hint {index + 1}</Text>
                    <Text sx={{ fontSize: 14, color: 'textPrimary', lineHeight: 20 }}>{hint}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Companies */}
          <View sx={{ marginBottom: 6 }}>
            <Text sx={{ fontSize: 14, color: 'textTertiary', marginBottom: 2 }}>Asked by</Text>
            <View sx={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
              {challenge.companies.map((company, index) => (
                <View key={index} sx={{ backgroundColor: '#f3f4f6', paddingHorizontal: 3, paddingVertical: 2, borderRadius: 'sm' }}>
                  <Text sx={{ color: 'textPrimary', fontSize: 12, fontWeight: '500' }}>{company}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View sx={{ backgroundColor: 'surface', borderTopWidth: 1, borderTopColor: 'border', paddingHorizontal: 6, paddingVertical: 4 }}>
        <View sx={{ flexDirection: 'row', gap: 3 }}>
          <TouchableOpacity sx={{ flex: 1, backgroundColor: '#f3f4f6', paddingVertical: 4, borderRadius: 'lg', alignItems: 'center' }}>
            <Text sx={{ color: 'textPrimary', fontWeight: '600' }}>Discuss</Text>
          </TouchableOpacity>
          <TouchableOpacity sx={{ flex: 1, backgroundColor: '#2563eb', paddingVertical: 4, borderRadius: 'lg', alignItems: 'center' }}>
            <Text sx={{ color: 'white', fontWeight: '600' }}>Submit Solution</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
