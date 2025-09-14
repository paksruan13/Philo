import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { API_ROUTES } from '../../services/api';

const { width: screenWidth } = Dimensions.get('window');
const itemWidth = (screenWidth - 48) / 2; // 2 items per row with padding

const StoreScreen = () => {
  const [products, setProducts] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(API_ROUTES.products.public);
      
      if (response.ok) {
        const data = await response.json();
        
        // Separate tickets from other products
        const productList = data.filter(product => product.type !== 'TICKET');
        const ticketList = data.filter(product => product.type === 'TICKET');
        
        setProducts(productList);
        setTickets(ticketList);
      } else {
        setError('Failed to fetch products');
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const openProductModal = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const closeModals = () => {
    setShowProductModal(false);
    setTimeout(() => {
      setSelectedProduct(null);
    }, 200);
  };

  const renderProductCard = ({ item }) => {
    const hasAvailableSizes = item.inventory?.some(inv => inv.quantity > 0);
    
    return (
      <TouchableOpacity 
        style={styles.productCard}
        onPress={() => openProductModal(item)}
        activeOpacity={0.9}
      >
        <View style={styles.productImageContainer}>
          {item.imageUrl ? (
            <Image 
              source={{ uri: item.imageUrl }}
              style={styles.productImage}
              resizeMode="cover"
              onLoad={() => console.log('Image loaded successfully:', item.name)}
              onError={(error) => console.log('Image load error for', item.name, ':', error.nativeEvent.error)}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="shirt-outline" size={40} color="#6b7280" />
            </View>
          )}
          
          <View style={[
            styles.availabilityBadge,
            { backgroundColor: hasAvailableSizes ? '#10b981' : '#ef4444' }
          ]}>
            <Text style={styles.availabilityText}>
              {hasAvailableSizes ? 'Available' : 'Out of Stock'}
            </Text>
          </View>
        </View>
        
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.productType}>{item.type}</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>${item.price}</Text>
            <View style={styles.pointsBadge}>
              <Ionicons name="star" size={12} color="#f59e0b" />
              <Text style={styles.pointsText}>{item.points}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTicketCard = ({ item }) => {
    const availableQuantity = item.inventory?.find(inv => inv.size === 'ONESIZE')?.quantity || 0;
    const isAvailable = availableQuantity > 0;
    
    return (
      <TouchableOpacity 
        style={styles.productCard}
        onPress={() => openProductModal(item)}
        activeOpacity={0.9}
      >
        <View style={styles.productImageContainer}>
          {item.imageUrl ? (
            <Image 
              source={{ uri: item.imageUrl }}
              style={styles.productImage}
              resizeMode="cover"
              onLoad={() => console.log('Ticket image loaded successfully:', item.name)}
              onError={(error) => console.log('Ticket image load error for', item.name, ':', error.nativeEvent.error)}
            />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="ticket-outline" size={40} color="#f59e0b" />
            </View>
          )}
          
          <View style={[
            styles.availabilityBadge,
            { backgroundColor: isAvailable ? '#10b981' : '#ef4444' }
          ]}>
            <Text style={styles.availabilityText}>
              {isAvailable ? 'Available' : 'Sold Out'}
            </Text>
          </View>
        </View>
        
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.productType}>{availableQuantity} available</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>${item.price}</Text>
            <View style={styles.pointsBadge}>
              <Ionicons name="star" size={12} color="#f59e0b" />
              <Text style={styles.pointsText}>{item.points}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <LinearGradient 
        colors={['#ffffff', '#f8fafc']} 
        style={styles.container}
      >
        <SafeAreaView style={styles.loadingContainer}>
          <View style={styles.loadingSpinner}>
            <Ionicons name="storefront" size={32} color="#0891b2" />
          </View>
          <Text style={styles.loadingText}>Loading team store...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={['#ffffff', '#f8fafc']} 
        style={styles.backgroundGradient}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.headerTitleSection}>
                <View style={styles.storeIconContainer}>
                  <Ionicons name="storefront" size={24} color="white" />
                </View>
                <View>
                  <Text style={styles.headerTitle}>Merch</Text>
                  <Text style={styles.headerSubtitle}>Merchandise & Tickets</Text>
                </View>
              </View>
            </View>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                tintColor="#0891b2"
                colors={['#0891b2']}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="warning" size={20} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Products Section */}
            {products.length > 0 && (
              <View style={styles.section}>
                <FlatList
                  data={products}
                  renderItem={renderProductCard}
                  keyExtractor={(item) => item.id.toString()}
                  numColumns={2}
                  scrollEnabled={false}
                  contentContainerStyle={styles.gridContainer}
                  columnWrapperStyle={styles.gridRow}
                />
              </View>
            )}

            {/* Event Tickets Section */}
            {tickets.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name="ticket" size={20} color="#f59e0b" />
                    <Text style={styles.sectionTitle}>Event Tickets</Text>
                  </View>
                  <Text style={styles.sectionSubtitle}>Special events & fundraising</Text>
                </View>
                
                <FlatList
                  data={tickets}
                  renderItem={renderTicketCard}
                  keyExtractor={(item) => item.id.toString()}
                  numColumns={2}
                  scrollEnabled={false}
                  contentContainerStyle={styles.gridContainer}
                  columnWrapperStyle={styles.gridRow}
                />
              </View>
            )}

            {/* Empty State */}
            {products.length === 0 && tickets.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <Ionicons name="storefront-outline" size={64} color="#d1d5db" />
                <Text style={styles.emptyTitle}>Store Coming Soon</Text>
                <Text style={styles.emptySubtitle}>
                  We're preparing amazing products and tickets for you. Check back soon for exclusive team merchandise and event access!
                </Text>
              </View>
            )}

            <View style={styles.bottomSpacing} />
          </ScrollView>
        </SafeAreaView>

        {/* Product Details Modal */}
        <Modal
          visible={showProductModal}
          animationType="fade"
          transparent={true}
          onRequestClose={closeModals}
          statusBarTranslucent={true}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity 
              style={styles.modalOverlayTouch}
              activeOpacity={1}
              onPress={closeModals}
            />
            <View style={styles.modalContent}>
              {selectedProduct && (
                <>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalTitleSection}>
                      <Text style={styles.modalTitle}>{selectedProduct.name}</Text>
                      <Text style={styles.modalSubtitle}>{selectedProduct.type}</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.closeButton}
                      onPress={closeModals}
                    >
                      <Ionicons name="close" size={20} color="#6b7280" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalBody}>
                    <ScrollView 
                      style={styles.modalScrollView}
                      showsVerticalScrollIndicator={false}
                    >
                      {/* Product Image */}
                      {selectedProduct.imageUrl ? (
                        <View style={styles.modalImageContainer}>
                          <Image 
                            source={{ uri: selectedProduct.imageUrl }}
                            style={styles.modalImage}
                            resizeMode="cover"
                            onLoad={() => console.log('Modal image loaded successfully:', selectedProduct.name)}
                            onError={(error) => console.log('Modal image load error for', selectedProduct.name, ':', error.nativeEvent.error)}
                          />
                        </View>
                      ) : (
                        <View style={styles.modalImagePlaceholder}>
                          <Ionicons name="shirt-outline" size={60} color="#9ca3af" />
                          <Text style={styles.modalImagePlaceholderText}>No image available</Text>
                        </View>
                      )}

                      {/* Product Description */}
                      {selectedProduct.description && (
                        <View style={styles.modalDescriptionContainer}>
                          <Text style={styles.modalDescriptionLabel}>Description</Text>
                          <Text style={styles.modalDescription}>{selectedProduct.description}</Text>
                        </View>
                      )}
                    </ScrollView>

                    {/* Price and Points - Fixed at bottom */}
                    <View style={styles.modalFooter}>
                      <View style={styles.priceCard}>
                        <View style={styles.priceRow}>
                          <View style={styles.priceSection}>
                            <Text style={styles.modalPrice}>${selectedProduct.price}</Text>
                            <Text style={styles.modalPriceLabel}>Per item</Text>
                          </View>
                          <View style={styles.pointsSection}>
                            <View style={styles.pointsDisplay}>
                              <Ionicons name="star" size={18} color="#f59e0b" />
                              <Text style={styles.modalPoints}>{selectedProduct.points} pts</Text>
                            </View>
                            <Text style={styles.modalPointsLabel}>earned per purchase</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>

      </LinearGradient>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  backgroundGradient: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
  },

  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingSpinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(8, 145, 178, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  loadingText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },

  // Header Styles
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.8)',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },

  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  storeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0891b2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },

  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 20,
  },

  // Error Container
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },

  errorText: {
    color: '#ef4444',
    fontWeight: '600',
    marginLeft: 8,
  },

  // Section Styles
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },

  sectionHeader: {
    marginBottom: 16,
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginLeft: 8,
  },

  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 28,
  },

  // Grid Styles
  gridContainer: {
    paddingTop: 8,
  },

  gridRow: {
    justifyContent: 'space-between',
  },

  // Product Card Styles
  productCard: {
    width: itemWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  productImageContainer: {
    position: 'relative',
    marginBottom: 8,
  },

  productImage: {
    width: '100%',
    height: itemWidth * 0.8,
    borderRadius: 8,
  },

  placeholderImage: {
    width: '100%',
    height: itemWidth * 0.8,
    borderRadius: 8,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  availabilityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
  },

  availabilityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },

  productInfo: {
    flex: 1,
  },

  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },

  productType: {
    fontSize: 11,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },

  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  productPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0891b2',
  },

  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },

  pointsText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#f59e0b',
    marginLeft: 2,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },

  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },

  bottomSpacing: {
    height: 20,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  modalOverlayTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  modalContent: {
    width: '100%',
    maxHeight: '80%',
    minHeight: 500,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    zIndex: 1,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.3)',
  },

  modalBody: {
    flex: 1,
    paddingBottom: 20,
  },

  modalTitleSection: {
    flex: 1,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },

  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(107, 114, 128, 0.08)',
  },

  modalScrollView: {
    flex: 1,
  },

  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(229, 231, 235, 0.3)',
    backgroundColor: '#ffffff',
  },

  modalImageContainer: {
    padding: 20,
    paddingBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalImage: {
    width: '100%',
    height: 280,
    borderRadius: 12,
  },

  modalPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalPlaceholderText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },

  modalImagePlaceholder: {
    width: '100%',
    height: 280,
    borderRadius: 12,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalImagePlaceholderText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    fontWeight: '500',
  },

  modalDescriptionContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(243, 244, 246, 0.5)',
    borderRadius: 12,
  },

  modalDescriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },

  modalDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },

  priceCard: {
    margin: 16,
    padding: 20,
    backgroundColor: 'rgba(8, 145, 178, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(8, 145, 178, 0.1)',
  },

  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  priceSection: {
    alignItems: 'flex-start',
    flex: 1,
  },

  modalPrice: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0891b2',
  },

  modalPriceLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
    fontWeight: '500',
  },

  pointsSection: {
    alignItems: 'flex-end',
    flex: 1,
  },

  pointsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 4,
  },

  modalPoints: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f59e0b',
    marginLeft: 4,
  },

  modalPointsLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },

  infoCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.4)',
  },

  infoCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },

  infoCardText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },

  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },

  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },

  statusSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
  },

  instructionsCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.1)',
  },

  instructionsIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },

  instructionsContent: {
    flex: 1,
  },

  instructionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },

  instructionsText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },

  // Ticket Purchase Modal Styles
  ticketName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },

  ticketPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  inputGroup: {
    marginBottom: 16,
  },

};

export default StoreScreen;