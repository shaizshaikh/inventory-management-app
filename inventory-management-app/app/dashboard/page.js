'use client';

import { useEffect, useState } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '@/utils/firebaseConfig';
import { useRouter } from 'next/navigation';
import styles from '@/app/styles/Dashboard.module.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [inventoryData, setInventoryData] = useState(null);
    const [recentProducts, setRecentProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [productsToLoad, setProductsToLoad] = useState(5);
    const [hasMoreProducts, setHasMoreProducts] = useState(true);
    const auth = getAuth(app);
    const router = useRouter();

    // Check localStorage for user data on initial load
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const currentUser = storedUser ? JSON.parse(storedUser) : auth.currentUser;

        if (currentUser) {
            setUser(currentUser);
            localStorage.setItem('user', JSON.stringify(currentUser));
            fetchDashboardData(currentUser.email);
        } else {
            setUser(null);
        }
    }, [auth]);

    // Fetch all dashboard data
    const fetchDashboardData = async (sellerId) => {
        setIsLoading(true);
        try {
            await Promise.all([fetchInventoryData(sellerId), fetchRecentProducts(sellerId)]);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch inventory data
    const fetchInventoryData = async (sellerId) => {
        try {
            const response = await fetch('/api/get-inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sellerId }),
            });

            if (response.ok) {
                const data = await response.json();
                setInventoryData(data || {});
            } else {
                console.error('Error fetching inventory:', await response.json());
            }
        } catch (err) {
            console.error('Error fetching inventory:', err);
        }
    };

    // Fetch recent products
    const fetchRecentProducts = async (sellerId) => {
        try {
            const response = await fetch('/api/get-products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sellerId, limit: productsToLoad }),
            });

            if (response.ok) {
                const data = await response.json();
                const products = data.products.map((product) => ({
                    ...product,
                    thumbnailUrl: product.thumbnailUrl || '',
                    lowStockAlert: product.quantity < 5,
                }));

                setRecentProducts(products);
                setLowStockProducts(products.filter((product) => product.lowStockAlert));
                setHasMoreProducts(data.products.length === productsToLoad);
            } else {
                console.error('Error fetching products:', await response.json());
            }
        } catch (err) {
            console.error('Error fetching products:', err);
        }
    };

    // Logout functionality
    const handleLogout = async () => {
        try {
            await signOut(auth);
            localStorage.removeItem('user');
            setUser(null);
            router.push('/');
        } catch (err) {
            toast.error('Error logging out. Please try again.');
            console.error(err);
        }
    };

    // Load more products
    const loadMoreProducts = () => {
        setProductsToLoad((prev) => prev + 5);
        fetchRecentProducts(user.email);
    };

    // Render loader while data is loading
    if (isLoading) {
        return (
            <div className={styles.loaderContainer}>
                <div className={styles.loader}></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    // Render unauthenticated state
    if (!user) {
        return (
            <div className={styles.unauthenticated}>
                <p>You are not signed in. Please sign in to access the dashboard.</p>
            </div>
        );
    }

    // Render authenticated dashboard
    return (
        <div className={styles.dashboard}>
            <header className={styles.header}>
                <h1>Welcome, {user.displayName || 'Seller'}!</h1>
                <div className={styles.headerActions}>
                    <button onClick={() => router.push('/create-product')} className={styles.addProductButton}>
                        Add New Product
                    </button>
                    <button onClick={handleLogout} className={styles.logoutButton}>
                        Logout
                    </button>
                </div>
            </header>

            <main>
                {/* Inventory Summary */}
                <section className={styles.section}>
                    <h3>Inventory Summary</h3>
                    {inventoryData ? (
                        <div>
                            <p><strong>Total Items:</strong> {inventoryData.totalItems || '0'}</p>
                            <p><strong>Categories:</strong> {inventoryData.categories?.join(', ') || 'None'}</p>
                            <p><strong>Low Stock Items:</strong> {inventoryData.lowStockItems || '0'}</p>
                        </div>
                    ) : (
                        <p>No inventory data available.</p>
                    )}
                </section>

                {/* Recent Products */}
                <section className={styles.section}>
                    <h3>Recent Products</h3>
                    {recentProducts.length > 0 ? (
                        <div className={styles.productList}>
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
                                </div>
                            ))}

                            {/* Load More Button */}
                            {hasMoreProducts && (
                                <button
                                    onClick={loadMoreProducts}
                                    className={styles.loadMoreButton}
                                    aria-label="Load more products"
                                >
                                    &gt;
                                </button>
                            )}
                        </div>
                    ) : (
                        <p>No recent products found.</p>
                    )}
                </section>
            </main>
        </div>
    );
}
