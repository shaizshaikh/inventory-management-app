'use client';

import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import SignInForm from './components/SignInForm';
import CartView from './components/CartView';
import './globals.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

let socket;

export default function Home() {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [showSignIn, setShowSignIn] = useState(false);
    const [showCart, setShowCart] = useState(false);
    const [user, setUser] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0); // Track the active item index

    const menuRef = useRef(null);
    const firstMenuItemRef = useRef(null);
    const lastMenuItemRef = useRef(null);
    const menuItemsRef = useRef([]);

    useEffect(() => {
        socket = io();

        async function fetchProducts() {
            try {
                const response = await fetch('/api/get-all-products', { credentials: 'include' });
                const data = await response.json();
                if (data && data.products) {
                    setProducts(data.products);
                }
            } catch (error) {
                console.error('Failed to fetch products:', error);
            }
        }

        fetchProducts();

        const savedCart = JSON.parse(localStorage.getItem('cart')) || [];
        setCart(savedCart);

        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        return () => {
            if (socket) socket.disconnect();
        };
    }, []);

    const handleViewCartClick = () => {
        setMenuOpen(false);
        setShowCart(true);
        if (socket) {
            socket.emit('viewCart', { action: 'viewCart' });
        }
    };

    const handleBackToProductsClick = () => {
        setShowCart(false);
        if (socket) {
            socket.emit('backToProducts', { action: 'backToProducts' });
        }
    };

    const toggleCart = (rowKey) => {
        const updatedCart = cart.some((item) => item.rowKey === rowKey)
            ? cart.filter((item) => item.rowKey !== rowKey)
            : [...cart, products.find((item) => item.rowKey === rowKey)];

        setCart(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
    };

    const handleMenuToggle = () => {
        setMenuOpen((prev) => !prev);
    };

    const handleSignInClick = () => {
        setMenuOpen(false);
        setShowSignIn(true);
    };

    const handleGoToDashboard = () => {
        setMenuOpen(false);
        window.location.href = '/dashboard';
    };

    const handleArrowKeyNavigation = (e) => {
        if (menuOpen) {
            let newIndex = activeIndex;
            if (e.key === 'ArrowDown') {
                newIndex = (activeIndex + 1) % menuItemsRef.current.length;
            } else if (e.key === 'ArrowUp') {
                newIndex = (activeIndex - 1 + menuItemsRef.current.length) % menuItemsRef.current.length;
            }

            setActiveIndex(newIndex);
            menuItemsRef.current[newIndex].focus();
        }
    };

    const handleFocusTrap = (e) => {
        if (menuOpen) {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstMenuItemRef.current) {
                        lastMenuItemRef.current.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastMenuItemRef.current) {
                        firstMenuItemRef.current.focus();
                        e.preventDefault();
                    }
                }
            }
        }
    };

    const handleEscapeKey = (e) => {
        if (e.key === 'Escape') {
            setMenuOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener('keydown', handleEscapeKey);
        return () => document.removeEventListener('keydown', handleEscapeKey);
    }, []);

    return (
        <div
            className={`page ${showSignIn ? 'hide-content' : ''} ${menuOpen ? 'menu-open' : ''}`}
            onKeyDown={handleFocusTrap}
        >
            <ToastContainer />
            {!showCart && (
                <header className="header">
                    <h1>Welcome to Inventory Management</h1>
                    <div className="hamburger-menu">
                        <button
                            aria-label="Toggle menu"
                            aria-expanded={menuOpen}
                            aria-controls="menu-dropdown"
                            className="hamburger-button"
                            onClick={handleMenuToggle}
                        >
                            ☰
                        </button>
                        {menuOpen && (
                            <div
                                id="menu-dropdown"
                                ref={menuRef}
                                className="menu-dropdown"
                                role="menu"
                                aria-labelledby="menu-toggle"
                                onKeyDown={handleArrowKeyNavigation}
                                aria-activedescendant={`menu-item-${activeIndex}`}
                            >
                                <ul className="menu-list">
                                    <li
                                        ref={(el) => (menuItemsRef.current[0] = el)}
                                        id="menu-item-0"
                                        role="menuitem"
                                        tabIndex={0}
                                        aria-label="View Cart"
                                        onClick={handleViewCartClick}
                                    >
                                        View Cart
                                    </li>
                                    {user ? (
                                        <li
                                            ref={(el) => (menuItemsRef.current[1] = el)}
                                            id="menu-item-1"
                                            role="menuitem"
                                            tabIndex={0}
                                            aria-label="Go to Dashboard"
                                            onClick={handleGoToDashboard}
                                        >
                                            Go to Dashboard
                                        </li>
                                    ) : (
                                        <li
                                            ref={(el) => (menuItemsRef.current[1] = el)}
                                            id="menu-item-1"
                                            role="menuitem"
                                            tabIndex={0}
                                            aria-label="Sign In as Seller"
                                            onClick={handleSignInClick}
                                        >
                                            Sign In as Seller
                                        </li>
                                    )}
                                    <li
                                        ref={(el) => (menuItemsRef.current[2] = el)}
                                        id="menu-item-2"
                                        role="menuitem"
                                        tabIndex={0}
                                        aria-label="Close Menu"
                                        onClick={handleMenuToggle}
                                    >
                                        Close Menu
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                </header>
            )}

            {!showSignIn && !showCart && (
                <div className="product-grid">
                    {products.length > 0 ? (
                        products.map((product, index) => (
                            <div key={index} className="product-card">
                                <a
                                    href={product.imageUrls || '/placeholder-image.jpg'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <img
                                        src={product.thumbnailUrl || '/placeholder-image.jpg'}
                                        alt={product.productTitle || 'Product Thumbnail'}
                                    />
                                </a>
                                <h3>{product.productTitle || 'No title available'}</h3>
                                <p>Price: ${product.price || 'N/A'}</p>
                                <button
                                    onClick={() => toggleCart(product.rowKey)}
                                    style={{
                                        backgroundColor: cart.some((item) => item.rowKey === product.rowKey)
                                            ? 'red'
                                            : 'green',
                                        color: 'white',
                                    }}
                                >
                                    {cart.some((item) => item.rowKey === product.rowKey)
                                        ? 'Remove from Cart'
                                        : 'Add to Cart'}
                                </button>
                            </div>
                        ))
                    ) : (
                        <p>No products available</p>
                    )}
                </div>
            )}

            {showSignIn && <SignInForm />}
            {showCart && <CartView cart={cart} toggleCart={toggleCart} onBack={handleBackToProductsClick} />}
        </div>
    );
}
