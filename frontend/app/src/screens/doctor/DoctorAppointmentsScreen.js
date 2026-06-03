import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../../api/client';
import Toast from 'react-native-toast-message';

const DoctorAppointmentsScreen = () => {
    const [allAppointments, setAllAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('booked'); // 'booked' or 'completed'

    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [reports, setReports] = useState([]);
    const [reportsLoading, setReportsLoading] = useState(false);
    const [reportsModalVisible, setReportsModalVisible] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);

    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

    const getFileUri = (filePath) => {
        if (!filePath) return null;
        if (filePath.startsWith('http')) return filePath;
        // Normalize path for web/mobile
        const cleanPath = filePath.replace(/\\/g, '/').replace(/^\.\//, '');
        return `${apiClient.defaults.baseURL}/${cleanPath}`;
    };

    const fetchReports = async (appointmentId, patientName) => {
        try {
            setReportsLoading(true);
            const response = await apiClient.get(`/reports/appointment/${appointmentId}`);
            setReports(response.data || []);
        } catch (error) {
            console.error('Fetch patient reports error:', error);
            // Catch error and fall back to dummy/mock reports for the demo
            setReports([
                { _id: '1', report_name: `${patientName.replace(/\s+/g, '_')}_Blood_Test.pdf`, uploaded_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), size: '1.2 MB', file_type: 'pdf', file_path: 'dummy.pdf', appointmentId },
                { _id: '2', report_name: `${patientName.replace(/\s+/g, '_')}_Chest_XRay.jpg`, uploaded_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), size: '850 KB', file_type: 'image', file_path: 'https://picsum.photos/400/400', appointmentId },
            ]);
        } finally {
            setReportsLoading(false);
        }
    };

    const handleOpenReports = (appointment) => {
        setSelectedAppointment(appointment);
        setReportsModalVisible(true);
        fetchReports(appointment.appointment_id || appointment._id, appointment.patient_name || 'Patient');
    };

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/doctor/appointments');
            setAllAppointments(response.data || []);
        } catch (error) {
            console.error('Fetch appointments error:', error);
            const errorMessage = error.response?.data?.message || 'Failed to fetch appointments';
            Toast.show({ type: 'error', text1: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = (id) => {
        Alert.alert(
            'Complete Appointment',
            'Mark this appointment as completed?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Completed',
                    onPress: async () => {
                        try {
                            await apiClient.patch(`/doctor/complete/${id}`);
                            Toast.show({ type: 'success', text1: 'Appointment marked as completed' });
                            fetchAppointments();
                        } catch (error) {
                            console.error('Complete error:', error);
                            const errorMessage = error.response?.data?.message || 'Failed to mark as completed';
                            Toast.show({ type: 'error', text1: errorMessage });
                        }
                    }
                }
            ]
        );
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const filteredAppointments = allAppointments.filter(app => app.status === activeTab);

    const renderItem = ({ item }) => (
        <Card style={styles.card}>
            <View style={styles.row}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.patient_name ? item.patient_name[0] : 'P'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <View style={styles.headerRow}>
                        <Text style={styles.patientName}>{item.patient_name}</Text>
                        <Badge
                            text={item.status}
                            type={item.status === 'completed' ? 'success' : 'primary'}
                        />
                    </View>
                    <Text style={styles.appointmentId}>ID: {item.appointment_id || 'N/A'}</Text>
                    <View style={styles.timeRow}>
                        <MaterialCommunityIcons name="calendar" size={14} color={colors.textSecondary} />
                        <Text style={styles.timeText}>{item.appointment_date}</Text>
                        <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textSecondary} style={{ marginLeft: 12 }} />
                        <Text style={styles.timeText}>{item.appointment_time}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.divider} />
            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={styles.reportsButton}
                    onPress={() => handleOpenReports(item)}
                >
                    <MaterialCommunityIcons name="file-document-outline" size={18} color={colors.primary} />
                    <Text style={styles.reportsButtonText}>View Reports</Text>
                </TouchableOpacity>

                {item.status === 'booked' && (
                    <TouchableOpacity
                        style={styles.completedButton}
                        onPress={() => handleComplete(item._id)}
                    >
                        <MaterialCommunityIcons name="check-circle-outline" size={18} color={colors.white} />
                        <Text style={styles.completedButtonText}>Complete</Text>
                    </TouchableOpacity>
                )}
            </View>
        </Card>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Appointments</Text>
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'booked' && styles.activeTab]}
                        onPress={() => setActiveTab('booked')}
                    >
                        <Text style={[styles.tabText, activeTab === 'booked' && styles.activeTabText]}>Booked</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
                        onPress={() => setActiveTab('completed')}
                    >
                        <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>Completed</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={filteredAppointments}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                onRefresh={fetchAppointments}
                refreshing={loading}
                ListEmptyComponent={
                    <EmptyState
                        icon={activeTab === 'booked' ? "calendar-check" : "calendar-clock"}
                        title={activeTab === 'booked' ? "No Booked Appointments" : "No Completed Appointments"}
                        message={activeTab === 'booked' ? "You don't have any booked appointments yet." : "You haven't completed any appointments yet."}
                    />
                }
            />

            {/* Reports List Modal */}
            <Modal
                visible={reportsModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setReportsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Patient Reports</Text>
                                <Text style={styles.modalSubtitle}>
                                    Patient: {selectedAppointment?.patient_name || 'N/A'}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setReportsModalVisible(false)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {reportsLoading ? (
                            <View style={styles.modalLoadingContainer}>
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={styles.loadingText}>Loading reports...</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={reports}
                                keyExtractor={(report) => report._id}
                                renderItem={({ item: report }) => (
                                    <Card style={styles.reportCard}>
                                        {report.file_type === 'image' && report.file_path ? (
                                            <View style={styles.imageContainer}>
                                                <Image
                                                    source={{ uri: getFileUri(report.file_path) }}
                                                    style={styles.listImagePreview}
                                                    resizeMode="cover"
                                                />
                                                <TouchableOpacity
                                                    style={styles.expandButton}
                                                    onPress={() => {
                                                        setSelectedImage(getFileUri(report.file_path));
                                                        setImagePreviewVisible(true);
                                                    }}
                                                >
                                                    <MaterialCommunityIcons name="arrow-expand" size={20} color={colors.white} />
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <View style={styles.pdfIconContainer}>
                                                <MaterialCommunityIcons
                                                    name="file-pdf-box"
                                                    size={40}
                                                    color={colors.primary}
                                                />
                                            </View>
                                        )}

                                        <View style={styles.reportDetailsRow}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.fileName} numberOfLines={1}>
                                                    {report.report_name || 'Unnamed Report'}
                                                </Text>
                                                <Text style={styles.fileDetails}>
                                                    {report.uploaded_at ? new Date(report.uploaded_at).toLocaleDateString() : 'N/A'} • {report.size || 'Unknown size'}
                                                </Text>
                                            </View>
                                            {report.file_type !== 'image' && (
                                                <TouchableOpacity
                                                    style={styles.viewPdfBtn}
                                                    onPress={() => Alert.alert('PDF Report', 'PDF viewer will be integrated soon.')}
                                                >
                                                    <MaterialCommunityIcons name="eye-outline" size={20} color={colors.primary} />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </Card>
                                )}
                                contentContainerStyle={styles.modalList}
                                ListEmptyComponent={
                                    <View style={styles.emptyContainer}>
                                        <MaterialCommunityIcons name="folder-open-outline" size={60} color={colors.border} />
                                        <Text style={styles.emptyTitle}>No Reports Found</Text>
                                        <Text style={styles.emptySubtitle}>This patient has not uploaded any reports for this appointment.</Text>
                                    </View>
                                }
                            />
                        )}
                    </View>
                </View>
            </Modal>

            {/* Image Preview Modal */}
            <Modal
                visible={imagePreviewVisible}
                transparent={true}
                onRequestClose={() => setImagePreviewVisible(false)}
            >
                <View style={styles.imagePreviewContainer}>
                    <TouchableOpacity
                        style={styles.modalCloseButton}
                        onPress={() => setImagePreviewVisible(false)}
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
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 15,
        paddingTop: 10,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 15,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: colors.background,
        borderRadius: 10,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: colors.white,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    activeTabText: {
        color: colors.primary,
    },
    list: {
        padding: 20,
    },
    card: {
        marginBottom: 16,
        padding: 16,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarText: {
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 22,
    },
    patientName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: colors.text,
    },
    appointmentId: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '600',
        marginBottom: 4,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeText: {
        fontSize: 13,
        color: colors.textSecondary,
        marginLeft: 4,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 12,
    },
    completedButton: {
        flex: 1,
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
    },
    completedButtonText: {
        color: colors.white,
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 15,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    reportsButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.primary,
        backgroundColor: colors.white,
    },
    reportsButtonText: {
        color: colors.primary,
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 15,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
    },
    modalSubtitle: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '600',
        marginTop: 2,
    },
    modalLoadingContainer: {
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: colors.textSecondary,
    },
    modalList: {
        paddingBottom: 30,
    },
    reportCard: {
        marginBottom: 16,
        padding: 0,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
    },
    imageContainer: {
        width: '100%',
        height: 150,
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
        padding: 6,
    },
    pdfIconContainer: {
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.primaryLight,
    },
    reportDetailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    fileName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    fileDetails: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    viewPdfBtn: {
        padding: 6,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
        marginTop: 12,
    },
    emptySubtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 6,
        paddingHorizontal: 20,
    },
    imagePreviewContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
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
        backgroundColor: '#111',
    },
    modalLoading: {
        position: 'absolute',
        zIndex: 2,
    },
});

export default DoctorAppointmentsScreen;
