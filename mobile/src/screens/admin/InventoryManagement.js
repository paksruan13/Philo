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
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { API_ROUTES } from '../../services/api';
import { Colors, Styles, Spacing, FontSizes, BorderRadius, Shadows } from '../../styles/theme';

const InventoryManagement = ({ navigation }) => {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [inventoryUpdates, setInventoryUpdates] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    type: 'HOODIE',
    price: '',
    points: '',
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
      console.error('Error fetching products:', error);
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

  const handleCreateProduct = async () => {
    try {
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
          sizes: productForm.sizes
        })
      });

      if (response.ok) {
        setSuccess('Product created successfully!');
        setProductForm({ 
          name: '', 
          type: 'HOODIE', 
          price: '', 
          points: '',
          sizes: { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, ONESIZE: 0 }
        });
        setShowProductForm(false);
        fetchProducts();
        setTimeout(() => setSuccess(''), 3000);
        Alert.alert('Success', 'Product created successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      setError('Failed to create product');
    }
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setInventoryUpdates({});
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
        // Update selected product
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
      console.error('Error updating inventory:', error);
      setError('Failed to update inventory');
    }
  };

  const ProductCard = ({ product }) => {
    const totalStock = product.inventory?.reduce((sum, inv) => sum + inv.quantity, 0) || 0;
    const isSelected = selectedProduct?.id === product.id;

    return (
      <TouchableOpacity 
        style={[
          styles.productCard,
          isSelected && styles.productCardSelected
        ]}
        onPress={() => handleProductSelect(product)}
      >
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productMeta}>
            {product.type} • ${product.price} • {product.points} points
          </Text>
          <Text style={styles.productStock}>
            Total Stock: {totalStock}
          </Text>
        </View>
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.selectedText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const InventoryCard = ({ inv, productId }) => {
    const updateKey = `${productId}-${inv.size}`;
    const currentValue = inventoryUpdates[updateKey] ?? inv.quantity;

    return (
      <View style={styles.inventoryCard}>
        <Text style={styles.sizeLabel}>{inv.size}</Text>
        <Text style={styles.currentStock}>Current: {inv.quantity}</Text>
        
        <TextInput
          style={styles.quantityInput}
          value={currentValue.toString()}
          onChangeText={(text) => setInventoryUpdates(prev => ({
            ...prev,
            [updateKey]: text
          }))}
          keyboardType="numeric"
          placeholder="Quantity"
          placeholderTextColor={Colors.mutedForeground}
        />
        
        <TouchableOpacity
          style={[
            styles.updateButton,
            inventoryUpdates[updateKey] === undefined && styles.disabledButton
          ]}
          onPress={() => handleUpdateInventory(productId, inv.size)}
          disabled={inventoryUpdates[updateKey] === undefined}
        >
          <Text style={styles.updateButtonText}>Update</Text>
        </TouchableOpacity>
      </View>
    );
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Inventory Management 📦</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowProductForm(true)}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Success/Error Messages */}
        {success ? (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>{success}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{products.length}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {products.reduce((sum, product) => 
                sum + (product.inventory?.reduce((invSum, inv) => invSum + inv.quantity, 0) || 0), 0
              )}
            </Text>
            <Text style={styles.statLabel}>Total Stock</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {products.filter(p => p.type === 'HOODIE').length}
            </Text>
            <Text style={styles.statLabel}>Hoodies</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {products.filter(p => p.type === 'TICKET').length}
            </Text>
            <Text style={styles.statLabel}>Tickets</Text>
          </View>
        </View>

        {/* Products List */}
        {products.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Product to Manage</Text>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products available</Text>
            <Text style={styles.emptySubText}>Get started by creating your first product.</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowProductForm(true)}
            >
              <Text style={styles.createButtonText}>Create First Product</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Inventory Management */}
        {selectedProduct && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Manage Inventory: {selectedProduct.name}
            </Text>
            <View style={styles.inventoryGrid}>
              {selectedProduct.inventory?.map(inv => (
                <InventoryCard 
                  key={inv.size} 
                  inv={inv} 
                  productId={selectedProduct.id} 
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.footerSpace} />
      </ScrollView>

      {/* Create Product Modal */}
      {showProductForm && (
        <ProductFormModal
          productForm={productForm}
          setProductForm={setProductForm}
          onClose={() => setShowProductForm(false)}
          onSave={handleCreateProduct}
        />
      )}
    </SafeAreaView>
  );
};

const ProductFormModal = ({ productForm, setProductForm, onClose, onSave }) => {
  const PRODUCT_TYPES = ['HOODIE', 'PANTS', 'SHIRT', 'TICKET'];
  const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Product</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Product Name */}
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Product Name</Text>
              <TextInput
                style={styles.textInput}
                value={productForm.name}
                onChangeText={(text) => setProductForm(prev => ({ ...prev, name: text }))}
                placeholder="Enter product name"
                placeholderTextColor={Colors.mutedForeground}
              />
            </View>

            {/* Product Type */}
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Product Type</Text>
              <View style={styles.pickerContainer}>
                {PRODUCT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.roleOption,
                      productForm.type === type && styles.roleOptionSelected
                    ]}
                    onPress={() => setProductForm(prev => ({ ...prev, type }))}
                  >
                    <Text style={[
                      styles.roleOptionText,
                      productForm.type === type && styles.roleOptionTextSelected
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Price */}
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Price ($)</Text>
              <TextInput
                style={styles.textInput}
                value={productForm.price}
                onChangeText={(text) => setProductForm(prev => ({ ...prev, price: text }))}
                placeholder="Enter price"
                placeholderTextColor={Colors.mutedForeground}
                keyboardType="decimal-pad"
              />
            </View>

            {/* Points */}
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Points</Text>
              <TextInput
                style={styles.textInput}
                value={productForm.points}
                onChangeText={(text) => setProductForm(prev => ({ ...prev, points: text }))}
                placeholder="Enter points"
                placeholderTextColor={Colors.mutedForeground}
                keyboardType="numeric"
              />
            </View>

            {/* Size Inventory */}
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Initial Inventory by Size</Text>
              {productForm.type === 'TICKET' ? (
                <View style={styles.sizeInputContainer}>
                  <Text style={styles.sizeInputLabel}>Quantity</Text>
                  <TextInput
                    style={styles.textInput}
                    value={productForm.sizes.ONESIZE.toString()}
                    onChangeText={(text) => setProductForm(prev => ({
                      ...prev,
                      sizes: { ONESIZE: parseInt(text) || 0 }
                    }))}
                    placeholder="0"
                    placeholderTextColor={Colors.mutedForeground}
                    keyboardType="numeric"
                  />
                </View>
              ) : (
                <View style={styles.sizesGrid}>
                  {SIZES.map(size => (
                    <View key={size} style={styles.sizeInputContainer}>
                      <Text style={styles.sizeInputLabel}>{size}</Text>
                      <TextInput
                        style={styles.sizeInput}
                        value={productForm.sizes[size].toString()}
                        onChangeText={(text) => setProductForm(prev => ({
                          ...prev,
                          sizes: { ...prev.sizes, [size]: parseInt(text) || 0 }
                        }))}
                        placeholder="0"
                        placeholderTextColor={Colors.mutedForeground}
                        keyboardType="numeric"
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.saveButton, (!productForm.name || !productForm.price || !productForm.points) && styles.disabledButton]}
              onPress={onSave}
              disabled={!productForm.name || !productForm.price || !productForm.points}
            >
              <Text style={styles.actionButtonText}>Create Product</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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

  // Modal Styles
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
};

export default InventoryManagement;
