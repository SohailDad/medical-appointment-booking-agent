import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import Card from '../../components/Card';
import MintButton from '../../components/MintButton';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import apiClient from '../../api/client';
import Toast from 'react-native-toast-message';

const ReportsScreen = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/reports/my');
            setReports(response.data);
        } catch (error) {
            console.error('Fetch reports error', error);
            // Dummy data
            setReports([
                { _id: '1', fileName: 'Blood_Test_Results.pdf', date: '2024-04-15', size: '1.2 MB' },
                { _id: '2', fileName: 'Prescription_May.jpg', date: '2024-05-02', size: '850 KB' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleUpload = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
            });

            if (!result.canceled) {
                setUploading(true);
                const file = result.assets[0];

                const formData = new FormData();
                formData.append('file', {
                    uri: file.uri,
                    name: file.name,
                    type: file.mimeType || 'application/octet-stream',
                });

                await apiClient.post('/reports/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                Toast.show({ type: 'success', text1: 'Report uploaded successfully' });
                fetchReports();
            }
        } catch (error) {
            console.error('Upload error', error);
            Toast.show({ type: 'error', text1: 'Upload failed' });
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Delete Report',
            'Are you sure you want to delete this report?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await apiClient.delete(`/reports/${id}`);
                            Toast.show({ type: 'success', text1: 'Report deleted' });
                            fetchReports();
                        } catch (error) {
                            Toast.show({ type: 'error', text1: 'Delete failed' });
                        }
                    }
                },
            ]
        );
    };

    const renderItem = ({ item }) => (
        <Card style={styles.card}>
            <View style={styles.reportInfo}>
                <View style={styles.fileIcon}>
                    <MaterialCommunityIcons
                        name={item.fileName.endsWith('.pdf') ? 'file-pdf-box' : 'file-image'}
                        size={32}
                        color={colors.primary}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.fileName} numberOfLines={1}>{item.fileName}</Text>
                    <Text style={styles.fileDetails}>{item.date} • {item.size}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item._id)}>
                    <MaterialCommunityIcons name="delete-outline" size={24} color={colors.error} />
                </TouchableOpacity>
            </View>
        </Card>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <FlatList
                    data={reports}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    onRefresh={fetchReports}
                    refreshing={loading}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="folder-open-outline" size={80} color={colors.border} />
                            <Text style={styles.emptyTitle}>No Reports Found</Text>
                            <Text style={styles.emptySubtitle}>Upload your medical reports for easy access.</Text>
                        </View>
                    }
                />
                <View style={styles.footer}>
                    <MintButton
                        title="Upload New Report"
                        onPress={handleUpload}
                        loading={uploading}
                        style={styles.uploadButton}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flex: 1,
    },
    list: {
        padding: 20,
        paddingBottom: 100,
    },
    card: {
        marginBottom: 12,
    },
    reportInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    fileIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    fileName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    fileDetails: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 15,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 40,
    },
});

export default ReportsScreen;
