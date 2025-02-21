'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { app } from '@/utils/firebaseConfig';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from '../styles/Dashboard.module.css';
import UpdateProductModal from '../components/UpdateProductModal';
import CreateProductModal from '../components/CreateProductModal';

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [inventoryData, setInventoryData] = useState({});
    const [recentProducts, setRecentProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [productToUpdate, setProductToUpdate] = useState(null);
    const [productLimit, setProductLimit] = useState(5);
    const [totalProducts, setTotalProducts] = useState(0);

    const auth = getAuth(app);
    const router = useRouter();
    const menuRef = useRef(null);
    const toggleButtonRef = useRef(null);

    // Auth state listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                localStorage.setItem('user', JSON.stringify(currentUser));
                fetchDashboardData(currentUser.email);
            } else {
                setUser(null);
                localStorage.removeItem('user');
                router.push('/');
            }
        });

        return () => unsubscribe();
    }, [auth, router]);

    // Click outside menu handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                menuOpen &&
                !menuRef.current?.contains(event.target) &&
                !toggleButtonRef.current?.contains(event.target)
            ) {
                setMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen]);

    // Fetch dashboard data
    const fetchDashboardData = useCallback(async (sellerId) => {
        setIsLoading(true);
        try {
            const [inventoryRes, productsRes] = await Promise.all([
                fetchInventoryData(sellerId),
                fetchRecentProducts(sellerId, productLimit),
            ]);

            setInventoryData(inventoryRes || {});
            setRecentProducts(productsRes.products || []);
            setTotalProducts(productsRes.totalProducts || 0);
        } catch (err) {
            toast.error('Failed to load dashboard data');
            console.error('Dashboard fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [productLimit]);

    // Fetch inventory data
    const fetchInventoryData = async (sellerId) => {
        try {
            const response = await fetch('/api/get-inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sellerId }),
            });

            if (!response.ok) throw new Error('Inventory fetch failed');
            return await response.json();
        } catch (err) {
            toast.error('Failed to load inventory');
            console.error('Inventory error:', err);
            return {};
        }
    };

    // Fetch recent products
    const fetchRecentProducts = async (sellerId, limit) => {
        try {
            const response = await fetch('/api/get-products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sellerId, limit }),
            });

            if (!response.ok) throw new Error('Products fetch failed');
            const data = await response.json();
            return data;
        } catch (err) {
            toast.error('Failed to load products');
            console.error('Products error:', err);
            return { products: [], totalProducts: 0 };
        }
    };

    // Logout handler
    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/');
        } catch (err) {
            toast.error('Error logging out. Please try again.');
            console.error(err);
        }
    };

    // Menu toggle handler
    const handleMenuToggle = () => {
        setMenuOpen((prev) => !prev);
    };

    // Go to home handler
    const handleGoToHome = () => {
        setMenuOpen(false);
        router.push('/');
    };

    // Add new product handler
    const handleAddNewProduct = () => {
        setMenuOpen(false);
        setShowCreateModal(true);
    };

    // Update product handler
    const handleUpdateProduct = (product) => {
        setMenuOpen(false);
        setProductToUpdate(product);
        setShowUpdateModal(true);
    };

    // Refetch data when product limit changes
    useEffect(() => {
        if (user?.email) {
            fetchDashboardData(user.email);
        }
    }, [productLimit, fetchDashboardData, user?.email]);

    // Loading state
    if (isLoading) {
        return (
            <div className={styles.loaderContainer}>
                <div className={styles.loader}></div>
                <p aria-live="polite">Loading dashboard...</p>
            </div>
        );
    }

    // Unauthenticated state
    if (!user) {
        return (
            <div className={styles.unauthenticated}>
                <p>You are not signed in. Please sign in to access the dashboard.</p>
            </div>
        );
    }

    return (
        <div className={styles.dashboard}>
            {/* Header */}
            <header className={styles.header}>
                <h1>Welcome, {user.displayName || 'Seller'}!</h1>
                <div className={styles.hamburgerMenu}>
                    <button
                        aria-label="Toggle menu"
                        aria-expanded={menuOpen ? 'true' : 'false'}
                        aria-controls="menuDropdown"
                        ref={toggleButtonRef}
                        className={styles.hamburgerButton}
                        onClick={handleMenuToggle}
                    >
                        ☰
                    </button>
                    {menuOpen && (
                        <div
                            id="menuDropdown"
                            ref={menuRef}
                            className={styles.menuDropdown}
                            role="menu"
                            aria-labelledby={toggleButtonRef.current?.id}
                            aria-live="assertive"
                            aria-modal="true"
                        >
                            <button onClick={handleGoToHome}>Go to Home Page</button>
                            <button onClick={handleLogout}>Log Out</button>
                            <button onClick={handleAddNewProduct}>Add New Product</button>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main>
                <section className={styles.section}>
                    <h3>Inventory Summary</h3>
                    <div aria-live="polite">
                        <p><strong>Total Items:</strong> {inventoryData.totalItems || '0'}</p>
                        <p><strong>Categories:</strong> {inventoryData.categories?.join(', ') || 'None'}</p>
                        <p><strong>Low Stock Items:</strong> {inventoryData.lowStockItems || '0'}</p>
                    </div>
                </section>

                <section className={styles.section}>
                    <h3>Recent Products</h3>
                    {recentProducts.length > 0 ? (
                        <div className={styles.productList} aria-live="polite">
                            {recentProducts.map((product, index) => (
                                <div key={product.id || index} className={styles.productContainer}>
                                    {product.thumbnailUrl && (
                                        <img
                                            src={product.thumbnailUrl}
                                            alt={`${product.productTitle || 'Product'} Thumbnail`}
                                            className={styles.thumbnail}
                                        />
                                    )}
                                    <h4>{product.productTitle || 'N/A'}</h4>
                                    <p><strong>Description:</strong> {product.description || 'N/A'}</p>
                                    <p><strong>Price:</strong> ${product.price || 'N/A'}</p>
                                    <p><strong>Color:</strong> {product.color || 'N/A'}</p>
                                    <p><strong>Quantity:</strong> {product.quantity || 'N/A'}</p>
                                    <p><strong>Shipping:</strong> {product.shipping || 'N/A'}</p>
                                    <button
                                        onClick={() => handleUpdateProduct(product)}
                                        className={styles.updateProductButton}
                                    >
                                        Update Product
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>No recent products found.</p>
                    )}
                </section>
            </main>

            {/* Modals */}
            {showUpdateModal && (
                <UpdateProductModal
                    product={productToUpdate}
                    onClose={() => setShowUpdateModal(false)}
                    onUpdate={() => {
                        setShowUpdateModal(false);
                        if (user) {
                            fetchDashboardData(user.email);
                        }
                    }}
                />
            )}
            {showCreateModal && (
                <CreateProductModal
                    onClose={() => setShowCreateModal(false)}
                    onCreate={() => {
                        setShowCreateModal(false);
                        if (user) {
                            fetchDashboardData(user.email);
                        }
                    }}
                />
            )}
        </div>
    );
}