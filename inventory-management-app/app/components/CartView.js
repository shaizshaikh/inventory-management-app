import React, { useEffect } from 'react';
import styles from '../styles/CartView.module.css';
import { toast } from 'react-toastify';
import { sendEventToEventHub } from '../../utils/sendEventToEventHub';

const CartView = ({ cart, toggleCart, onBack }) => {
    useEffect(() => {
        // Send 'view_cart' event when the component mounts and cart has items
        if (cart.length > 0) {
            sendEventToEventHub({
                action: 'view_cart',
                cartItems: cart.map((item) => ({
                    rowKey: item.rowKey, // Use rowKey as productId
                    productTitle: item.productTitle,
                    userQuantity: 1, // Default quantity set to 1
                    partitionKey: item.partitionKey, // Use partitionKey (sellerId)
                })),
            });
        }
    }, [cart]);

    const handleBack = () => {
        if (cart.length > 0) {
            sendEventToEventHub({
                action: 'leave_cart',
                cartItems: cart.map((item) => ({
                    rowKey: item.rowKey,
                    productTitle: item.productTitle,
                    userQuantity: 1, // Default quantity set to 1
                    partitionKey: item.partitionKey,
                })),
            });
        }
        onBack();
    };

    const handleRemove = (rowKey) => {
        toggleCart(rowKey); // Remove the item from the cart
        toast.info('Product removed from cart!');
    };

    return (
        <div className={styles.cartView}>
            <h2>Your Cart</h2>
            {cart.length > 0 ? (
                cart.map((item, index) => (
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
                                        item.quantity <= 0 ? styles.outOfStock : styles.inStock
                                    }
                                    role="status"
                                    aria-live="polite"
                                >
                                    {item.quantity <= 0 ? 'Not in Stock' : 'In Stock'}
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
                ))
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
