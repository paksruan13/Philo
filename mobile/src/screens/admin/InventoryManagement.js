import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { API_ROUTES } from '../../services/api';
import { Colors, Styles, Spacing, FontSizes, BorderRadius, Shadows } from '../../styles/theme';
import PhotoUpload from '../../components/common/PhotoUpload';

const InventoryManagement = ({ navigation }) => {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [inventoryUpdates, setInventoryUpdates] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [modalAnimation] = useState(new Animated.Value(0));
  const [inventoryModalAnimation] = useState(new Animated.Value(0));
  const [productForm, setProductForm] = useState({
    name: '',
    type: 'HOODIE',
    price: '',
    points: '',
    imageUrl: '',
    description: '',
    sizes: {
      XS: 0,
      S: 0,
      M: 0,
      L: 0,
      XL: 0,
      XXL: 0,
      ONESIZE: 0
    }
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  
  const showModal = () => {
    setShowProductForm(true);
    Animated.timing(modalAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideModal = () => {
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowProductForm(false);
    });
  };

  
  const openInventoryModal = () => {
    setShowInventoryModal(true);
    Animated.timing(inventoryModalAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideInventoryModal = () => {
    Animated.timing(inventoryModalAnimation, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowInventoryModal(false);
      setSelectedProduct(null);
    });
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(API_ROUTES.products.list, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(Array.isArray(data) ? data : data.products || []);
      } else {
        setError('Failed to fetch products');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const handleDeleteProduct = async (productId) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(API_ROUTES.products.delete(productId), {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (response.ok) {
                setSuccess('Product deleted successfully!');
                setSelectedProduct(null);
                fetchProducts();
                setTimeout(() => setSuccess(''), 3000);
              } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to delete product');
                setTimeout(() => setError(''), 5000);
              }
            } catch (error) {
              setError('Failed to delete product');
              setTimeout(() => setError(''), 5000);
            }
          }
        }
      ]
    );
  };

  const handleCreateProduct = async () => {
    try {
      
      const getImageKey = () => {
        if (!productForm.imageUrl) return null;
        if (typeof productForm.imageUrl === 'string') return productForm.imageUrl;
        if (typeof productForm.imageUrl === 'object' && productForm.imageUrl.s3Key) {
          return productForm.imageUrl.s3Key;
        }
        return null;
      };

      const response = await fetch(API_ROUTES.products.create, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: productForm.name,
          type: productForm.type,
          price: parseFloat(productForm.price),
          points: parseInt(productForm.points),
          sizes: productForm.sizes,
          imageUrl: getImageKey(), 
          description: productForm.description || null
        })
      });

      if (response.ok) {
        setSuccess('Product created successfully!');
        setProductForm({ 
          name: '', 
          type: 'HOODIE', 
          price: '', 
          points: '',
          sizes: { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, ONESIZE: 0 },
          imageUrl: '',
          description: ''
        });
        hideModal();
        fetchProducts();
        setTimeout(() => setSuccess(''), 3000);
        Alert.alert('Success', 'Product created successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create product');
      }
    } catch (error) {
      setError('Failed to create product');
    }
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setInventoryUpdates({});
    openInventoryModal();
  };

  const handleUpdateInventory = async (productId, size) => {
    const newQuantity = inventoryUpdates[`${productId}-${size}`];
    if (newQuantity === undefined) return;

    try {
      const response = await fetch(API_ROUTES.products.inventory, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          size,
          quantity: parseInt(newQuantity)
        })
      });

      if (response.ok) {
        setSuccess('Inventory updated successfully!');
        fetchProducts();
        
        if (selectedProduct && selectedProduct.id === productId) {
          const updatedProducts = await fetch(API_ROUTES.products.list, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (updatedProducts.ok) {
            const data = await updatedProducts.json();
            const updatedProduct = (Array.isArray(data) ? data : data.products || []).find(p => p.id === productId);
            if (updatedProduct) {
              setSelectedProduct(updatedProduct);
            }
          }
        }
        setTimeout(() => setSuccess(''), 3000);
        Alert.alert('Success', 'Inventory updated successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update inventory');
      }
    } catch (error) {
      setError('Failed to update inventory');
    }
  };

  const ProductCard = ({ product }) => {
    const totalStock = product.inventory?.reduce((sum, inv) => sum + inv.quantity, 0) || 0;
    const isLowStock = totalStock < 10;

    return (
      <View style={styles.modernProductCard}>
        {/* Product Header */}
        <TouchableOpacity 
          style={styles.productCardHeader}
          onPress={() => handleProductSelect(product)}
        >
          <View style={styles.productCardLeft}>
            <View style={[
              styles.productTypeIcon,
              { backgroundColor: getProductTypeColor(product.type) }
            ]}>
              <Ionicons 
                name={getProductTypeIcon(product.type)} 
                size={20} 
                color="white" 
              />
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.modernProductName}>{product.name}</Text>
              <View style={styles.productMetaRow}>
                <Text style={styles.productType}>{product.type}</Text>
                <View style={styles.metaDivider} />
                <Text style={styles.productPrice}>${product.price}</Text>
                <View style={styles.metaDivider} />
                <Text style={styles.productPoints}>{product.points} pts</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.productCardRight}>
            <View style={[
              styles.stockBadge,
              isLowStock ? styles.lowStockBadge : styles.normalStockBadge
            ]}>
              <Ionicons 
                name={isLowStock ? "warning" : "cube"} 
                size={12} 
                color={isLowStock ? "#dc2626" : "#059669"} 
              />
              <Text style={[
                styles.stockText,
                isLowStock ? styles.lowStockText : styles.normalStockText
              ]}>
                {totalStock}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.productCardActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.manageButton]}
            onPress={() => handleProductSelect(product)}
          >
            <Ionicons name="settings" size={16} color="#7c3aed" />
            <Text style={styles.manageButtonText}>Manage Inventory</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteProduct(product.id)}
          >
            <Ionicons name="trash" size={16} color="#dc2626" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  
  const getProductTypeIcon = (type) => {
    switch (type) {
      case 'HOODIE': return 'shirt';
      case 'PANTS': return 'accessibility';
      case 'SHIRT': return 'shirt-outline';
      case 'TICKET': return 'ticket';
      default: return 'cube';
    }
  };

  const getProductTypeColor = (type) => {
    switch (type) {
      case 'HOODIE': return '#7c3aed';
      case 'PANTS': return '#059669';
      case 'SHIRT': return '#dc2626';
      case 'TICKET': return '#ea580c';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading inventory...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Header */}
        <View style={styles.modernHeader}>
          <TouchableOpacity 
            style={styles.modernBackButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#6b7280" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.modernTitle}>Inventory Management</Text>
            <Text style={styles.modernSubtitle}>Manage your product catalog</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.modernAddButton}
            onPress={showModal}
          >
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Modern Success/Error Messages */}
        {success ? (
          <View style={styles.modernSuccessContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#059669" />
            <Text style={styles.modernSuccessText}>{success}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.modernErrorContainer}>
            <Ionicons name="alert-circle" size={20} color="#dc2626" />
            <Text style={styles.modernErrorText}>{error}</Text>
          </View>
        ) : null}

        {/* Modern Stats */}
        <View style={styles.modernStatsContainer}>
          <View style={styles.modernStatCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="cube" size={20} color="#7c3aed" />
            </View>
            <Text style={styles.modernStatValue}>{products.length}</Text>
            <Text style={styles.modernStatLabel}>Products</Text>
          </View>
          
          <View style={styles.modernStatCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="archive" size={20} color="#059669" />
            </View>
            <Text style={styles.modernStatValue}>
              {products.reduce((sum, product) => 
                sum + (product.inventory?.reduce((invSum, inv) => invSum + inv.quantity, 0) || 0), 0
              )}
            </Text>
            <Text style={styles.modernStatLabel}>Total Stock</Text>
          </View>
          
          <View style={styles.modernStatCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="shirt" size={20} color="#dc2626" />
            </View>
            <Text style={styles.modernStatValue}>
              {products.filter(p => p.type === 'HOODIE').length}
            </Text>
            <Text style={styles.modernStatLabel}>Hoodies</Text>
          </View>
          
          <View style={styles.modernStatCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="ticket" size={20} color="#ea580c" />
            </View>
            <Text style={styles.modernStatValue}>
              {products.filter(p => p.type === 'TICKET').length}
            </Text>
            <Text style={styles.modernStatLabel}>Tickets</Text>
          </View>
        </View>

        {/* Products List */}
        {products.length > 0 ? (
          <View style={styles.modernSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="list" size={20} color="#6b7280" />
                <Text style={styles.modernSectionTitle}>Product Catalog</Text>
              </View>
              <Text style={styles.sectionSubtitle}>Tap any product to manage its inventory</Text>
            </View>
            <View style={styles.productsList}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.modernEmptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="cube-outline" size={48} color="#9ca3af" />
            </View>
            <Text style={styles.modernEmptyText}>No products available</Text>
            <Text style={styles.modernEmptySubText}>Get started by creating your first product</Text>
            <TouchableOpacity
              style={styles.modernCreateButton}
              onPress={showModal}
            >
              <Ionicons name="add" size={18} color="white" />
              <Text style={styles.modernCreateButtonText}>Create First Product</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.footerSpace} />
      </ScrollView>

      {/* Create Product Modal */}
      {showProductForm && (
        <ProductFormModal
          productForm={productForm}
          setProductForm={setProductForm}
          onClose={hideModal}
          onSave={handleCreateProduct}
          modalAnimation={modalAnimation}
        />
      )}

      {/* Inventory Management Modal */}
      {showInventoryModal && selectedProduct && (
        <InventoryManagementModal
          product={selectedProduct}
          inventoryUpdates={inventoryUpdates}
          setInventoryUpdates={setInventoryUpdates}
          onClose={hideInventoryModal}
          onUpdateInventory={handleUpdateInventory}
          modalAnimation={inventoryModalAnimation}
        />
      )}
    </SafeAreaView>
  );
};

const InventoryManagementModal = ({ 
  product, 
  inventoryUpdates, 
  setInventoryUpdates, 
  onClose, 
  onUpdateInventory, 
  modalAnimation 
}) => {
  const modalScale = modalAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  const modalOpacity = modalAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const backgroundOpacity = modalAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  const InventoryCard = ({ inv, productId }) => {
    const updateKey = `${productId}-${inv.size}`;
    const currentValue = inventoryUpdates[updateKey] ?? inv.quantity;
    const hasChanges = inventoryUpdates[updateKey] !== undefined;
    const isLowStock = inv.quantity < 5;

    return (
      <View style={styles.modernInventoryCard}>
        <View style={styles.inventoryCardHeader}>
          <View style={styles.sizeContainer}>
            <Text style={styles.modernSizeLabel}>{inv.size}</Text>
          </View>
          <View style={[
            styles.stockStatusBadge,
            isLowStock ? styles.lowStockBadge : styles.normalStockBadge
          ]}>
            <Ionicons 
              name={isLowStock ? "warning" : "checkmark-circle"} 
              size={12} 
              color={isLowStock ? "#dc2626" : "#059669"} 
            />
            <Text style={[
              styles.stockStatusText,
              isLowStock ? styles.lowStockText : styles.normalStockText
            ]}>
              {isLowStock ? 'Low' : 'Good'}
            </Text>
          </View>
        </View>
        
        <View style={styles.inventoryCardContent}>
          <View style={styles.currentStockRow}>
            <Text style={styles.currentStockLabel}>Current Stock</Text>
            <Text style={styles.currentStockValue}>{inv.quantity}</Text>
          </View>
          
          <View style={styles.updateRow}>
            <TextInput
              style={[
                styles.modernQuantityInput,
                hasChanges && styles.modernQuantityInputActive
              ]}
              value={currentValue.toString()}
              onChangeText={(text) => setInventoryUpdates(prev => ({
                ...prev,
                [updateKey]: text
              }))}
              keyboardType="numeric"
              placeholder="New quantity"
              placeholderTextColor="#9ca3af"
            />
            
            <TouchableOpacity
              style={[
                styles.modernUpdateButton,
                !hasChanges && styles.modernUpdateButtonDisabled
              ]}
              onPress={() => onUpdateInventory(productId, inv.size)}
              disabled={!hasChanges}
            >
              <Ionicons 
                name={hasChanges ? "save" : "checkmark"} 
                size={16} 
                color={hasChanges ? "white" : "#9ca3af"} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      transparent={true}
      visible={true}
      onRequestClose={onClose}
      animationType="none"
    >
      <Animated.View style={[
        styles.modalOverlay,
        { backgroundColor: backgroundOpacity.interpolate({
          inputRange: [0, 1],
          outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)']
        })}
      ]}>
        <Animated.View style={[
          styles.inventoryModalContent,
          {
            opacity: modalOpacity,
            transform: [{ scale: modalScale }]
          }
        ]}>
          {/* Modal Header */}
          <View style={styles.inventoryModalHeader}>
            <View style={styles.modalTitleSection}>
              <View style={styles.inventoryModalIconContainer}>
                <Ionicons name="settings" size={24} color="#7c3aed" />
              </View>
              <View style={styles.inventoryModalTitleContainer}>
                <Text style={styles.inventoryModalTitle}>Manage Inventory</Text>
                <Text style={styles.inventoryModalSubtitle}>{product.name}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.modernCloseButton} onPress={onClose}>
              <Ionicons name="close" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Product Info */}
          <View style={styles.inventoryModalProductInfo}>
            <View style={styles.productInfoRow}>
              <View style={styles.productInfoItem}>
                <Ionicons name="pricetag" size={16} color="#059669" />
                <Text style={styles.productInfoLabel}>Price</Text>
                <Text style={styles.productInfoValue}>${product.price}</Text>
              </View>
              <View style={styles.productInfoItem}>
                <Ionicons name="star" size={16} color="#ea580c" />
                <Text style={styles.productInfoLabel}>Points</Text>
                <Text style={styles.productInfoValue}>{product.points}</Text>
              </View>
              <View style={styles.productInfoItem}>
                <Ionicons name="cube" size={16} color="#7c3aed" />
                <Text style={styles.productInfoLabel}>Total Stock</Text>
                <Text style={styles.productInfoValue}>
                  {product.inventory?.reduce((sum, inv) => sum + inv.quantity, 0) || 0}
                </Text>
              </View>
            </View>
          </View>

          {/* Inventory Grid */}
          <ScrollView style={styles.inventoryModalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.inventoryModalGrid}>
              {product.inventory?.map(inv => (
                <InventoryCard 
                  key={inv.size} 
                  inv={inv} 
                  productId={product.id} 
                />
              ))}
            </View>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const ProductFormModal = ({ productForm, setProductForm, onClose, onSave, modalAnimation }) => {
  const PRODUCT_TYPES = [
    { key: 'HOODIE', label: 'Hoodie', icon: 'shirt' },
    { key: 'PANTS', label: 'Pants', icon: 'accessibility' },
    { key: 'SHIRT', label: 'Shirt', icon: 'shirt-outline' },
    { key: 'TICKET', label: 'Ticket', icon: 'ticket' }
  ];
  const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const modalScale = modalAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  const modalOpacity = modalAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const backgroundOpacity = modalAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  const selectedType = PRODUCT_TYPES.find(type => type.key === productForm.type);

  return (
    <Modal
      transparent={true}
      visible={true}
      onRequestClose={onClose}
      animationType="none"
    >
      <Animated.View style={[
        styles.modalOverlay,
        { backgroundColor: backgroundOpacity.interpolate({
          inputRange: [0, 1],
          outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)']
        })}
      ]}>
        <Animated.View style={[
          styles.modernModalContent,
          {
            opacity: modalOpacity,
            transform: [{ scale: modalScale }]
          }
        ]}>
          {/* Modern Header */}
          <View style={styles.modernModalHeader}>
            <View style={styles.modalTitleSection}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="add-circle" size={24} color="#7c3aed" />
              </View>
              <View>
                <Text style={styles.modernModalTitle}>Create New Product</Text>
                <Text style={styles.modernModalSubtitle}>Add a new product to your inventory</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.modernCloseButton} onPress={onClose}>
              <Ionicons name="close" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modernModalBody} showsVerticalScrollIndicator={false}>
            {/* Product Name */}
            <View style={styles.modernInputGroup}>
              <Text style={styles.modernInputLabel}>
                <Ionicons name="cube" size={14} color="#6b7280" /> Product Name
              </Text>
              <TextInput
                style={styles.modernTextInput}
                value={productForm.name}
                onChangeText={(text) => setProductForm(prev => ({ ...prev, name: text }))}
                placeholder="Enter product name..."
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Product Type Dropdown */}
            <View style={styles.modernInputGroup}>
              <Text style={styles.modernInputLabel}>
                <Ionicons name="layers" size={14} color="#6b7280" /> Product Type
              </Text>
              <TouchableOpacity
                style={[styles.modernDropdownButton, showTypeDropdown && styles.modernDropdownButtonActive]}
                onPress={() => setShowTypeDropdown(!showTypeDropdown)}
              >
                <View style={styles.modernDropdownContent}>
                  <View style={styles.modernDropdownLeft}>
                    <Ionicons 
                      name={selectedType?.icon || 'help-circle'} 
                      size={18} 
                      color={showTypeDropdown ? "#7c3aed" : "#6b7280"} 
                    />
                    <Text style={[
                      styles.modernDropdownText,
                      showTypeDropdown && styles.modernDropdownTextActive
                    ]}>
                      {selectedType?.label || 'Select type...'}
                    </Text>
                  </View>
                  <Ionicons 
                    name={showTypeDropdown ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color={showTypeDropdown ? "#7c3aed" : "#9ca3af"} 
                  />
                </View>
              </TouchableOpacity>
              
              {showTypeDropdown && (
                <View style={styles.modernDropdownOptions}>
                  {PRODUCT_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.key}
                      style={[
                        styles.modernDropdownOption,
                        productForm.type === type.key && styles.modernDropdownOptionSelected
                      ]}
                      onPress={() => {
                        setProductForm(prev => ({ ...prev, type: type.key }));
                        setShowTypeDropdown(false);
                      }}
                    >
                      <Ionicons 
                        name={type.icon} 
                        size={18} 
                        color={productForm.type === type.key ? "#7c3aed" : "#6b7280"} 
                      />
                      <Text style={[
                        styles.modernDropdownOptionText,
                        productForm.type === type.key && styles.modernDropdownOptionTextSelected
                      ]}>
                        {type.label}
                      </Text>
                      {productForm.type === type.key && (
                        <Ionicons name="checkmark" size={16} color="#7c3aed" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Price and Points Row */}
            <View style={styles.modernRowContainer}>
              <View style={[styles.modernInputGroup, styles.modernHalfWidth]}>
                <Text style={styles.modernInputLabel}>
                  <Ionicons name="cash" size={14} color="#6b7280" /> Price ($)
                </Text>
                <TextInput
                  style={styles.modernTextInput}
                  value={productForm.price}
                  onChangeText={(text) => setProductForm(prev => ({ ...prev, price: text }))}
                  placeholder="0.00"
                  placeholderTextColor="#9ca3af"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={[styles.modernInputGroup, styles.modernHalfWidth]}>
                <Text style={styles.modernInputLabel}>
                  <Ionicons name="star" size={14} color="#6b7280" /> Points
                </Text>
                <TextInput
                  style={styles.modernTextInput}
                  value={productForm.points}
                  onChangeText={(text) => setProductForm(prev => ({ ...prev, points: text }))}
                  placeholder="100"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Product Image Upload */}
            <View style={styles.modernInputGroup}>
              <Text style={styles.modernInputLabel}>
                <Ionicons name="image" size={14} color="#6b7280" /> Product Image
              </Text>
              <PhotoUpload
                value={productForm.imageUrl}
                onChange={(url) => setProductForm(prev => ({ ...prev, imageUrl: url }))}
                required={false}
              />
            </View>

            {/* Description */}
            <View style={styles.modernInputGroup}>
              <Text style={styles.modernInputLabel}>
                <Ionicons name="document-text" size={14} color="#6b7280" /> Description (Optional)
              </Text>
              <TextInput
                style={[styles.modernTextInput, styles.modernTextArea]}
                value={productForm.description}
                onChangeText={(text) => setProductForm(prev => ({ ...prev, description: text }))}
                placeholder="Enter product description..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Size Inventory */}
            <View style={styles.modernInputGroup}>
              <Text style={styles.modernInputLabel}>
                <Ionicons name="resize" size={14} color="#6b7280" /> Initial Inventory by Size
              </Text>
              {productForm.type === 'TICKET' ? (
                <View style={styles.modernTicketContainer}>
                  <View style={styles.modernTicketInput}>
                    <Ionicons name="ticket" size={20} color="#7c3aed" />
                    <Text style={styles.modernTicketLabel}>Ticket Quantity</Text>
                    <TextInput
                      style={styles.modernTicketQuantityInput}
                      value={productForm.sizes.ONESIZE.toString()}
                      onChangeText={(text) => setProductForm(prev => ({
                        ...prev,
                        sizes: { ONESIZE: parseInt(text) || 0 }
                      }))}
                      placeholder="0"
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.modernSizesGrid}>
                  {SIZES.map(size => (
                    <View key={size} style={styles.modernSizeCard}>
                      <View style={styles.modernSizeHeader}>
                        <Text style={styles.modernSizeLabel}>{size}</Text>
                        <View style={[styles.modernSizeBadge, 
                          productForm.sizes[size] > 0 && styles.modernSizeBadgeActive
                        ]}>
                          <Text style={[styles.modernSizeBadgeText,
                            productForm.sizes[size] > 0 && styles.modernSizeBadgeTextActive
                          ]}>
                            {productForm.sizes[size]}
                          </Text>
                        </View>
                      </View>
                      <TextInput
                        style={styles.modernSizeInput}
                        value={productForm.sizes[size].toString()}
                        onChangeText={(text) => setProductForm(prev => ({
                          ...prev,
                          sizes: { ...prev.sizes, [size]: parseInt(text) || 0 }
                        }))}
                        placeholder="0"
                        placeholderTextColor="#9ca3af"
                        keyboardType="numeric"
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Modern Footer Actions */}
          <View style={styles.modernModalActions}>
            <TouchableOpacity style={styles.modernCancelButton} onPress={onClose}>
              <Ionicons name="close-circle-outline" size={18} color="#6b7280" />
              <Text style={styles.modernCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.modernSaveButton, 
                (!productForm.name || !productForm.price || !productForm.points) && styles.modernSaveButtonDisabled
              ]}
              onPress={onSave}
              disabled={!productForm.name || !productForm.price || !productForm.points}
            >
              <Ionicons name="checkmark-circle" size={18} color="white" />
              <Text style={styles.modernSaveButtonText}>Create Product</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    fontSize: FontSizes.lg,
    color: Colors.mutedForeground,
  },

  scrollContainer: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.card,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },

  backButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },

  backButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '600',
  },

  title: {
    fontSize: FontSizes.base,
    fontWeight: 'bold',
    color: Colors.foreground,
    textAlign: 'center',
  },

  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },

  addButtonText: {
    color: Colors.primaryForeground,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },

  successContainer: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    backgroundColor: Colors.success + '20',
    borderColor: Colors.success,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },

  successText: {
    color: Colors.success,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },

  errorContainer: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    backgroundColor: Colors.error + '20',
    borderColor: Colors.error,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },

  errorText: {
    color: Colors.error,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },

  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    justifyContent: 'space-between',
  },

  statItem: {
    alignItems: 'center',
    flex: 1,
  },

  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.primary,
  },

  statLabel: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    marginTop: 4,
  },

  section: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.card,
  },

  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.foreground,
    marginBottom: Spacing.md,
  },

  productCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },

  productCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },

  productInfo: {
    flex: 1,
  },

  productName: {
    fontSize: FontSizes.base,
    fontWeight: 'bold',
    color: Colors.foreground,
    marginBottom: 4,
  },

  productMeta: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    marginBottom: 2,
  },

  productStock: {
    fontSize: FontSizes.xs,
    color: Colors.mutedForeground,
  },

  selectedIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  selectedText: {
    color: Colors.primaryForeground,
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
  },

  inventoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  inventoryCard: {
    width: '48%',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },

  sizeLabel: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.foreground,
    marginBottom: 4,
  },

  currentStock: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    marginBottom: Spacing.sm,
  },

  quantityInput: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.base,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.foreground,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    width: '100%',
  },

  updateButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    width: '100%',
    alignItems: 'center',
  },

  disabledButton: {
    opacity: 0.5,
  },

  updateButtonText: {
    color: Colors.primaryForeground,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
    marginHorizontal: Spacing.lg,
  },

  emptyText: {
    fontSize: FontSizes.lg,
    color: Colors.foreground,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  emptySubText: {
    fontSize: FontSizes.base,
    color: Colors.mutedForeground,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },

  createButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },

  createButtonText: {
    color: Colors.primaryForeground,
    fontSize: FontSizes.base,
    fontWeight: '600',
  },

  footerSpace: {
    height: Spacing.xl,
  },

  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    width: '90%',
    maxHeight: '80%',
    ...Shadows.modal,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.foreground,
  },

  closeButton: {
    padding: Spacing.sm,
  },

  closeButtonText: {
    fontSize: FontSizes.lg,
    color: Colors.mutedForeground,
  },

  modalBody: {
    padding: Spacing.lg,
  },

  detailSection: {
    marginBottom: Spacing.lg,
  },

  detailLabel: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    fontWeight: '600',
    marginBottom: 4,
  },

  textInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.base,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.foreground,
  },

  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background,
    marginTop: 4,
  },

  roleOption: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  roleOptionSelected: {
    backgroundColor: Colors.primary,
  },

  roleOptionText: {
    fontSize: FontSizes.base,
    color: Colors.foreground,
    fontWeight: '500',
  },

  roleOptionTextSelected: {
    color: Colors.primaryForeground,
    fontWeight: '600',
  },

  sizesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  sizeInputContainer: {
    width: '48%',
    marginBottom: Spacing.md,
    alignItems: 'center',
  },

  sizeInputLabel: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    fontWeight: '600',
    marginBottom: 4,
  },

  sizeInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.base,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.foreground,
    textAlign: 'center',
    width: '100%',
  },

  modalActions: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    justifyContent: 'space-between',
  },

  cancelButton: {
    backgroundColor: Colors.mutedForeground,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },

  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    flex: 1,
    marginLeft: Spacing.sm,
  },

  cancelButtonText: {
    fontSize: FontSizes.base,
    color: Colors.primaryForeground,
    fontWeight: '600',
  },

  actionButtonText: {
    fontSize: FontSizes.base,
    color: Colors.primaryForeground,
    fontWeight: '600',
  },

  
  modernModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '92%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },

  modernModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },

  modalTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  modalIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#faf7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  modernModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 22,
  },

  modernModalSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },

  modernCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modernModalBody: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    maxHeight: 450,
  },

  modernInputGroup: {
    marginBottom: 20,
  },

  modernInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  modernTextInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    color: '#111827',
    fontWeight: '500',
  },

  modernRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },

  modernHalfWidth: {
    flex: 1,
  },

  modernDropdownButton: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    minHeight: 52,
  },

  modernDropdownButtonActive: {
    borderColor: '#7c3aed',
    backgroundColor: '#faf7ff',
  },

  modernDropdownContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  modernDropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  modernDropdownText: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 12,
    fontWeight: '500',
  },

  modernDropdownTextActive: {
    color: '#111827',
  },

  modernDropdownOptions: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  modernDropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },

  modernDropdownOptionSelected: {
    backgroundColor: '#faf7ff',
  },

  modernDropdownOptionText: {
    fontSize: 15,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
    fontWeight: '500',
  },

  modernDropdownOptionTextSelected: {
    color: '#7c3aed',
    fontWeight: '600',
  },

  modernTicketContainer: {
    backgroundColor: '#faf7ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  modernTicketInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  modernTicketLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
    marginLeft: 12,
  },

  modernTicketQuantityInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    color: '#111827',
    textAlign: 'center',
    minWidth: 80,
    fontWeight: '600',
  },

  modernSizesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  modernSizeCard: {
    width: '30%',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 80,
  },

  modernSizeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  modernSizeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },

  modernSizeBadge: {
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },

  modernSizeBadgeActive: {
    backgroundColor: '#7c3aed',
  },

  modernSizeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
  },

  modernSizeBadgeTextActive: {
    color: 'white',
  },

  modernSizeInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#d1d5db',
    color: '#111827',
    textAlign: 'center',
    fontWeight: '600',
  },

  modernModalActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 12,
  },

  modernCancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },

  modernCancelButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },

  modernSaveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7c3aed',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },

  modernSaveButtonDisabled: {
    opacity: 0.5,
  },

  modernSaveButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },

  modernInputHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic',
  },

  modernTextArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },

  
  modernHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },

  modernBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },

  modernTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },

  modernSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
    textAlign: 'center',
  },

  modernAddButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  
  modernStatsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },

  modernStatCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  modernStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },

  modernStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center',
  },

  
  modernSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },

  sectionHeader: {
    marginBottom: 16,
  },

  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  modernSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 8,
  },

  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 28,
  },

  
  modernProductCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },

  modernProductCardSelected: {
    borderColor: '#7c3aed',
    borderWidth: 2,
    shadowColor: '#7c3aed',
    shadowOpacity: 0.2,
  },

  productCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },

  productCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  productTypeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  productInfo: {
    flex: 1,
  },

  modernProductName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },

  productMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  productType: {
    fontSize: 13,
    color: '#7c3aed',
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  metaDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d1d5db',
    marginHorizontal: 8,
  },

  productPrice: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
  },

  productPoints: {
    fontSize: 13,
    color: '#ea580c',
    fontWeight: '600',
  },

  productCardRight: {
    alignItems: 'center',
    gap: 8,
  },

  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },

  normalStockBadge: {
    backgroundColor: '#dcfce7',
  },

  lowStockBadge: {
    backgroundColor: '#fee2e2',
  },

  stockText: {
    fontSize: 12,
    fontWeight: '700',
  },

  normalStockText: {
    color: '#059669',
  },

  lowStockText: {
    color: '#dc2626',
  },

  selectedIndicator: {
    marginTop: 4,
  },

  productCardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },

  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },

  manageButton: {
    backgroundColor: '#faf7ff',
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },

  manageButtonText: {
    fontSize: 14,
    color: '#7c3aed',
    fontWeight: '600',
  },

  deleteButton: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },

  deleteButtonText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '600',
  },

  
  modernEmptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },

  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  modernEmptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },

  modernEmptySubText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },

  modernCreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7c3aed',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  modernCreateButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },

  
  modernInventoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  modernInventoryCard: {
    width: '47.5%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  inventoryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sizeContainer: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  stockStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },

  stockStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },

  inventoryCardContent: {
    gap: 12,
  },

  currentStockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  currentStockLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },

  currentStockValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '700',
  },

  updateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  modernQuantityInput: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    color: '#111827',
    fontWeight: '600',
    textAlign: 'center',
  },

  modernQuantityInputActive: {
    borderColor: '#7c3aed',
    backgroundColor: '#faf7ff',
  },

  modernUpdateButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modernUpdateButtonDisabled: {
    backgroundColor: '#f3f4f6',
  },

  productsList: {
    gap: 0,
  },

  
  modernSuccessContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    gap: 12,
  },

  modernSuccessText: {
    flex: 1,
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },

  modernErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 12,
  },

  modernErrorText: {
    flex: 1,
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '600',
  },

  
  inventoryModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '95%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },

  inventoryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },

  inventoryModalIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#faf7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  inventoryModalTitleContainer: {
    flex: 1,
  },

  inventoryModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 22,
  },

  inventoryModalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
    fontWeight: '500',
  },

  inventoryModalProductInfo: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },

  productInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  productInfoItem: {
    alignItems: 'center',
    gap: 4,
  },

  productInfoLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },

  productInfoValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '700',
  },

  inventoryModalBody: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    maxHeight: 400,
  },

  inventoryModalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
};

export default InventoryManagement;
