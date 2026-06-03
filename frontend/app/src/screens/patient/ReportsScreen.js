import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Platform, Image, Modal, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import Card from '../../components/Card';
import MintButton from '../../components/MintButton';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import apiClient from '../../api/client';
import Toast from 'react-native-toast-message';

const ReportsScreen = ({ route, navigation }) => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);

    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

    const getFileUri = (filePath) => {
        if (!filePath) return null;
        if (filePath.startsWith('http')) return filePath;
        // Normalize path for web/mobile
        const cleanPath = filePath.replace(/\\/g, '/').replace(/^\.\//, '');
        return `${apiClient.defaults.baseURL}/${cleanPath}`;
    };

    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/reports/my');
            setReports(response.data);
        } catch (error) {
            console.error('Fetch reports error', error);
            // Dummy data
            // setReports([
            //     { _id: '1', report_name: 'Blood_Test_Results.pdf', uploaded_at: '2024-04-15T10:00:00Z', size: '1.2 MB', file_type: 'pdf', file_path: 'dummy.pdf' },
            //     { _id: '2', report_name: 'Chest_XRay_Sample.jpg', uploaded_at: '2024-05-02T14:30:00Z', size: '850 KB', file_type: 'image', file_path: 'https://picsum.photos/200/200' },
            // ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    useEffect(() => {
        if (route.params?.autoUpload) {
            handleUpload(route.params.appointmentId);
            // Clear params to avoid re-triggering on re-render
            navigation.setParams({ autoUpload: false });
        }
    }, [route.params?.autoUpload]);

    const handleUpload = async (forcedAppointmentId = null) => {
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

                if (forcedAppointmentId) {
                    formData.append('appointmentId', forcedAppointmentId);
                }

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

    const handleViewReport = (item) => {
        if (item.file_type === 'image') {
            setSelectedImage(getFileUri(item.file_path));
            setIsModalVisible(true);
        } else {
            Alert.alert('PDF Report', 'PDF viewer will be integrated soon. For now, you can manage your reports here.');
        }
    };

    const renderItem = ({ item }) => (
        <Card style={styles.card}>
            {item.file_type === 'image' && item.file_path ? (
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: getFileUri(item.file_path) }}
                        style={styles.listImagePreview}
                        resizeMode="cover"
                    />
                    <TouchableOpacity
                        style={styles.expandButton}
                        onPress={() => handleViewReport(item)}
                    >
                        <MaterialCommunityIcons name="arrow-expand" size={20} color={colors.white} />
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.pdfIconContainer}>
                    <MaterialCommunityIcons
                        name={item.file_type === 'pdf' ? 'file-pdf-box' : 'file-image'}
                        size={40}
                        color={colors.primary}
                    />
                </View>
            )}

            <View style={styles.reportDetailsRow}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.fileName} numberOfLines={1}>{item.report_name || 'Unnamed Report'}</Text>
                    <Text style={styles.fileDetails}>
                        {item.uploaded_at ? new Date(item.uploaded_at).toLocaleDateString() : 'N/A'} • {item.size || 'Unknown size'}
                    </Text>
                    {item.appointmentId && (
                        <View style={styles.appointmentBadge}>
                            <MaterialCommunityIcons name="link-variant" size={12} color={colors.primary} />
                            <Text style={styles.appointmentIdLabel}>Appt ID: {item.appointmentId}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.reportActions}>
                    <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteButton}>
                        <MaterialCommunityIcons name="trash-can-outline" size={24} color={colors.error} />
                    </TouchableOpacity>
                </View>
            </View>
        </Card>
    );

    return (
        <View style={styles.container}>
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
            </View>

            <Modal
                visible={isModalVisible}
                transparent={true}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <TouchableOpacity
                        style={styles.modalCloseButton}
                        onPress={() => setIsModalVisible(false)}
                    >
                        <MaterialCommunityIcons name="close" size={30} color={colors.white} />
                    </TouchableOpacity>
                    {selectedImage && (
                        <>
                            {imageLoading && (
                                <ActivityIndicator
                                    size="large"
                                    color={colors.white}
                                    style={styles.modalLoading}
                                />
                            )}
                            <Image
                                source={{ uri: selectedImage }}
                                style={[
                                    styles.fullImage,
                                    { width: screenWidth, height: screenHeight * 0.8 }
                                ]}
                                resizeMode="contain"
                                onLoadStart={() => setImageLoading(true)}
                                onLoadEnd={() => setImageLoading(false)}
                                onError={(e) => {
                                    console.error('Image load error:', e.nativeEvent.error);
                                    setImageLoading(false);
                                    Alert.alert('Error', 'Failed to load report image.');
                                }}
                            />
                        </>
                    )}
                </View>
            </Modal>
        </View>
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
        marginBottom: 16,
        padding: 0,
        overflow: 'hidden',
    },
    imageContainer: {
        width: '100%',
        height: 200,
        backgroundColor: colors.primaryLight,
    },
    listImagePreview: {
        width: '100%',
        height: '100%',
    },
    expandButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        padding: 8,
    },
    pdfIconContainer: {
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.primaryLight,
    },
    reportDetailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    reportActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    deleteButton: {
        padding: 8,
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
    appointmentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primaryLight,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginTop: 6,
    },
    appointmentIdLabel: {
        fontSize: 11,
        color: colors.primary,
        fontWeight: 'bold',
        marginLeft: 4,
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
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCloseButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 1,
    },
    fullImage: {
        backgroundColor: '#1a1a1a',
    },
    modalLoading: {
        position: 'absolute',
        zIndex: 2,
    },
});

export default ReportsScreen;
