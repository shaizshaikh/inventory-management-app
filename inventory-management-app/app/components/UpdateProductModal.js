'use client';

import { useState, useEffect } from 'react';
import styles from '@/app/styles/UpdateProductModal.module.css';

const UpdateProductModal = ({ product, onClose, onUpdate, isOpen }) => {
    const [updatedProduct, setUpdatedProduct] = useState(product);

    useEffect(() => {
        setUpdatedProduct(product);

        // Dynamically announce modal state change
        const liveRegion = document.getElementById('modalStateLiveRegion');
        if (liveRegion) {
            liveRegion.textContent = isOpen
                ? 'Product update modal is now open.'
                : 'Product update modal is now closed.';
        }
    }, [product, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUpdatedProduct((prevProduct) => ({
            ...prevProduct,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            partitionKey: product.partitionKey,
            rowKey: product.rowKey,
            productData: {
                productTitle: updatedProduct.productTitle,
                description: updatedProduct.description,
                price: updatedProduct.price,
                color: updatedProduct.color,
                quantity: updatedProduct.quantity,
                shipping: updatedProduct.shipping,
                size: updatedProduct.size,
                gender: updatedProduct.gender,
                material: updatedProduct.material,
                imageUrls: updatedProduct.imageUrls,
                thumbnailUrl: updatedProduct.thumbnailUrl,
            },
        };

        try {
            const response = await fetch('/api/update-product', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error('Failed to update product');
            }

            const result = await response.json();
            onUpdate(); // Refresh parent data
            onClose(); // Close modal
            alert(result.message); // Display success message
        } catch (err) {
            console.error('Error updating product:', err);
            alert('Error updating product'); // Display error message
        }
    };

    return (
        <div
            className={styles.modal}
            role="dialog"
            aria-labelledby="updateProductModalTitle"
            aria-hidden={!isOpen} // Correctly reflect modal state
            aria-live="assertive"
        >
            {/* Live region for screen reader announcements */}
            <div id="modalStateLiveRegion" aria-live="polite" className={styles.srOnly}></div>

            <div className={styles.modalContent}>
                <button
                    className={styles.closeButton}
                    onClick={onClose}
                    aria-label="Close the product update modal"
                    title="Close modal"
                >
                    ×
                </button>
                <h2 id="updateProductModalTitle">Update Product</h2>
                <form onSubmit={handleSubmit}>
                    <label className={styles.formLabel} htmlFor="productTitle">Product Title:</label>
                    <input
                        id="productTitle"
                        type="text"
                        name="productTitle"
                        value={updatedProduct.productTitle || ''}
                        onChange={handleChange}
                        className={styles.inputField}
                        placeholder="Enter the product title"
                        aria-required="true"
                    />
                    <label className={styles.formLabel} htmlFor="description">Description:</label>
                    <textarea
                        id="description"
                        name="description"
                        value={updatedProduct.description || ''}
                        onChange={handleChange}
                        className={styles.inputField}
                        placeholder="Enter product description"
                        aria-required="true"
                    />
                    <label className={styles.formLabel} htmlFor="price">Price:</label>
                    <input
                        id="price"
                        type="number"
                        name="price"
                        value={updatedProduct.price || ''}
                        onChange={handleChange}
                        className={styles.inputField}
                        placeholder="Enter product price"
                        aria-required="true"
                    />
                    <label className={styles.formLabel} htmlFor="color">Color:</label>
                    <input
                        id="color"
                        type="text"
                        name="color"
                        value={updatedProduct.color || ''}
                        onChange={handleChange}
                        className={styles.inputField}
                        placeholder="Enter product color"
                    />
                    <label className={styles.formLabel} htmlFor="quantity">Quantity:</label>
                    <input
                        id="quantity"
                        type="number"
                        name="quantity"
                        value={updatedProduct.quantity || ''}
                        onChange={handleChange}
                        className={styles.inputField}
                        placeholder="Enter product quantity"
                    />
                    <label className={styles.formLabel} htmlFor="shipping">Shipping:</label>
                    <input
                        id="shipping"
                        type="text"
                        name="shipping"
                        value={updatedProduct.shipping || ''}
                        onChange={handleChange}
                        className={styles.inputField}
                        placeholder="Enter shipping details"
                    />
                    <button
                        type="submit"
                        className={styles.actionButton}
                        aria-label="Submit the updated product details"
                    >
                        Update Product
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UpdateProductModal;
