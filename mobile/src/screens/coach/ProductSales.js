import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../../styles/theme';
import { API_ROUTES, fetchWithTimeout } from '../../services/api';

const ProductSales = ({ navigation }) => {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState([]);
  const [students, setStudents] = useState([]);
  const [sales, setSales] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  
  // Sale form state
  const [saleForm, setSaleForm] = useState({
    productId: '',
    size: '',
    studentId: '',
    paymentMethod: 'CASH',
    quantity: 1,
    isExternalSale: false,
    externalCustomerName: '',
    externalCustomerEmail: ''
  });
  
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  
  // Modern dropdown states with search
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
  
  // Search states
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  
  // Animation
  const modalAnimation = new Animated.Value(0);

  // Filter functions for searchable dropdowns
  const getFilteredProducts = () => {
    if (!productSearchQuery.trim()) return products;
    
    return products.filter(product =>
      product.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
      product.type.toLowerCase().includes(productSearchQuery.toLowerCase())
    );
  };

  const getFilteredStudents = () => {
    if (!studentSearchQuery.trim()) return students;
    
    return students.filter(student =>
      student.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      student.team?.name.toLowerCase().includes(studentSearchQuery.toLowerCase())
    );
  };

  const getSelectedProduct = () => {
    return products.find(p => p.id == saleForm.productId);
  };

  const getSelectedStudent = () => {
    return students.find(s => s.id == saleForm.studentId);
  };

  const fetchData = async () => {
    try {
      setError('');
      setSuccess('');
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      let studentsData = [];
      let productsData = [];
      let salesData = [];
      
      // Fetch all students (coach endpoint provides access to all students for sales)
      try {
        const studentsResponse = await fetchWithTimeout(API_ROUTES.coach.students, {
          headers
        }, 15000);

        if (!studentsResponse.ok) {
          throw new Error(`HTTP ${studentsResponse.status}: ${studentsResponse.statusText}`);
        }
        studentsData = await studentsResponse.json();
        studentsData = Array.isArray(studentsData) ? studentsData : [];
      } catch (studentsError) {
        setError(prev => prev ? `${prev}; Students: ${studentsError.message}` : `Students: ${studentsError.message}`);
      }

      // Fetch products with inventory
      try {
        const productsResponse = await fetchWithTimeout(API_ROUTES.products.list, {
          headers
        }, 15000);

        if (!productsResponse.ok) {
          throw new Error(`HTTP ${productsResponse.status}: ${productsResponse.statusText}`);
        }
        productsData = await productsResponse.json();
      } catch (productsError) {
        setError(prev => prev ? `${prev}; Products: ${productsError.message}` : `Products: ${productsError.message}`);
      }

      // Fetch coach's sales
      try {
        const salesResponse = await fetchWithTimeout(API_ROUTES.productSales.coachSales, {
          headers
        }, 15000);

        if (!salesResponse.ok) {
          throw new Error(`HTTP ${salesResponse.status}: ${salesResponse.statusText}`);
        }
        salesData = await salesResponse.json();
      } catch (salesError) {
        setError(prev => prev ? `${prev}; Sales: ${salesError.message}` : `Sales: ${salesError.message}`);
      }

      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setSales(Array.isArray(salesData) ? salesData : []);
      
    } catch (error) {
      console.error('Unexpected error in fetchData:', error);
      setError(`Unexpected error: ${error.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getTotalRevenue = () => {
    return sales.reduce((sum, sale) => sum + sale.amountPaid, 0);
  };

  const getTotalPointsAwarded = () => {
    return sales.reduce((sum, sale) => sum + (sale.product.points * sale.quantity), 0);
  };

  // Get available sizes for selected product
  const getAvailableSizes = () => {
    const product = getSelectedProduct();
    return product ? product.inventory.filter(inv => inv.quantity > 0) : [];
  };

  const handleSaleFormChange = (field, value) => {
    
    setSaleForm(prev => {
      const newForm = { ...prev, [field]: value };
      
      // Reset size and quantity when product changes
      if (field === 'productId') {
        newForm.size = '';
        newForm.quantity = 1;
      }
      
      // Reset quantity when size changes
      if (field === 'size') {
        newForm.quantity = 1;
      }
      
      return newForm;
    });
  };

  const handleNewSale = (productId = null) => {
    // If a specific product is selected, pre-populate the form
    if (productId) {
      setSaleForm(prev => ({
        ...prev,
        productId: productId,
        size: '',
        quantity: 1
      }));
    } else {
      // Reset form for generic new sale
      setSaleForm({
        productId: '',
        size: '',
        studentId: '',
        paymentMethod: 'CASH',
        quantity: 1,
        isExternalSale: false,
        externalCustomerName: '',
        externalCustomerEmail: ''
      });
    }
    setError(''); // Clear any existing errors
    setShowSaleModal(true);
  };

  const handleSubmitSale = async () => {
    // Comprehensive validation checks
    if (saleForm.isExternalSale) {
      if (!saleForm.externalCustomerName.trim()) {
        setError('Please enter external customer name');
        return;
      }
    } else {
      if (!saleForm.studentId) {
        setError('Please select a student');
        return;
      }
    }
    
    if (!saleForm.productId) {
      setError('Please select a product');
      return;
    }
    
    if (!saleForm.size) {
      setError('Please select a size');
      return;
    }
    
    if (!saleForm.paymentMethod) {
      setError('Please select a payment method');
      return;
    }
    
    if (!saleForm.quantity || saleForm.quantity < 1) {
      setError('Quantity must be at least 1');
      return;
    }

    // Check inventory availability
    const selectedProduct = getSelectedProduct();
    if (selectedProduct) {
      const sizeInventory = selectedProduct.inventory.find(inv => inv.size === saleForm.size);
      if (!sizeInventory || sizeInventory.quantity < saleForm.quantity) {
        setError('Not enough inventory available for selected size');
        return;
      }
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      console.log('🛍️ PRODUCT SALE - Starting handleSubmitSale');
      console.log('Sale form data:', saleForm);

      const selectedProduct = getSelectedProduct();
      if (!selectedProduct) {
        throw new Error('Product not found');
      }

      console.log('Selected product:', selectedProduct);

      const requestBody = {
        productId: saleForm.productId,
        size: saleForm.size,
        paymentMethod: saleForm.paymentMethod,
        quantity: parseInt(saleForm.quantity),
        amountPaid: selectedProduct.price * saleForm.quantity,
        isExternalSale: saleForm.isExternalSale
      };

      if (saleForm.isExternalSale) {
        requestBody.externalCustomerName = saleForm.externalCustomerName;
        if (saleForm.externalCustomerEmail.trim()) {
          requestBody.externalCustomerEmail = saleForm.externalCustomerEmail;
        }
      } else {
        requestBody.userId = saleForm.studentId;
      }

      console.log('🛍️ PRODUCT SALE - Request body:', requestBody);
      console.log('🛍️ PRODUCT SALE - API URL:', API_ROUTES.productSales.sell);
      console.log('🛍️ PRODUCT SALE - Token present:', !!token);

      const response = await fetchWithTimeout(API_ROUTES.productSales.sell, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      }, 15000);

      console.log('🛍️ PRODUCT SALE - Response status:', response.status);
      console.log('🛍️ PRODUCT SALE - Response ok:', response.ok);

      if (!response.ok) {
        console.log('🛍️ PRODUCT SALE - API Error Response:', response.status, response.statusText);
        const errorData = await response.json();
        console.log('🛍️ PRODUCT SALE - Error data:', errorData);
        throw new Error(errorData.message || 'Failed to complete sale');
      }

      const saleData = await response.json();
      console.log('🛍️ PRODUCT SALE - Success response:', saleData);

      // Store sale details for confirmation
      const customerName = saleForm.isExternalSale 
        ? saleForm.externalCustomerName 
        : (students.find(s => s.id == saleForm.studentId)?.name || 'Unknown Student');

      setCompletedSale({
        productName: selectedProduct.name,
        size: saleForm.size,
        quantity: saleForm.quantity,
        unitPrice: selectedProduct.price,
        totalPrice: selectedProduct.price * saleForm.quantity,
        pointsPerItem: selectedProduct.points,
        totalPoints: saleForm.isExternalSale ? 0 : (selectedProduct.points * saleForm.quantity),
        studentName: customerName,
        paymentMethod: saleForm.paymentMethod,
        saleId: saleData.sale?.id || saleData.id,
        isExternalSale: saleForm.isExternalSale
      });

      // Show confirmation modal
      setShowConfirmation(true);
      setShowSaleModal(false);

      // Refresh data
      await fetchData();

      // Reset form
      setSaleForm({
        productId: '',
        size: '',
        studentId: '',
        paymentMethod: 'CASH',
        quantity: 1,
        isExternalSale: false,
        externalCustomerName: '',
        externalCustomerEmail: ''
      });

      setSuccess('Sale completed successfully!');
    } catch (err) {
      console.error('🛍️ PRODUCT SALE - Error creating sale:', err);
      console.error('🛍️ PRODUCT SALE - Error message:', err.message);
      console.error('🛍️ PRODUCT SALE - Error stack:', err.stack);
      console.error('🛍️ PRODUCT SALE - Sale API URL:', API_ROUTES.productSales.sell);
      console.error('🛍️ PRODUCT SALE - Sale form data:', saleForm);
      console.error('🛍️ PRODUCT SALE - Token present:', !!token);
      console.error('🛍️ PRODUCT SALE - Selected product:', selectedProduct);
      setError(err.message || 'Failed to complete sale');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSale = (saleId) => {
    Alert.alert(
      'Delete Sale',
      'Are you sure you want to delete this sale? This will restore inventory and remove any points awarded.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              setError('');
              setSuccess('');

              const response = await fetchWithTimeout(API_ROUTES.productSales.delete(saleId), {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                }
              }, 15000);

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete sale');
              }

              // Remove from sales array after successful API call
              setSales(prevSales => prevSales.filter(sale => sale.id !== saleId));
              setSuccess('Sale deleted successfully! Inventory has been restored.');
              
              // Refresh data to ensure everything is up to date
              await fetchData();
            } catch (err) {
              console.error('Error deleting sale:', err);
              setError(err.message || 'Failed to delete sale');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderProductCard = ({ item: product }) => (
    <View style={styles.productCard}>
      <View style={styles.productHeader}>
        <View style={styles.productInfo}>
          <View style={styles.productTitleRow}>
            <Ionicons name="cube-outline" size={18} color={Colors.primary} />
            <Text style={styles.productName}>{product.name}</Text>
          </View>
          <View style={styles.productDetailsRow}>
            <View style={styles.productDetail}>
              <Ionicons name="pricetag" size={14} color={Colors.mutedForeground} />
              <Text style={styles.productType}>{product.type}</Text>
            </View>
          </View>
          <View style={styles.productPriceRow}>
            <View style={styles.productDetail}>
              <Ionicons name="cash" size={16} color="#22c55e" />
              <Text style={styles.productPrice}>${product.price}</Text>
            </View>
            <View style={styles.productDetail}>
              <Ionicons name="star" size={16} color="#f59e0b" />
              <Text style={styles.productPoints}>{product.points} pts</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.sellButton}
          onPress={() => handleNewSale(product.id)}
        >
          <Ionicons name="bag-add" size={16} color={Colors.primaryForeground} />
          <Text style={styles.sellButtonText}>Sell</Text>
        </TouchableOpacity>
      </View>

      {/* Inventory */}
      <View style={styles.inventorySection}>
        <View style={styles.inventoryHeader}>
          <Ionicons name="cube" size={14} color={Colors.mutedForeground} />
          <Text style={styles.inventoryTitle}>Available Sizes</Text>
        </View>
        <View style={styles.inventoryRow}>
          {product.inventory?.map((inv, index) => (
            <View
              key={index}
              style={[
                styles.inventoryItem,
                inv.quantity === 0 && styles.outOfStock
              ]}
            >
              <Text style={[
                styles.inventoryText,
                inv.quantity === 0 && styles.outOfStockText
              ]}>
                {inv.size}: {inv.quantity}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderSaleCard = ({ item: sale }) => (
    <View style={styles.saleCard}>
      <View style={styles.saleHeader}>
        <View style={styles.saleInfo}>
          <View style={styles.saleProductRow}>
            <Ionicons name="cube" size={16} color={Colors.primary} />
            <Text style={styles.saleProduct}>{sale.product.name}</Text>
          </View>
          <View style={styles.saleStudentRow}>
            <Ionicons name="person" size={14} color={Colors.mutedForeground} />
            <Text style={styles.saleStudent}>
              {sale.isExternalSale 
                ? sale.externalCustomerName 
                : (sale.user?.name || 'Unknown User')
              }
            </Text>
            <Ionicons name="people" size={12} color={Colors.mutedForeground} />
            <Text style={styles.saleTeam}>
              {sale.isExternalSale 
                ? 'External Customer' 
                : (sale.user?.team?.name || 'No Team')
              }
            </Text>
          </View>
          <View style={styles.saleDetailsRow}>
            <View style={styles.saleDetailItem}>
              <Ionicons name="resize" size={12} color={Colors.mutedForeground} />
              <Text style={styles.saleDetails}>Size: {sale.size}</Text>
            </View>
            <View style={styles.saleDetailItem}>
              <Ionicons name="copy" size={12} color={Colors.mutedForeground} />
              <Text style={styles.saleDetails}>Qty: {sale.quantity}</Text>
            </View>
            <View style={styles.saleDetailItem}>
              <Ionicons name={sale.paymentMethod === 'CASH' ? "cash" : "card"} size={12} color={Colors.mutedForeground} />
              <Text style={styles.saleDetails}>{sale.paymentMethod}</Text>
            </View>
          </View>
          <View style={styles.saleDateRow}>
            <Ionicons name="time" size={12} color={Colors.mutedForeground} />
            <Text style={styles.saleDate}>
              {new Date(sale.soldAt).toLocaleDateString()} • {new Date(sale.soldAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </Text>
          </View>
        </View>
        <View style={styles.saleAmount}>
          <View style={styles.salePriceRow}>
            <Ionicons name="cash" size={16} color="#22c55e" />
            <Text style={styles.salePrice}>${sale.amountPaid.toFixed(2)}</Text>
          </View>
          <View style={styles.salePointsRow}>
            <Ionicons name="star" size={14} color="#f59e0b" />
            <Text style={styles.salePoints}>+{sale.product.points * sale.quantity} pts</Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.deleteSaleButton}
        onPress={() => handleDeleteSale(sale.id)}
        disabled={loading}
      >
        <Ionicons name="trash" size={14} color={Colors.destructiveForeground} />
        <Text style={styles.deleteSaleText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Ionicons name="storefront" size={24} color={Colors.primary} />
            <Text style={styles.title}>Product Sales</Text>
          </View>
          
          <View style={styles.headerSpacer} />
        </View>

        {/* Messages */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        
        {success ? (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>{success}</Text>
          </View>
        ) : null}

        {/* Summary Stats */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIconContainer}>
                <Ionicons name="receipt" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.summaryNumber}>{sales.length}</Text>
              <Text style={styles.summaryLabel}>Total Sales</Text>
            </View>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIconContainer}>
                <Ionicons name="cash" size={20} color="#22c55e" />
              </View>
              <Text style={[styles.summaryNumber, { color: '#22c55e' }]}>${getTotalRevenue().toFixed(2)}</Text>
              <Text style={styles.summaryLabel}>Revenue</Text>
            </View>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIconContainer}>
                <Ionicons name="star" size={20} color="#f59e0b" />
              </View>
              <Text style={[styles.summaryNumber, { color: '#f59e0b' }]}>{getTotalPointsAwarded()}</Text>
              <Text style={styles.summaryLabel}>Points Awarded</Text>
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'products' && styles.activeTab]}
            onPress={() => setActiveTab('products')}
          >
            <Ionicons 
              name="cube" 
              size={16} 
              color={activeTab === 'products' ? Colors.primary : Colors.mutedForeground} 
            />
            <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>
              Products ({products.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'sales' && styles.activeTab]}
            onPress={() => setActiveTab('sales')}
          >
            <Ionicons 
              name="receipt" 
              size={16} 
              color={activeTab === 'sales' ? Colors.primary : Colors.mutedForeground} 
            />
            <Text style={[styles.tabText, activeTab === 'sales' && styles.activeTabText]}>
              Sales ({sales.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {(activeTab === 'products' ? products : sales).length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {activeTab === 'products' ? 'No Products Available' : 'No Sales Yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'products' ? 
                'Products will appear here when added to inventory.' :
                'Sales you make will appear here.'
              }
            </Text>
          </View>
        ) : (
          <View style={styles.contentContainer}>
            {(activeTab === 'products' ? products : sales).map((item) => 
              activeTab === 'products' 
                ? <View key={`product-${item.id}`}>{renderProductCard({ item })}</View>
                : <View key={`sale-${item.id}`}>{renderSaleCard({ item })}</View>
            )}
          </View>
        )}
        
        <View style={styles.footerSpace} />
      </ScrollView>

      {/* Sale Modal */}
      <Modal
        visible={showSaleModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <Ionicons name="bag-add" size={24} color={Colors.primary} />
              <Text style={styles.modalTitle}>
                {saleForm.productId ? 
                  `Sell ${products.find(p => p.id == saleForm.productId)?.name || 'Product'}` : 
                  'New Sale'
                }
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowSaleModal(false)}
            >
              <Ionicons name="close" size={20} color={Colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Error display in modal */}
          {error ? (
            <View style={styles.modalErrorContainer}>
              <Text style={styles.modalErrorText}>{error}</Text>
            </View>
          ) : null}

          <ScrollView 
            style={styles.modalContent}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Product Preview when pre-selected */}
            {saleForm.productId && (
              <View style={styles.productPreview}>
                <Text style={styles.productPreviewTitle}>Selling:</Text>
                <View style={styles.productPreviewContent}>
                  <Text style={styles.productPreviewName}>
                    {getSelectedProduct()?.name}
                  </Text>
                  <Text style={styles.productPreviewDetails}>
                    ${getSelectedProduct()?.price} • {getSelectedProduct()?.points} points • {getSelectedProduct()?.type}
                  </Text>
                  <View style={styles.productPreviewSizes}>
                    <Text style={styles.productPreviewSizesTitle}>Available sizes:</Text>
                    <View style={styles.productPreviewSizesList}>
                      {getSelectedProduct()?.inventory?.map((inv, index) => (
                        <Text key={index} style={[
                          styles.productPreviewSize,
                          inv.quantity === 0 && styles.productPreviewSizeOutOfStock
                        ]}>
                          {inv.size}: {inv.quantity}
                        </Text>
                      ))}
                    </View>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.changeProductButton}
                  onPress={() => setShowProductDropdown(true)}
                >
                  <Text style={styles.changeProductButtonText}>Change Product</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Customer Type Toggle */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                <Ionicons name="people" size={16} color="#374151" /> Customer Type
              </Text>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.toggleOption,
                    !saleForm.isExternalSale && styles.toggleOptionActive
                  ]}
                  onPress={() => {
                    handleSaleFormChange('isExternalSale', false);
                    // Clear external customer fields when switching to internal
                    handleSaleFormChange('externalCustomerName', '');
                    handleSaleFormChange('externalCustomerEmail', '');
                  }}
                >
                  <Ionicons 
                    name="school" 
                    size={16} 
                    color={!saleForm.isExternalSale ? Colors.primary : '#6b7280'} 
                  />
                  <Text style={[
                    styles.toggleOptionText,
                    !saleForm.isExternalSale && styles.toggleOptionActiveText
                  ]}>
                    Student
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.toggleOption,
                    saleForm.isExternalSale && styles.toggleOptionActive
                  ]}
                  onPress={() => {
                    handleSaleFormChange('isExternalSale', true);
                    // Clear student selection when switching to external
                    handleSaleFormChange('studentId', '');
                  }}
                >
                  <Ionicons 
                    name="person-add" 
                    size={16} 
                    color={saleForm.isExternalSale ? Colors.primary : '#6b7280'} 
                  />
                  <Text style={[
                    styles.toggleOptionText,
                    saleForm.isExternalSale && styles.toggleOptionActiveText
                  ]}>
                    External Customer
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* External Customer Fields */}
            {saleForm.isExternalSale && (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    <Ionicons name="person" size={16} color="#374151" /> Customer Name *
                  </Text>
                  <View style={[styles.inputContainer, !saleForm.externalCustomerName.trim() && styles.inputRequired]}>
                    <Ionicons name="person-outline" size={18} color="#6b7280" />
                    <TextInput
                      style={styles.textInput}
                      value={saleForm.externalCustomerName}
                      onChangeText={(text) => handleSaleFormChange('externalCustomerName', text)}
                      placeholder="Enter customer name"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    <Ionicons name="mail" size={16} color="#374151" /> Customer Email (Optional)
                  </Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={18} color="#6b7280" />
                    <TextInput
                      style={styles.textInput}
                      value={saleForm.externalCustomerEmail}
                      onChangeText={(text) => handleSaleFormChange('externalCustomerEmail', text)}
                      placeholder="Enter customer email"
                      placeholderTextColor="#9ca3af"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>
              </>
            )}

            {/* Student Selection */}
            {!saleForm.isExternalSale && (
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                <Ionicons name="person" size={16} color="#374151" /> Student
              </Text>
              <TouchableOpacity
                style={[styles.inputContainer, !saleForm.studentId && styles.inputRequired]}
                onPress={() => {
                  setShowStudentDropdown(!showStudentDropdown);
                  if (!showStudentDropdown) {
                    setStudentSearchQuery('');
                  }
                }}
              >
                <Ionicons name="person-outline" size={18} color="#6b7280" />
                <Text style={[styles.inputText, !saleForm.studentId && styles.placeholderText]}>
                  {saleForm.studentId 
                    ? getSelectedStudent()?.name
                    : 'Select student...'
                  }
                </Text>
                <Ionicons 
                  name={showStudentDropdown ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color="#6b7280" 
                />
              </TouchableOpacity>
              
              {showStudentDropdown && (
                <View style={styles.dropdownContainer}>
                  <View style={styles.searchContainer}>
                    <Ionicons name="search" size={16} color="#6b7280" />
                    <TextInput
                      style={styles.searchInput}
                      value={studentSearchQuery}
                      onChangeText={setStudentSearchQuery}
                      placeholder="Search students or teams..."
                      placeholderTextColor="#9ca3af"
                      autoFocus={true}
                    />
                    {studentSearchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setStudentSearchQuery('')}>
                        <Ionicons name="close-circle" size={16} color="#9ca3af" />
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  <ScrollView 
                    style={styles.studentsScrollContainer}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                  >
                    {getFilteredStudents().length > 0 ? (
                      getFilteredStudents().map((student) => (
                        <TouchableOpacity
                          key={student.id}
                          style={[
                            styles.dropdownOption,
                            saleForm.studentId === student.id && styles.dropdownOptionSelected
                          ]}
                          onPress={() => {
                            handleSaleFormChange('studentId', student.id);
                            setShowStudentDropdown(false);
                            setStudentSearchQuery('');
                          }}
                        >
                          <View style={styles.studentOptionAvatar}>
                            <Text style={styles.studentOptionAvatarText}>
                              {student.name?.charAt(0)?.toUpperCase()}
                            </Text>
                          </View>
                          <View style={styles.studentOptionInfo}>
                            <Text style={[
                              styles.dropdownOptionText,
                              saleForm.studentId === student.id && styles.dropdownOptionTextSelected
                            ]}>
                              {student.name}
                            </Text>
                            <Text style={styles.studentTeamText}>
                              <Ionicons name="people" size={12} color="#6b7280" /> {student.team?.name || 'No Team'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View style={styles.noResultsContainer}>
                        <Ionicons name="search" size={24} color="#9ca3af" />
                        <Text style={styles.noResultsText}>No students found</Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>
            )}

            {/* Product Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                <Ionicons name="cube" size={16} color="#374151" /> Product
              </Text>
              <TouchableOpacity
                style={[styles.inputContainer, !saleForm.productId && styles.inputRequired]}
                onPress={() => {
                  setShowProductDropdown(!showProductDropdown);
                  if (!showProductDropdown) {
                    setProductSearchQuery('');
                  }
                }}
              >
                <Ionicons name="cube-outline" size={18} color="#6b7280" />
                <Text style={[styles.inputText, !saleForm.productId && styles.placeholderText]}>
                  {saleForm.productId 
                    ? getSelectedProduct()?.name
                    : 'Select product...'
                  }
                </Text>
                <Ionicons 
                  name={showProductDropdown ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color="#6b7280" 
                />
              </TouchableOpacity>
              
              {showProductDropdown && (
                <View style={styles.dropdownContainer}>
                  <View style={styles.searchContainer}>
                    <Ionicons name="search" size={16} color="#6b7280" />
                    <TextInput
                      style={styles.searchInput}
                      value={productSearchQuery}
                      onChangeText={setProductSearchQuery}
                      placeholder="Search products..."
                      placeholderTextColor="#9ca3af"
                      autoFocus={true}
                    />
                    {productSearchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setProductSearchQuery('')}>
                        <Ionicons name="close-circle" size={16} color="#9ca3af" />
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  <ScrollView 
                    style={styles.studentsScrollContainer}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                  >
                    {getFilteredProducts().length > 0 ? (
                      getFilteredProducts().map((product) => (
                        <TouchableOpacity
                          key={product.id}
                          style={[
                            styles.dropdownOption,
                            saleForm.productId === product.id && styles.dropdownOptionSelected
                          ]}
                          onPress={() => {
                            handleSaleFormChange('productId', product.id);
                            setShowProductDropdown(false);
                            setProductSearchQuery('');
                          }}
                        >
                          <View style={styles.productOptionIcon}>
                            <Ionicons name="cube" size={16} color={Colors.primary} />
                          </View>
                          <View style={styles.productOptionInfo}>
                            <Text style={[
                              styles.dropdownOptionText,
                              saleForm.productId === product.id && styles.dropdownOptionTextSelected
                            ]}>
                              {product.name}
                            </Text>
                            <Text style={styles.productTypeText}>
                              <Ionicons name="pricetag" size={12} color="#6b7280" /> {product.type}
                            </Text>
                          </View>
                          <View style={styles.productPriceContainer}>
                            <Text style={styles.productPriceText}>${product.price}</Text>
                            <Text style={styles.productPointsText}>
                              <Ionicons name="star" size={10} color="#f59e0b" /> {product.points} pts
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View style={styles.noResultsContainer}>
                        <Ionicons name="search" size={24} color="#9ca3af" />
                        <Text style={styles.noResultsText}>No products found</Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Size Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                <Ionicons name="resize" size={16} color="#374151" /> Size
              </Text>
              <TouchableOpacity
                style={[
                  styles.inputContainer, 
                  !saleForm.productId && styles.inputDisabled,
                  !saleForm.size && saleForm.productId && styles.inputRequired
                ]}
                onPress={() => saleForm.productId && setShowSizeDropdown(!showSizeDropdown)}
                disabled={!saleForm.productId}
              >
                <Ionicons name="resize-outline" size={18} color={!saleForm.productId ? "#9ca3af" : "#6b7280"} />
                <Text style={[
                  styles.inputText, 
                  !saleForm.productId && styles.disabledText,
                  !saleForm.size && styles.placeholderText
                ]}>
                  {!saleForm.productId ? 'Select a product first' :
                   saleForm.size 
                    ? `${saleForm.size} (${getAvailableSizes().find(s => s.size === saleForm.size)?.quantity || 0} available)`
                    : 'Select size...'
                  }
                </Text>
                <Ionicons 
                  name={showSizeDropdown ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color={!saleForm.productId ? "#9ca3af" : "#6b7280"} 
                />
              </TouchableOpacity>
              
              {showSizeDropdown && saleForm.productId && (
                <View style={styles.dropdownContainer}>
                  <ScrollView 
                    style={styles.studentsScrollContainer}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                  >
                    {getAvailableSizes().map((sizeItem, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.dropdownOption,
                          saleForm.size === sizeItem.size && styles.dropdownOptionSelected
                        ]}
                        onPress={() => {
                          handleSaleFormChange('size', sizeItem.size);
                          setShowSizeDropdown(false);
                        }}
                      >
                        <View style={styles.sizeOptionIcon}>
                          <Ionicons name="resize" size={16} color={Colors.primary} />
                        </View>
                        <View style={styles.sizeOptionInfo}>
                          <Text style={[
                            styles.dropdownOptionText,
                            saleForm.size === sizeItem.size && styles.dropdownOptionTextSelected
                          ]}>
                            Size {sizeItem.size}
                          </Text>
                          <Text style={styles.sizeAvailableText}>
                            <Ionicons name="cube" size={12} color="#6b7280" /> {sizeItem.quantity} available
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Quantity */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                <Ionicons name="copy" size={16} color="#374151" /> Quantity
              </Text>
              <View style={[styles.inputContainer, !saleForm.size && styles.inputDisabled]}>
                <Ionicons name="copy-outline" size={18} color={!saleForm.size ? "#9ca3af" : "#6b7280"} />
                <TextInput
                  style={[styles.quantityInput, !saleForm.size && styles.disabledText]}
                  value={saleForm.quantity.toString()}
                  onChangeText={(value) => {
                    const qty = parseInt(value) || 1;
                    const maxAvailable = getAvailableSizes().find(inv => inv.size === saleForm.size)?.quantity || 1;
                    const finalQty = Math.min(Math.max(qty, 1), maxAvailable);
                    handleSaleFormChange('quantity', finalQty);
                  }}
                  keyboardType="numeric"
                  placeholder="1"
                  placeholderTextColor="#9ca3af"
                  editable={!!saleForm.size}
                />
              </View>
              {saleForm.size && (
                <Text style={styles.quantityHelper}>
                  <Ionicons name="information-circle" size={12} color="#6b7280" /> Max available: {getAvailableSizes().find(inv => inv.size === saleForm.size)?.quantity || 0}
                </Text>
              )}
            </View>

            {/* Payment Method */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                <Ionicons name="card" size={16} color="#374151" /> Payment Method
              </Text>
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => setShowPaymentDropdown(!showPaymentDropdown)}
              >
                <Ionicons name={saleForm.paymentMethod === 'CASH' ? "cash" : "card"} size={18} color="#6b7280" />
                <Text style={styles.inputText}>
                  {saleForm.paymentMethod === 'CASH' ? 'Cash' : 'Venmo'}
                </Text>
                <Ionicons 
                  name={showPaymentDropdown ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color="#6b7280" 
                />
              </TouchableOpacity>
              
              {showPaymentDropdown && (
                <View style={styles.dropdownContainer}>
                  {['CASH', 'VENMO'].map((method) => (
                    <TouchableOpacity
                      key={method}
                      style={[
                        styles.dropdownOption,
                        saleForm.paymentMethod === method && styles.dropdownOptionSelected
                      ]}
                      onPress={() => {
                        handleSaleFormChange('paymentMethod', method);
                        setShowPaymentDropdown(false);
                      }}
                    >
                      <View style={styles.paymentOptionIcon}>
                        <Ionicons name={method === 'CASH' ? "cash" : "card"} size={16} color={Colors.primary} />
                      </View>
                      <Text style={[
                        styles.dropdownOptionText,
                        saleForm.paymentMethod === method && styles.dropdownOptionTextSelected
                      ]}>
                        {method === 'CASH' ? 'Cash' : 'Venmo'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Venmo QR Code Display */}
              {saleForm.paymentMethod === 'VENMO' && (
                <View style={styles.venmoQRContainer}>
                  <Text style={styles.venmoQRTitle}>
                    <Ionicons name="qr-code" size={16} color="#374151" /> Venmo QR Code
                  </Text>
                  <View style={styles.qrCodeImageContainer}>
                    <Image
                      source={require('../../../assets/venmo-qr.png')}
                      style={styles.qrCodeImageLarge}
                      resizeMode="contain"
                    />
                    <Text style={styles.qrCodeHelper}>
                      Show this QR code to the student for Venmo payment
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Order Summary */}
            {saleForm.productId && (
              <View style={styles.orderSummaryContainer}>
                <View style={styles.orderSummaryHeader}>
                  <Ionicons name="receipt" size={18} color={Colors.primary} />
                  <Text style={styles.orderSummaryTitle}>Order Summary</Text>
                </View>
                <View style={styles.orderSummaryContent}>
                  <View style={styles.orderSummaryRow}>
                    <View style={styles.orderSummaryItem}>
                      <Ionicons name="cube" size={14} color="#6b7280" />
                      <Text style={styles.orderSummaryProduct}>
                        {getSelectedProduct()?.name}{saleForm.size ? ` - ${saleForm.size}` : ''} × {saleForm.quantity}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.orderSummaryRow}>
                    <View style={styles.orderSummaryPricing}>
                      <View style={styles.orderSummaryPriceItem}>
                        <Ionicons name="cash" size={14} color="#22c55e" />
                        <Text style={styles.orderSummaryDetails}>
                          ${getSelectedProduct()?.price} × {saleForm.quantity} = ${((getSelectedProduct()?.price || 0) * saleForm.quantity).toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.orderSummaryPriceItem}>
                        <Ionicons name="star" size={14} color="#f59e0b" />
                        <Text style={styles.orderSummaryDetails}>
                          {getSelectedProduct()?.points} × {saleForm.quantity} = {(getSelectedProduct()?.points || 0) * saleForm.quantity} pts
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton, 
                (loading || 
                 !saleForm.productId || 
                 !saleForm.size || 
                 (saleForm.isExternalSale ? !saleForm.externalCustomerName.trim() : !saleForm.studentId) ||
                 !saleForm.quantity || 
                 saleForm.quantity < 1) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmitSale}
              disabled={loading || 
                       !saleForm.productId || 
                       !saleForm.size || 
                       (saleForm.isExternalSale ? !saleForm.externalCustomerName.trim() : !saleForm.studentId) ||
                       !saleForm.quantity || 
                       saleForm.quantity < 1}
            >
              <Ionicons 
                name={loading ? "hourglass" : "checkmark-circle"} 
                size={18} 
                color={Colors.primaryForeground} 
              />
              <Text style={styles.submitButtonText}>
                {loading ? 'Processing...' : 'Complete Sale'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmation}
        animationType="fade"
        transparent
      >
        <View style={styles.confirmationOverlay}>
          <View style={styles.confirmationModal}>
            <View style={styles.confirmationHeader}>
              <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
              <Text style={styles.confirmationTitle}>Sale Completed!</Text>
            </View>
            {completedSale && (
              <View style={styles.confirmationContent}>
                <View style={styles.confirmationRow}>
                  <Ionicons name="cube" size={16} color={Colors.mutedForeground} />
                  <Text style={styles.confirmationLabel}>Product:</Text>
                  <Text style={styles.confirmationValue}>
                    {completedSale.productName} ({completedSale.size})
                  </Text>
                </View>
                <View style={styles.confirmationRow}>
                  <Ionicons name="person" size={16} color={Colors.mutedForeground} />
                  <Text style={styles.confirmationLabel}>
                    {completedSale.isExternalSale ? 'Customer:' : 'Student:'}
                  </Text>
                  <Text style={styles.confirmationValue}>{completedSale.studentName}</Text>
                </View>
                <View style={styles.confirmationRow}>
                  <Ionicons name="copy" size={16} color={Colors.mutedForeground} />
                  <Text style={styles.confirmationLabel}>Quantity:</Text>
                  <Text style={styles.confirmationValue}>{completedSale.quantity}</Text>
                </View>
                <View style={styles.confirmationRow}>
                  <Ionicons name="cash" size={16} color="#22c55e" />
                  <Text style={styles.confirmationLabel}>Total:</Text>
                  <Text style={[styles.confirmationValue, { color: '#22c55e', fontWeight: 'bold' }]}>
                    ${completedSale.totalPrice?.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.confirmationRow}>
                  <Ionicons name="star" size={16} color="#f59e0b" />
                  <Text style={styles.confirmationLabel}>Points Awarded:</Text>
                  <Text style={[styles.confirmationValue, { color: completedSale.totalPoints > 0 ? '#f59e0b' : '#6b7280', fontWeight: 'bold' }]}>
                    {completedSale.totalPoints > 0 ? completedSale.totalPoints : 'No points (external sale)'}
                  </Text>
                </View>
                <View style={styles.confirmationRow}>
                  <Ionicons name={completedSale.paymentMethod === 'CASH' ? "cash" : "card"} size={16} color={Colors.mutedForeground} />
                  <Text style={styles.confirmationLabel}>Payment:</Text>
                  <Text style={styles.confirmationValue}>{completedSale.paymentMethod}</Text>
                </View>
              </View>
            )}
            <TouchableOpacity
              style={styles.confirmationButton}
              onPress={() => setShowConfirmation(false)}
            >
              <Ionicons name="checkmark" size={18} color={Colors.primaryForeground} />
              <Text style={styles.confirmationButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>




    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerSpace: {
    height: Spacing.xl,
  },
  loadingText: {
    fontSize: FontSizes.lg,
    color: Colors.mutedForeground,
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  headerSpacer: {
    width: 44, // Same width as back button to center the title
  },
  newSaleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  newSaleButtonText: {
    color: Colors.primaryForeground,
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Message Styles
  errorContainer: {
    margin: 16,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
  },
  successContainer: {
    margin: 16,
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  successText: {
    color: '#16a34a',
    fontSize: 14,
    textAlign: 'center',
  },
  
  // Summary Styles
  summarySection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    alignItems: 'center',
    minHeight: 100,
  },
  summaryIconContainer: {
    marginBottom: 8,
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  
  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.mutedForeground,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  
  // Product Card Styles
  productCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
    gap: 6,
  },
  productTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  productDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  productType: {
    fontSize: 14,
    color: '#6b7280',
  },
  productPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#22c55e',
  },
  productPoints: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f59e0b',
  },
  sellButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  sellButtonText: {
    color: Colors.primaryForeground,
    fontSize: 14,
    fontWeight: '600',
  },
  inventorySection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  inventoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  inventoryTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  inventoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  inventoryItem: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  outOfStock: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  inventoryText: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '500',
  },
  outOfStockText: {
    color: '#dc2626',
  },
  
  // Sale Card Styles
  saleCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  saleInfo: {
    flex: 1,
    gap: 6,
  },
  saleProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saleProduct: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  saleStudentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saleStudent: {
    fontSize: 14,
    color: '#6b7280',
  },
  saleTeam: {
    fontSize: 14,
    color: '#6b7280',
  },
  saleDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  saleDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  saleDetails: {
    fontSize: 13,
    color: '#6b7280',
  },
  saleDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  saleDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  saleAmount: {
    alignItems: 'flex-end',
    gap: 4,
  },
  salePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  salePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  salePointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  salePoints: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '600',
  },
  deleteSaleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
  },
  deleteSaleText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '500',
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  modalErrorContainer: {
    margin: 16,
    marginBottom: 0,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  modalErrorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
  },
  
  // Product Preview Styles
  productPreview: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  productPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  productPreviewContent: {
    gap: 6,
  },
  productPreviewName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  productPreviewDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  productPreviewSizes: {
    marginTop: 8,
  },
  productPreviewSizesTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
  },
  productPreviewSizesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  productPreviewSize: {
    fontSize: 12,
    color: '#16a34a',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  productPreviewSizeOutOfStock: {
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  changeProductButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  changeProductButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  
  // Form Styles (Modern like ManagePoints)
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  toggleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  toggleOptionActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  toggleOptionActiveText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    paddingVertical: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 10,
  },
  inputRequired: {
    borderColor: '#dc2626',
    borderWidth: 1.5,
  },
  inputDisabled: {
    backgroundColor: '#f9fafb',
    opacity: 0.7,
  },
  inputText: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
  },
  placeholderText: {
    color: '#9ca3af',
  },
  disabledText: {
    color: '#9ca3af',
  },
  quantityInput: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    paddingVertical: 2,
  },
  quantityHelper: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  // Dropdown Styles (Like ManagePoints)
  dropdownContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxHeight: 300,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#374151',
    paddingVertical: 4,
  },
  studentsScrollContainer: {
    maxHeight: 240,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    gap: 10,
  },
  dropdownOptionSelected: {
    backgroundColor: '#f0f9ff',
    borderBottomColor: '#dbeafe',
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#1f2937',
  },
  dropdownOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  
  // Student Option Styles
  studentOptionAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentOptionAvatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  studentOptionInfo: {
    flex: 1,
  },
  studentTeamText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  // Product Option Styles
  productOptionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productOptionInfo: {
    flex: 1,
  },
  productTypeText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  productPriceContainer: {
    alignItems: 'flex-end',
  },
  productPriceText: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
  },
  productPointsText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500',
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  
  // Size Option Styles
  sizeOptionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeOptionInfo: {
    flex: 1,
  },
  sizeAvailableText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  // Payment Option Styles
  paymentOptionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Venmo QR Code Styles
  venmoQRContainer: {
    marginTop: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  venmoQRTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qrCodeImageContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrCodeImageLarge: {
    width: 240,
    height: 240,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  qrCodeHelper: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 12,
    fontWeight: '500',
  },
  
  // Full Size QR Modal Styles
  qrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrModalBackgroundTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  qrModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  qrModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  qrModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  qrModalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6b7280',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrModalImageContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrModalImage: {
    width: 280,
    height: 280,
  },
  qrModalHelper: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // No Results
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  noResultsText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    fontWeight: '500',
  },
  
  // Order Summary
  orderSummaryContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  orderSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  orderSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  orderSummaryContent: {
    gap: 8,
  },
  orderSummaryRow: {
    gap: 6,
  },
  orderSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderSummaryProduct: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  orderSummaryPricing: {
    gap: 4,
  },
  orderSummaryPriceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderSummaryDetails: {
    fontSize: 13,
    color: '#6b7280',
  },
  
  // Submit Button
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 20,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  submitButtonText: {
    color: Colors.primaryForeground,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Confirmation Modal
  confirmationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmationModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  confirmationHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  confirmationContent: {
    gap: 12,
    marginBottom: 20,
  },
  confirmationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confirmationLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    width: 80,
  },
  confirmationValue: {
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
  },
  confirmationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  confirmationButtonText: {
    color: Colors.primaryForeground,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProductSales;
