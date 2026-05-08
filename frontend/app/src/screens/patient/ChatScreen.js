import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../../api/client';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ChatScreen = () => {
    const navigation = useNavigation();
    const [messages, setMessages] = useState([
        { id: '1', text: 'Hello! I am your AI Medical Assistant. How can I help you today?', sender: 'bot' }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const flatListRef = useRef();

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const response = await apiClient.get('/chat/history');
            if (response.data && response.data.conversation) {
                const formattedMessages = response.data.conversation.map((msg, index) => ({
                    id: `hist-${index}-${Date.now()}`,
                    text: msg.content,
                    sender: msg.role === 'assistant' ? 'bot' : 'user'
                }));
                
                if (formattedMessages.length > 0) {
                    setMessages(formattedMessages);
                }
            }
        } catch (error) {
            console.error('Error fetching chat history:', error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const sendMessage = async () => {
        if (!inputText.trim()) return;

        const currentText = inputText;
        const userMessage = { id: Date.now().toString(), text: currentText, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsTyping(true);

        // Create a placeholder for the bot response
        const botMessageId = (Date.now() + 1).toString();
        const botPlaceholder = { id: botMessageId, text: '', sender: 'bot' };
        setMessages(prev => [...prev, botPlaceholder]);

        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${apiClient.defaults.baseURL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: currentText }),
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedText = '';
            let finished = false;

            while (!finished) {
                const { done, value } = await reader.read();
                if (done) {
                    finished = true;
                    break;
                }

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.trim().startsWith('data: ')) {
                        const jsonStr = line.replace('data: ', '').trim();
                        if (jsonStr === '[DONE]') {
                            finished = true;
                            break;
                        }
                        
                        try {
                            const data = JSON.parse(jsonStr);
                            // Support both 'content' (from backend) and 'text' (fallback)
                            const textContent = data.content || data.text;
                            
                            if (textContent && (data.type === 'text' || !data.type)) {
                                accumulatedText += textContent;
                                setMessages(prev => prev.map(msg => 
                                    msg.id === botMessageId ? { ...msg, text: accumulatedText } : msg
                                ));
                            }
                            
                            // Check for actions
                            if (data.action || data.type === 'action') {
                                handleAction(data, botMessageId);
                            }
                        } catch (e) {
                            console.log('Error parsing chunk:', e);
                        }
                    }
                }
            }
            setIsTyping(false);

        } catch (error) {
            console.error('Chat error', error);
            // Remove the empty bot placeholder if it failed
            setMessages(prev => prev.filter(msg => msg.id !== botMessageId || msg.text !== ''));
            
            const isNetworkError = !error.response && !error.message.includes('status');
            const textMsg = isNetworkError ? "No internet connection" : "Sorry, I'm having trouble connecting to the server.";
            const errorMessage = {
                id: (Date.now() + 2).toString(),
                text: textMsg,
                sender: 'bot'
            };
            setMessages(prev => [...prev, errorMessage]);
            setIsTyping(false);
        }
    };

    const handleAction = (data, messageId) => {
        setIsTyping(false);
        if (!data || !data.action) return;

        if (data.action === 'PAYMENT_REQUIRED') {
            navigation.navigate('Payment', {
                amount: data.amount,
                appointmentData: data.appointmentData,
                onPaymentComplete: (paymentRes) => {
                    if (paymentRes.action === 'BOOKING_CONFIRMED') {
                        const confirmMsg = {
                            id: Date.now().toString(),
                            text: "Appointment booked successfully",
                            sender: 'bot'
                        };
                        setMessages(prev => [...prev, confirmMsg]);
                    } else if (paymentRes.action === 'ERROR') {
                        const errorMsg = {
                            id: Date.now().toString(),
                            text: paymentRes.message || "Payment failed",
                            sender: 'bot'
                        };
                        setMessages(prev => [...prev, errorMsg]);
                    }
                }
            });
        } else if (data.action === 'BOOKING_CONFIRMED') {
            const confirmMsg = {
                id: Date.now().toString(),
                text: "Appointment booked successfully",
                sender: 'bot'
            };
            setMessages(prev => [...prev, confirmMsg]);
        } else if (data.action === 'ERROR') {
            const errorMsg = {
                id: Date.now().toString(),
                text: data.message || "Error occurred",
                sender: 'bot'
            };
            setMessages(prev => [...prev, errorMsg]);
        }
    };

    useEffect(() => {
        if (flatListRef.current) {
            setTimeout(() => flatListRef.current.scrollToEnd({ animated: true }), 100);
        }
    }, [messages]);

    const renderMessage = ({ item }) => {
        const isUser = item.sender === 'user';
        return (
            <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.botMessage]}>
                {!isUser && (
                    <View style={styles.botAvatar}>
                        <MaterialCommunityIcons name="robot" size={20} color={colors.white} />
                    </View>
                )}
                <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.botBubble]}>
                    <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>
                        {item.text}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['right', 'top', 'left']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.listContent}
                    keyboardShouldPersistTaps="handled"
                />

                {isLoadingHistory && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                )}

                {isTyping && (
                    <View style={styles.typingIndicator}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={styles.typingText}>AI is thinking...</Text>
                    </View>
                )}

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type your message..."
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, !inputText.trim() && styles.disabledSend]}
                        onPress={sendMessage}
                        disabled={!inputText.trim() || isTyping}
                    >
                        <MaterialCommunityIcons name="send" size={24} color={colors.white} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    listContent: {
        padding: 16,
        paddingBottom: 24,
    },
    messageContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        maxWidth: '85%',
    },
    userMessage: {
        alignSelf: 'flex-end',
        flexDirection: 'row-reverse',
    },
    botMessage: {
        alignSelf: 'flex-start',
    },
    botAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    messageBubble: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    userBubble: {
        backgroundColor: colors.primary,
        borderBottomRightRadius: 4,
    },
    botBubble: {
        backgroundColor: colors.white,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: colors.border,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    userText: {
        color: colors.white,
    },
    botText: {
        color: colors.text,
    },
    typingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    typingText: {
        marginLeft: 8,
        fontSize: 12,
        color: colors.textSecondary,
        fontStyle: 'italic',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: colors.background,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        maxHeight: 100,
        color: colors.text,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    disabledSend: {
        backgroundColor: colors.border,
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 80,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        zIndex: 10,
    },
});

export default ChatScreen;
