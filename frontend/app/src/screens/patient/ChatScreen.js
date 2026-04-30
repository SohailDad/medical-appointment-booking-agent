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

const ChatScreen = () => {
    const navigation = useNavigation();
    const [messages, setMessages] = useState([
        { id: '1', text: 'Hello! I am your AI Medical Assistant. How can I help you today?', sender: 'bot' }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const flatListRef = useRef();

    const sendMessage = async () => {
        if (!inputText.trim()) return;

        const currentText = inputText;
        const userMessage = { id: Date.now().toString(), text: currentText, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsTyping(true);

        try {
            const response = await apiClient.post('/chat', { message: currentText });
            const data = response.data;
            handleAction(data);
        } catch (error) {
            console.error('Chat error', error);
            const isNetworkError = !error.response;
            const textMsg = isNetworkError ? "No internet connection" : "Sorry, I'm having trouble connecting to the server.";
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                text: textMsg,
                sender: 'bot'
            };
            setMessages(prev => [...prev, errorMessage]);
            setIsTyping(false);
        }
    };

    const handleAction = (data) => {
        setIsTyping(false);
        if (!data || !data.action) return;

        if (data.action === 'MESSAGE') {
            const botMessage = {
                id: Date.now().toString(),
                text: data.message || "I'm sorry, I couldn't process that right now.",
                sender: 'bot'
            };
            setMessages(prev => [...prev, botMessage]);
        } else if (data.action === 'PAYMENT_REQUIRED') {
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
            const botMessage = {
                id: Date.now().toString(),
                text: data.message || "Error occurred",
                sender: 'bot'
            };
            setMessages(prev => [...prev, botMessage]);
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
});

export default ChatScreen;
