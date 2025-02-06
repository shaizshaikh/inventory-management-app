'use client';

import { useState, useEffect, useRef } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '@/utils/firebaseConfig';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { io } from 'socket.io-client';
import styles from '../styles/Dashboard.module.css';
import UpdateProductModal from '../components/UpdateProductModal';
import CreateProductModal from '../components/CreateProductModal';

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [inventoryData, setInventoryData] = useState(null);
    const [recentProducts, setRecentProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [productToUpdate, setProductToUpdate] = useState(null);
    const [productLimit, setProductLimit] = useState(5);

    const auth = getAuth(app);
    const router = useRouter();
    const socket = io();
    const menuRef = useRef(null);
    const toggleButtonRef = useRef(null);

    useEffect(() => {
        const currentUser = auth.currentUser || JSON.parse(localStorage.getItem('user'));

        if (currentUser) {
            setUser(currentUser);
            localStorage.setItem('user', JSON.stringify(currentUser));
            fetchDashboardData(currentUser.email);
        } else {
            setUser(null);
        }
    }, [auth]);

    useEffect(() => {
        if (socket) {
            socket.on('dashboardUpdate', (data) => {
                if (data.action === 'viewCart' || data.action === 'backToProducts') {
                    fetchDashboardData(user?.email);
                }
            });

            return () => socket.off('dashboardUpdate');
        }
    }, [socket, user]);

    const fetchDashboardData = async (sellerId) => {
        setIsLoading(true);
        try {
            const [inventoryRes, productsRes] = await Promise.all([
                fetchInventoryData(sellerId),
                fetchRecentProducts(sellerId, productLimit),
            ]);
            setInventoryData(inventoryRes);
            setRecentProducts(productsRes);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchInventoryData = async (sellerId) => {
        try {
            const response = await fetch('/api/get-inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sellerId }),
            });
            if (response.ok) {
                return await response.json();
            } else {
                console.error('Error fetching inventory:', await response.json());
            }
        } catch (err) {
            console.error('Error fetching inventory:', err);
        }
    };

    const fetchRecentProducts = async (sellerId, limit) => {
        try {
            const response = await fetch('/api/get-products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sellerId, limit }),
            });
            if (response.ok) {
                const data = await response.json();
                return data.products || [];
            } else {
                console.error('Error fetching products:', await response.json());
            }
        } catch (err) {
            console.error('Error fetching products:', err);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            localStorage.removeItem('user');
            router.push('/');
        } catch (err) {
            toast.error('Error logging out. Please try again.');
            console.error(err);
        }
    };

    const handleMenuToggle = () => {
        setMenuOpen((prev) => !prev);
    };

    const handleGoToHome = () => {
        setMenuOpen(false);
        router.push('/');
    };

    const handleAddNewProduct = () => {
        setMenuOpen(false); // Close the menu after clicking
        setShowCreateModal(true);
    };

    const handleUpdateProduct = (product) => {
        setMenuOpen(false); // Close the menu after clicking
        setProductToUpdate(product);
        setShowUpdateModal(true);
    };

    const handleLoadMore = () => {
        setProductLimit((prevLimit) => prevLimit + 5);
    };

    useEffect(() => {
        if (user) {
            fetchDashboardData(user.email);
        }
    }, [productLimit]);

    if (isLoading) {
        return (
            <div className={styles.loaderContainer}>
                <div className={styles.loader}></div>
                <p aria-live="polite">Loading dashboard...</p>
            </div>
        );
    }

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
                    {inventoryData ? (
                        <div aria-live="polite">
                            <p><strong>Total Items:</strong> {inventoryData.totalItems || '0'}</p>
                            <p><strong>Categories:</strong> {inventoryData.categories?.join(', ') || 'None'}</p>
                            <p><strong>Low Stock Items:</strong> {inventoryData.lowStockItems || '0'}</p>
                        </div>
                    ) : (
                        <p>No inventory data available.</p>
                    )}
                </section>

                <section className={styles.section}>
                    <h3>Recent Products</h3>
                    {recentProducts.length > 0 ? (
                        <div className={styles.productList} aria-live="polite">
                            {recentProducts.map((product, index) => (
                                <div key={index} className={styles.productContainer}>
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
                            <button
                                onClick={handleLoadMore}
                                style={{
                                    fontSize: '8px',
                                    padding: '2px 4px',
                                    marginTop: '5px',
                                    backgroundColor: '#ddd',
                                    border: '1px solid #ccc',
                                    cursor: 'pointer',
                                }}
                                aria-label="Load more products"
                            >
                                Load More
                            </button>
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
                    onUpdate={(updatedProduct) => {
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
                    onCreate={(newProduct) => {
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
