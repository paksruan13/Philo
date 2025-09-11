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
} from 'react-native';
// Using custom dropdowns instead of picker for better UX
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
    quantity: 1
  });
  
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  
  // Dropdown states
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);

  // Debug modal states
  useEffect(() => {
    console.log('Modal states:', {
      showSaleModal,
      showProductDropdown,
      showStudentDropdown,
      showSizeDropdown,
      showPaymentDropdown
    });
  }, [showSaleModal, showProductDropdown, showStudentDropdown, showSizeDropdown, showPaymentDropdown]);

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
        console.log('Fetching all students from:', API_ROUTES.coach.students);
        const studentsResponse = await fetchWithTimeout(API_ROUTES.coach.students, {
          headers
        }, 15000);

        if (!studentsResponse.ok) {
          throw new Error(`HTTP ${studentsResponse.status}: ${studentsResponse.statusText}`);
        }
        studentsData = await studentsResponse.json();
        studentsData = Array.isArray(studentsData) ? studentsData : [];
        console.log('All students fetched successfully:', studentsData.length);
      } catch (studentsError) {
        console.error('Failed to fetch all students:', studentsError);
        setError(prev => prev ? `${prev}; Students: ${studentsError.message}` : `Students: ${studentsError.message}`);
      }

      // Fetch products with inventory
      try {
        console.log('Fetching products from:', API_ROUTES.products.list);
        const productsResponse = await fetchWithTimeout(API_ROUTES.products.list, {
          headers
        }, 15000);

        if (!productsResponse.ok) {
          throw new Error(`HTTP ${productsResponse.status}: ${productsResponse.statusText}`);
        }
        productsData = await productsResponse.json();
        console.log('Products fetched successfully:', productsData.length);
      } catch (productsError) {
        console.error('Failed to fetch products:', productsError);
        setError(prev => prev ? `${prev}; Products: ${productsError.message}` : `Products: ${productsError.message}`);
      }

      // Fetch coach's sales
      try {
        console.log('Fetching sales from:', API_ROUTES.productSales.coachSales);
        const salesResponse = await fetchWithTimeout(API_ROUTES.productSales.coachSales, {
          headers
        }, 15000);

        if (!salesResponse.ok) {
          throw new Error(`HTTP ${salesResponse.status}: ${salesResponse.statusText}`);
        }
        salesData = await salesResponse.json();
        console.log('Sales fetched successfully:', salesData.length);
      } catch (salesError) {
        console.error('Failed to fetch sales:', salesError);
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

  // Get selected product details
  const getSelectedProduct = () => {
    return products.find(p => p.id == saleForm.productId); // Use == to handle string/number comparison
  };

  // Get available sizes for selected product
  const getAvailableSizes = () => {
    const product = getSelectedProduct();
    return product ? product.inventory.filter(inv => inv.quantity > 0) : [];
  };

  const handleSaleFormChange = (field, value) => {
    console.log('Form field changed:', field, '=', value);
    
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
      
      console.log('Updated form state:', newForm);
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
        quantity: 1
      });
    }
    setError(''); // Clear any existing errors
    setShowSaleModal(true);
  };

  const handleSubmitSale = async () => {
    // Comprehensive validation checks
    if (!saleForm.studentId) {
      setError('Please select a student');
      return;
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

      const selectedProduct = getSelectedProduct();
      if (!selectedProduct) {
        throw new Error('Product not found');
      }

      const response = await fetchWithTimeout(API_ROUTES.productSales.sell, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: saleForm.productId, // Send as-is like web version
          size: saleForm.size,
          userId: saleForm.studentId, // Send as-is like web version
          paymentMethod: saleForm.paymentMethod,
          quantity: parseInt(saleForm.quantity),
          amountPaid: selectedProduct.price * saleForm.quantity
        })
      }, 15000);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to complete sale');
      }

      const saleData = await response.json();

      // Store sale details for confirmation
      const studentName = students.find(s => s.id == saleForm.studentId)?.name || 'Unknown Student';

      setCompletedSale({
        productName: selectedProduct.name,
        size: saleForm.size,
        quantity: saleForm.quantity,
        unitPrice: selectedProduct.price,
        totalPrice: selectedProduct.price * saleForm.quantity,
        pointsPerItem: selectedProduct.points,
        totalPoints: selectedProduct.points * saleForm.quantity,
        studentName: studentName,
        paymentMethod: saleForm.paymentMethod,
        saleId: saleData.sale?.id || saleData.id
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
        quantity: 1
      });

      setSuccess('Sale completed successfully!');
    } catch (err) {
      console.error('Error creating sale:', err);
      console.error('Sale API URL:', API_ROUTES.productSales.sell);
      console.error('Sale data sent:', {
        productId: saleForm.productId,
        size: saleForm.size,
        userId: saleForm.studentId,
        paymentMethod: saleForm.paymentMethod,
        quantity: parseInt(saleForm.quantity),
        amountPaid: selectedProduct?.price * saleForm.quantity
      });
      setError(err.message || 'Failed to complete sale');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSale = (saleId) => {
    Alert.alert(
      'Delete Sale',
      'Are you sure you want to delete this sale?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setSuccess('Sale deleted successfully!');
            // Remove from sales array
            setSales(prevSales => prevSales.filter(sale => sale.id !== saleId));
          }
        }
      ]
    );
  };

  const renderProductCard = ({ item: product }) => (
    <View style={styles.productCard}>
      <View style={styles.productHeader}>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productType}>{product.type}</Text>
          <Text style={styles.productPrice}>${product.price} • {product.points} points</Text>
        </View>
        <TouchableOpacity
          style={styles.sellButton}
          onPress={() => handleNewSale(product.id)}
        >
          <Text style={styles.sellButtonText}>Sell</Text>
        </TouchableOpacity>
      </View>

      {/* Inventory */}
      <View style={styles.inventorySection}>
        <Text style={styles.inventoryTitle}>Available Sizes:</Text>
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
          <Text style={styles.saleProduct}>{sale.product.name}</Text>
          <Text style={styles.saleStudent}>{sale.user.name} • {sale.user.team?.name || 'No Team'}</Text>
          <Text style={styles.saleDetails}>
            Size: {sale.size} • Qty: {sale.quantity} • {sale.paymentMethod}
          </Text>
          <Text style={styles.saleDate}>
            {new Date(sale.soldAt).toLocaleDateString()} • {new Date(sale.soldAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </Text>
        </View>
        <View style={styles.saleAmount}>
          <Text style={styles.salePrice}>${sale.amountPaid.toFixed(2)}</Text>
          <Text style={styles.salePoints}>+{sale.product.points * sale.quantity} pts</Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.deleteSaleButton}
        onPress={() => handleDeleteSale(sale.id)}
        disabled={loading}
      >
        <Text style={styles.deleteSaleText}>Delete Sale</Text>
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
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Product Sales 🛍️</Text>
          <TouchableOpacity 
            style={styles.newSaleButton} 
            onPress={handleNewSale}
          >
            <Text style={styles.newSaleButtonText}>+ New</Text>
          </TouchableOpacity>
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
            <Text style={styles.summaryNumber}>{sales.length}</Text>
            <Text style={styles.summaryLabel}>Total Sales</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>${getTotalRevenue().toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Revenue</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{getTotalPointsAwarded()}</Text>
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
            <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>
              Products ({products.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'sales' && styles.activeTab]}
            onPress={() => setActiveTab('sales')}
          >
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
            <Text style={styles.modalTitle}>
              {saleForm.productId ? 
                `Sell ${products.find(p => p.id == saleForm.productId)?.name || 'Product'}` : 
                'New Sale'
              }
            </Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowSaleModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Error display in modal */}
          {error ? (
            <View style={styles.modalErrorContainer}>
              <Text style={styles.modalErrorText}>{error}</Text>
            </View>
          ) : null}

          <ScrollView style={styles.modalContent}>
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

            {/* Student Selection - Like UserManagement */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Student *</Text>
              <TouchableOpacity
                style={[styles.dropdownButton, !saleForm.studentId && styles.required]}
                onPress={() => setShowStudentDropdown(!showStudentDropdown)}
              >
                <Text style={[styles.dropdownText, !saleForm.studentId && styles.placeholderText]}>
                  {saleForm.studentId 
                    ? `${students.find(s => s.id == saleForm.studentId)?.name} (${students.find(s => s.id == saleForm.studentId)?.team?.name || 'No Team'})`
                    : 'Select a student'
                  }
                </Text>
                <Text style={styles.dropdownArrow}>{showStudentDropdown ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              
              {showStudentDropdown && (
                <View style={styles.pickerContainer}>
                  {students.map((student) => (
                    <TouchableOpacity
                      key={student.id}
                      style={[
                        styles.roleOption,
                        saleForm.studentId === student.id && styles.roleOptionSelected
                      ]}
                      onPress={() => {
                        handleSaleFormChange('studentId', student.id);
                        setShowStudentDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.roleOptionText,
                        saleForm.studentId === student.id && styles.roleOptionTextSelected
                      ]}>
                        {student.name} ({student.team?.name || 'No Team'})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Product Selection - Like UserManagement */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Product *</Text>
              <TouchableOpacity
                style={[styles.dropdownButton, !saleForm.productId && styles.required]}
                onPress={() => setShowProductDropdown(!showProductDropdown)}
              >
                <Text style={[styles.dropdownText, !saleForm.productId && styles.placeholderText]}>
                  {saleForm.productId 
                    ? `${products.find(p => p.id == saleForm.productId)?.name} - $${products.find(p => p.id == saleForm.productId)?.price} (${products.find(p => p.id == saleForm.productId)?.points} points)`
                    : 'Select a product'
                  }
                </Text>
                <Text style={styles.dropdownArrow}>{showProductDropdown ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              
              {showProductDropdown && (
                <View style={styles.pickerContainer}>
                  {products.map((product) => (
                    <TouchableOpacity
                      key={product.id}
                      style={[
                        styles.roleOption,
                        saleForm.productId === product.id && styles.roleOptionSelected
                      ]}
                      onPress={() => {
                        handleSaleFormChange('productId', product.id);
                        setShowProductDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.roleOptionText,
                        saleForm.productId === product.id && styles.roleOptionTextSelected
                      ]}>
                        {product.name} - ${product.price} ({product.points} pts)
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Size Selection - Like UserManagement */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Size *</Text>
              <TouchableOpacity
                style={[
                  styles.dropdownButton, 
                  !saleForm.productId && styles.disabled,
                  !saleForm.size && saleForm.productId && styles.required
                ]}
                onPress={() => saleForm.productId && setShowSizeDropdown(!showSizeDropdown)}
                disabled={!saleForm.productId}
              >
                <Text style={[
                  styles.dropdownText, 
                  !saleForm.productId && styles.disabledText,
                  !saleForm.size && styles.placeholderText
                ]}>
                  {!saleForm.productId ? 'Select a product first' :
                   saleForm.size 
                    ? `${saleForm.size} (${getAvailableSizes().find(s => s.size === saleForm.size)?.quantity || 0} available)`
                    : 'Select a size'
                  }
                </Text>
                <Text style={styles.dropdownArrow}>{showSizeDropdown ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              
              {showSizeDropdown && saleForm.productId && (
                <View style={styles.pickerContainer}>
                  {getAvailableSizes().map((sizeItem, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.roleOption,
                        saleForm.size === sizeItem.size && styles.roleOptionSelected
                      ]}
                      onPress={() => {
                        handleSaleFormChange('size', sizeItem.size);
                        setShowSizeDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.roleOptionText,
                        saleForm.size === sizeItem.size && styles.roleOptionTextSelected
                      ]}>
                        {sizeItem.size} ({sizeItem.quantity} available)
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Quantity */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Quantity *</Text>
              <TextInput
                style={[styles.textInput, !saleForm.size && styles.disabled]}
                value={saleForm.quantity.toString()}
                onChangeText={(value) => {
                  const qty = parseInt(value) || 1;
                  const maxAvailable = getAvailableSizes().find(inv => inv.size === saleForm.size)?.quantity || 1;
                  const finalQty = Math.min(Math.max(qty, 1), maxAvailable);
                  handleSaleFormChange('quantity', finalQty);
                }}
                keyboardType="numeric"
                placeholder="1"
                editable={!!saleForm.size}
              />
              {saleForm.size && (
                <Text style={styles.quantityHelper}>
                  Max available: {getAvailableSizes().find(inv => inv.size === saleForm.size)?.quantity || 0}
                </Text>
              )}
            </View>

            {/* Payment Method - Like UserManagement */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Payment Method</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowPaymentDropdown(!showPaymentDropdown)}
              >
                <Text style={styles.dropdownText}>
                  {saleForm.paymentMethod === 'CASH' ? 'Cash' : 'Venmo'}
                </Text>
                <Text style={styles.dropdownArrow}>{showPaymentDropdown ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              
              {showPaymentDropdown && (
                <View style={styles.pickerContainer}>
                  {['CASH', 'VENMO'].map((method) => (
                    <TouchableOpacity
                      key={method}
                      style={[
                        styles.roleOption,
                        saleForm.paymentMethod === method && styles.roleOptionSelected
                      ]}
                      onPress={() => {
                        handleSaleFormChange('paymentMethod', method);
                        setShowPaymentDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.roleOptionText,
                        saleForm.paymentMethod === method && styles.roleOptionTextSelected
                      ]}>
                        {method === 'CASH' ? 'Cash' : 'Venmo'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Order Summary - Like web version */}
            {saleForm.productId && (
              <View style={styles.orderSummaryContainer}>
                <Text style={styles.orderSummaryTitle}>Order Summary:</Text>
                <Text style={styles.orderSummaryProduct}>
                  {getSelectedProduct()?.name}{saleForm.size ? ` - ${saleForm.size}` : ''} × {saleForm.quantity}
                </Text>
                <Text style={styles.orderSummaryDetails}>
                  Unit Price: ${getSelectedProduct()?.price} | Points: {getSelectedProduct()?.points} each
                </Text>
                <Text style={styles.orderSummaryTotal}>
                  Total: ${((getSelectedProduct()?.price || 0) * saleForm.quantity).toFixed(2)} | 
                  Total Points: {(getSelectedProduct()?.points || 0) * saleForm.quantity}
                </Text>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton, 
                (loading || !saleForm.productId || !saleForm.size || !saleForm.studentId || !saleForm.quantity || saleForm.quantity < 1) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmitSale}
              disabled={loading || !saleForm.productId || !saleForm.size || !saleForm.studentId || !saleForm.quantity || saleForm.quantity < 1}
            >
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
            <Text style={styles.confirmationTitle}>✅ Sale Completed!</Text>
            {completedSale && (
              <View style={styles.confirmationContent}>
                <Text style={styles.confirmationText}>
                  <Text style={styles.confirmationLabel}>Product: </Text>
                  {completedSale.productName} ({completedSale.size})
                </Text>
                <Text style={styles.confirmationText}>
                  <Text style={styles.confirmationLabel}>Student: </Text>
                  {completedSale.studentName}
                </Text>
                <Text style={styles.confirmationText}>
                  <Text style={styles.confirmationLabel}>Quantity: </Text>
                  {completedSale.quantity}
                </Text>
                <Text style={styles.confirmationText}>
                  <Text style={styles.confirmationLabel}>Total: </Text>
                  ${completedSale.totalPrice?.toFixed(2)}
                </Text>
                <Text style={styles.confirmationText}>
                  <Text style={styles.confirmationLabel}>Points Awarded: </Text>
                  {completedSale.totalPoints}
                </Text>
                <Text style={styles.confirmationText}>
                  <Text style={styles.confirmationLabel}>Payment: </Text>
                  {completedSale.paymentMethod}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.confirmationButton}
              onPress={() => setShowConfirmation(false)}
            >
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
    backgroundColor: Colors.background,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
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
    flex: 1,
    fontSize: FontSizes.base,
    fontWeight: 'bold',
    color: Colors.foreground,
    textAlign: 'center',
  },
  newSaleButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    minWidth: 60,
  },
  newSaleButtonText: {
    color: Colors.primaryForeground,
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  errorContainer: {
    margin: Spacing.lg,
    marginTop: 0,
    padding: Spacing.md,
    backgroundColor: Colors.destructive,
    borderRadius: BorderRadius.md,
  },
  errorText: {
    color: Colors.destructiveForeground,
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  successContainer: {
    margin: Spacing.lg,
    marginTop: 0,
    padding: Spacing.md,
    backgroundColor: '#22c55e',
    borderRadius: BorderRadius.md,
  },
  successText: {
    color: '#ffffff',
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  summarySection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    paddingTop: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    flex: 1,
    minHeight: 80,
    ...Shadows.sm,
  },
  summaryNumber: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    fontSize: FontSizes.xs,
    color: Colors.mutedForeground,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.muted,
    padding: Spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: Colors.card,
    ...Shadows.sm,
  },
  tabText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.mutedForeground,
  },
  activeTabText: {
    color: Colors.foreground,
  },
  listContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  productCard: {
    backgroundColor: Colors.card,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: Spacing.xs,
  },
  productType: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    marginBottom: 2,
  },
  productPrice: {
    fontSize: FontSizes.base,
    color: Colors.primary,
    fontWeight: '600',
  },
  sellButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: 80,
    alignItems: 'center',
  },
  sellButtonText: {
    color: Colors.primaryForeground,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  inventorySection: {
    marginTop: Spacing.sm,
  },
  inventoryTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: Spacing.sm,
  },
  inventoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  inventoryItem: {
    backgroundColor: '#22c55e20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  outOfStock: {
    backgroundColor: '#ef444420',
  },
  inventoryText: {
    fontSize: FontSizes.xs,
    color: '#16a34a',
    fontWeight: '600',
  },
  outOfStockText: {
    color: '#dc2626',
  },
  saleCard: {
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  saleInfo: {
    flex: 1,
  },
  saleProduct: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: Spacing.xs,
  },
  saleStudent: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    marginBottom: 2,
  },
  saleDetails: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    marginBottom: 2,
  },
  saleDate: {
    fontSize: FontSizes.xs,
    color: Colors.mutedForeground,
  },
  saleAmount: {
    alignItems: 'flex-end',
  },
  salePrice: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: '#22c55e',
    marginBottom: 2,
  },
  salePoints: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  deleteSaleButton: {
    backgroundColor: Colors.destructive,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
  },
  deleteSaleText: {
    color: Colors.destructiveForeground,
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSizes.lg,
    color: Colors.mutedForeground,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Sale Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },

  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.foreground,
    flex: 1,
  },

  closeButton: {
    padding: Spacing.sm,
    backgroundColor: Colors.muted,
    borderRadius: BorderRadius.full,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeButtonText: {
    fontSize: FontSizes.lg,
    color: Colors.mutedForeground,
    fontWeight: 'bold',
  },

  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },

  formGroup: {
    marginBottom: Spacing.lg,
  },

  formLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: Spacing.sm,
  },

  dropdownButton: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 50,
  },

  dropdownText: {
    fontSize: FontSizes.md,
    color: Colors.foreground,
    flex: 1,
  },

  placeholderText: {
    color: Colors.mutedForeground,
  },

  dropdownArrow: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
  },

  textInput: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.md,
    color: Colors.foreground,
    height: 50,
  },

  quantityHelper: {
    fontSize: FontSizes.xs,
    color: Colors.mutedForeground,
    marginTop: Spacing.xs,
  },

  summaryContainer: {
    backgroundColor: Colors.muted,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginVertical: Spacing.md,
  },

  summaryTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.foreground,
    marginBottom: Spacing.sm,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },

  summaryText: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
  },

  summaryValue: {
    fontSize: FontSizes.sm,
    color: Colors.foreground,
    fontWeight: '500',
  },

  summaryTextBold: {
    fontSize: FontSizes.md,
    color: Colors.foreground,
    fontWeight: 'bold',
  },

  summaryValueBold: {
    fontSize: FontSizes.md,
    color: Colors.primary,
    fontWeight: 'bold',
  },

  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },

  submitButtonDisabled: {
    backgroundColor: Colors.muted,
  },

  submitButtonText: {
    color: Colors.primaryForeground,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },

  // Confirmation Modal Styles
  confirmationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },

  confirmationModal: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 400,
  },

  confirmationTitle: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.foreground,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },

  confirmationContent: {
    marginBottom: Spacing.lg,
  },

  confirmationText: {
    fontSize: FontSizes.sm,
    color: Colors.foreground,
    marginBottom: Spacing.xs,
  },

  confirmationLabel: {
    fontWeight: '600',
    color: Colors.primary,
  },

  confirmationButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },

  confirmationButtonText: {
    color: Colors.primaryForeground,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },

  // Dropdown Modal Styles
  dropdownModal: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  dropdownTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.foreground,
  },

  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  dropdownItemText: {
    fontSize: FontSizes.md,
    color: Colors.foreground,
    flex: 1,
  },

  dropdownItemPrice: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '600',
  },

  // New styles for enhanced form
  required: {
    borderColor: Colors.destructive,
    borderWidth: 1.5,
  },

  disabled: {
    backgroundColor: Colors.muted,
    opacity: 0.6,
  },

  disabledText: {
    color: Colors.mutedForeground,
  },

  orderSummaryContainer: {
    backgroundColor: Colors.muted,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginVertical: Spacing.md,
  },

  orderSummaryTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: Spacing.xs,
  },

  orderSummaryProduct: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    marginBottom: Spacing.xs,
  },

  orderSummaryDetails: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: Colors.foreground,
    marginBottom: Spacing.xs,
  },

  orderSummaryTotal: {
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
    color: Colors.primary,
  },

  productDropdownContent: {
    flex: 1,
  },

  productDropdownType: {
    fontSize: FontSizes.xs,
    color: Colors.mutedForeground,
    marginTop: 2,
  },

  modalErrorContainer: {
    backgroundColor: Colors.error,
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },

  modalErrorText: {
    color: Colors.errorForeground,
    fontSize: FontSizes.sm,
    textAlign: 'center',
    fontWeight: '500',
  },

  productPreview: {
    backgroundColor: Colors.primary + '10',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },

  productPreviewTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },

  productPreviewContent: {
    gap: Spacing.xs,
  },

  productPreviewName: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.foreground,
  },

  productPreviewDetails: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    marginBottom: Spacing.xs,
  },

  productPreviewSizes: {
    marginTop: Spacing.xs,
  },

  productPreviewSizesTitle: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.mutedForeground,
    marginBottom: Spacing.xs,
  },

  productPreviewSizesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },

  productPreviewSize: {
    fontSize: FontSizes.xs,
    color: Colors.success,
    backgroundColor: Colors.success + '20',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    fontWeight: '600',
  },

  productPreviewSizeOutOfStock: {
    color: Colors.error,
    backgroundColor: Colors.error + '20',
  },

  changeProductButton: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },

  changeProductButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '600',
  },



  // Picker Container Styles (copied from UserManagement)
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background,
    marginTop: 4,
    maxHeight: 200,
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
});

export default ProductSales;
