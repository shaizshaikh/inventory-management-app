'use client';

import { useEffect, useState } from 'react';
import SignInForm from './components/SignInForm';
import CartView from './components/CartView';
import './globals.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Home() {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [showSignIn, setShowSignIn] = useState(false);
    const [showCart, setShowCart] = useState(false);

    const handleSignInClick = () => setShowSignIn(true);

    useEffect(() => {
        async function fetchProducts() {
            try {
                console.log('Fetching initial product data from API...');
                const response = await fetch('/api/get-all-products', {
                    credentials: 'include',
                });
                const data = await response.json();

                if (data && data.products && data.products.length > 0) {
                    console.log('Fetched products from API:', data.products);
                    const updatedProducts = data.products.map((product) => ({
                        ...product,
                        isInCart: cart.some((item) => item.rowKey === product.rowKey),
                    }));
                    setProducts(updatedProducts);
                } else {
                    console.warn('No products found in API response:', data);
                    setProducts([]);
                }
            } catch (error) {
                console.error('Failed to fetch products:', error);
            }
        }

        fetchProducts();

        const savedCart = JSON.parse(localStorage.getItem('cart')) || [];
        if (JSON.stringify(savedCart) !== JSON.stringify(cart)) {
            console.log('Loaded cart from localStorage:', savedCart);
            setCart(savedCart);
        }
    }, []);

    const toggleCart = (rowKey) => {
        setCart((prevCart) => {
            const isProductInCart = prevCart.some((item) => item.rowKey === rowKey);
            const updatedCart = isProductInCart
                ? prevCart.filter((item) => item.rowKey !== rowKey)
                : [...prevCart, products.find((item) => item.rowKey === rowKey)];

            localStorage.setItem('cart', JSON.stringify(updatedCart));
            return updatedCart;
        });

        setProducts((prevProducts) =>
            prevProducts.map((product) =>
                product.rowKey === rowKey
                    ? { ...product, isInCart: !product.isInCart }
                    : product
            )
        );
    };

    const handleViewCartClick = () => {
        setShowCart(true);
    };

    const handleBackToProductsClick = () => {
        setShowCart(false);
    };

    return (
        <div className={`page ${showSignIn ? 'hide-content' : ''}`}>
            <ToastContainer />
            {!showSignIn && !showCart && (
                <>
                    <h1>Welcome to Inventory Management</h1>
                    <p>Select an option below to proceed.</p>

                    <div className="ctas">
                        <button className="btn-sign-in" onClick={handleSignInClick}>
                            Sign In as seller
                        </button>
                        <button className="btn-view-cart" onClick={handleViewCartClick}>
                            View Cart
                        </button>
                    </div>

                    <div className="product-grid">
                        {products.length > 0 ? (
                            products.map((product, index) => (
                                <div
                                    className="product-card"
                                    key={product.rowKey || `product-${index}`}
                                >
                                    <a
                                        href={product.imageUrls || '/placeholder-image.jpg'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <img
                                            src={product.thumbnailUrl || '/placeholder-image.jpg'}
                                            alt={product.productTitle || 'Product Thumbnail'}
                                            className="product-image"
                                        />
                                    </a>
                                    <h3>{product.productTitle || 'No title available'}</h3>
                                    <p><strong>Price:</strong> ${product.price || 'N/A'}</p>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleCart(product.rowKey);
                                            toast.success(
                                                `${product.productTitle || 'Product'} ${product.isInCart ? 'removed from' : 'added to'
                                                } cart!`
                                            );
                                        }}
                                        style={{
                                            backgroundColor: product.isInCart ? 'red' : 'green',
                                            color: 'white',
                                        }}
                                    >
                                        {product.isInCart ? 'Remove from Cart' : 'Add to Cart'}
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p>No products available</p>
                        )}
                    </div>
                </>
            )}

            {showSignIn && <SignInForm />}
            {showCart && (
                <CartView
                    cart={cart}
                    toggleCart={toggleCart}
                    onBack={handleBackToProductsClick}
                />
            )}
        </div>
    );
}
