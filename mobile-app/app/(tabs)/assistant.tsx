import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { apiFetch } from '../../lib/api';
import { Sparkles, Send, Loader2 } from 'lucide-react-native';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your AI financial advisor. I can analyze your portfolio, provide insights, and answer questions about your finances. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const suggestions = [
    "How is my portfolio performing?",
    "What should I prioritize?",
    "Any overdue payments?",
  ];

  async function handleSend(textToSend = input) {
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Scroll to bottom
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const response = await apiFetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend }),
      });

      const assistantMsg: Message = {
        role: 'assistant',
        content: response.chat_reply || "I apologize, but I couldn't compute a proper response.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('AI Chat Error:', err);
      const errMsg: Message = {
        role: 'assistant',
        content: "I apologize, but I encountered an error connecting to the secure vault AI. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.innerContainer}>
          
          {/* Scrollable Message History */}
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <View 
                  key={idx} 
                  style={[
                    styles.messageRow, 
                    isUser ? styles.userRow : styles.assistantRow
                  ]}
                >
                  {!isUser && (
                    <View style={styles.assistantIconContainer}>
                      <Sparkles size={14} color="#60A5FA" />
                    </View>
                  )}
                  <View 
                    style={[
                      styles.messageBubble, 
                      isUser ? styles.userBubble : styles.assistantBubble
                    ]}
                  >
                    <Text style={styles.messageText}>{msg.content}</Text>
                    <Text style={styles.messageTime}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              );
            })}

            {loading && (
              <View style={[styles.messageRow, styles.assistantRow]}>
                <View style={styles.assistantIconContainer}>
                  <Loader2 size={14} color="#60A5FA" />
                </View>
                <View style={[styles.messageBubble, styles.assistantBubble, styles.loadingBubble]}>
                  <ActivityIndicator size="small" color="#60A5FA" style={{ marginRight: 8 }} />
                  <Text style={styles.loadingText}>Analyzing Vault Portfolio...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Quick Suggestions Bubbles */}
          {messages.length === 1 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Tap a Quick Inquiry:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
                {suggestions.map((s, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={styles.suggestionButton}
                    onPress={() => handleSend(s)}
                  >
                    <Text style={styles.suggestionText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Chat Input Section */}
          <View style={styles.inputArea}>
            <TextInput
              style={styles.textInput}
              value={input}
              onChangeText={setInput}
              placeholder="Ask vault AI assistant..."
              placeholderTextColor="#6B7280"
              editable={!loading}
            />
            <TouchableOpacity 
              style={[styles.sendButton, (!input.trim() || loading) && styles.disabledSendButton]} 
              onPress={() => handleSend()}
              disabled={!input.trim() || loading}
            >
              <Send size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  messageList: {
    padding: 16,
    paddingBottom: 24,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '85%',
  },
  userRow: {
    alignSelf: 'flex-end',
  },
  assistantRow: {
    alignSelf: 'flex-start',
  },
  assistantIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E3A8A30',
    borderWidth: 0.5,
    borderColor: '#3B82F650',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  messageBubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userBubble: {
    backgroundColor: '#3B82F6',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderBottomLeftRadius: 4,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 14,
    color: '#F9FAFB',
    lineHeight: 20,
  },
  loadingText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  messageTime: {
    fontSize: 10,
    color: '#9CA3AF50',
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  suggestionsContainer: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
    backgroundColor: '#0B0F19',
  },
  suggestionsTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    marginLeft: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionsScroll: {
    paddingLeft: 16,
  },
  suggestionButton: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
  },
  suggestionText: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  inputArea: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
    backgroundColor: '#0B0F19',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    color: '#F9FAFB',
    fontSize: 14,
    marginRight: 10,
  },
  sendButton: {
    width: 48,
    height: 48,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledSendButton: {
    backgroundColor: '#1F2937',
    shadowOpacity: 0,
    elevation: 0,
  },
});
