import React, { useEffect, useRef } from 'react';
import styles from '../styles/CartView.module.css';
import { toast } from 'react-toastify';
import { sendEventToEventHub } from '../../utils/sendEventToEventHub';

const CartView = ({ cart, toggleCart, onBack }) => {
    const hasViewedCart = useRef(false);

    useEffect(() => {
        if (!hasViewedCart.current && cart.length > 0) {
            sendEventToEventHub({
                action: 'view_cart',
                cartItems: cart.map((item) => ({
                    rowKey: item.rowKey,
                    productTitle: item.productTitle,
                    userQuantity: 1,
                    partitionKey: item.partitionKey,
                })),
            });
            hasViewedCart.current = true;
        }
    }, [cart]);

    const handleBack = () => {
        if (cart.length > 0) {
            sendEventToEventHub({
                action: 'leave_cart',
                cartItems: cart.map((item) => ({
                    rowKey: item.rowKey,
                    productTitle: item.productTitle,
                    userQuantity: 1,
                    partitionKey: item.partitionKey,
                })),
            });
        }
        onBack();
    };

    const handleRemove = (rowKey) => {
        const removedItem = cart.find((item) => item.rowKey === rowKey);

        if (removedItem) {
            sendEventToEventHub({
                action: 'leave_cart',
                cartItems: [
                    {
                        rowKey: removedItem.rowKey,
                        productTitle: removedItem.productTitle,
                        userQuantity: 1,
                        partitionKey: removedItem.partitionKey,
                    },
                ],
            });
        }

        toggleCart(rowKey);
        toast.info('Product removed from cart!');
    };

    return (
        <div className={styles.cartView}>
            <h2>Your Cart</h2>
            {cart.length > 0 ? (
                <div className={styles.cartGrid}>
                    {cart.map((item, index) => (
                        <div
                            key={item.rowKey || `cart-item-${index}`}
                            className={styles.cartItem}
                            aria-labelledby={`cart-item-${index}-title`}
                            role="group"
                        >
                            <a
                                href={item.imageUrls || '/placeholder-image.jpg'}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <img
                                    src={item.thumbnailUrl || '/placeholder-image.jpg'}
                                    alt={item.productTitle || 'Product Thumbnail'}
                                    className={styles.cartItemImage}
                                />
                            </a>
                            <div>
                                <h3 id={`cart-item-${index}-title`}>
                                    {item.productTitle || 'No title available'}
                                </h3>
                                <p><strong>Description:</strong> {item.description || 'N/A'}</p>
                                <p><strong>Price:</strong> ${item.price || 'N/A'}</p>
                                <p><strong>Color:</strong> {item.color || 'N/A'}</p>
                                <p><strong>Material:</strong> {item.material || 'N/A'}</p>
                                <p><strong>Shipping:</strong> {item.shipping || 'N/A'}</p>
                                <p>
                                    <strong>Status:</strong>{' '}
                                    <span
                                        className={
                                            item.quantity > 0 ? styles.inStock : styles.outOfStock
                                        }
                                        role="status"
                                        aria-live="polite"
                                    >
                                        {item.quantity <= 0 && !item.quantity ? 'Not in Stock' : 'In Stock'}
                                    </span>
                                </p>
                                <button
                                    onClick={() => handleRemove(item.rowKey)}
                                    aria-label={`Remove ${item.productTitle} from cart`}
                                    className={styles.removeButton}
                                >
                                    Remove from Cart
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p>Your cart is empty.</p>
            )}
            <button
                className={styles.btnBack}
                onClick={handleBack}
                aria-label="Back to products"
            >
                Back to Products
            </button>
        </div>
    );
};

export default CartView;
