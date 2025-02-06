import React, { useState, useEffect } from 'react';
import { auth } from '../../utils/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from '../styles/ProductForm.module.css'; // Assuming this contains only form-specific styles

export default function CreateProduct({ prefillData = null, onClose = () => {} }) {
    const [formData, setFormData] = useState({
        gender: '',
        productTitle: '',
        productImages: null,
        description: '',
        price: '',
        size: '',
        color: '',
        material: '',
        quantity: '',
        shipping: '',
    });

    const [user, setUser] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (prefillData) {
            setFormData((prev) => ({ ...prev, ...prefillData }));
        }
    }, [prefillData]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: files ? files : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            toast.error('Please log in to submit a product.');
            return;
        }

        const requiredFields = ['gender', 'productTitle', 'description', 'price'];
        for (const field of requiredFields) {
            if (!formData[field]) {
                toast.error(`Please fill out the ${field} field.`);
                return;
            }
        }

        const { productImages, ...productData } = formData;
        const formPayload = new FormData();
        formPayload.append('sellerId', user.email);
        formPayload.append('productData', JSON.stringify(productData));

        if (productImages) {
            for (const file of productImages) {
                formPayload.append('productImages', file);
            }
        }

        try {
            setIsSubmitting(true);
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formPayload,
            });

            if (response.ok) {
                const result = await response.json();
                toast.success(result.message || 'Product uploaded successfully!');
                setFormData({
                    gender: '',
                    productTitle: '',
                    productImages: null,
                    description: '',
                    price: '',
                    size: '',
                    color: '',
                    material: '',
                    quantity: '',
                    shipping: '',
                });

                onClose(); // Close the modal after successful submission
            } else {
                const error = await response.json();
                toast.error(error.message || 'Error uploading product.');
            }
        } catch (error) {
            toast.error('An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <ToastContainer />
            <h1>{prefillData ? 'Update Product' : 'Create a New Product'}</h1>

            <form onSubmit={handleSubmit} className={styles.productForm}>
                <div className={styles.formGroup}>
                    <label>Gender:</label>
                    <div>
                        <label>
                            <input
                                type="radio"
                                name="gender"
                                value="Male"
                                checked={formData.gender === 'Male'}
                                onChange={handleChange}
                            />
                            Male
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="gender"
                                value="Female"
                                checked={formData.gender === 'Female'}
                                onChange={handleChange}
                            />
                            Female
                        </label>
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label>Product Title:</label>
                    <input
                        type="text"
                        name="productTitle"
                        placeholder="Enter product title"
                        value={formData.productTitle}
                        onChange={handleChange}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Product Images:</label>
                    <input
                        type="file"
                        name="productImages"
                        multiple
                        accept="image/*"
                        onChange={handleChange}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Description:</label>
                    <textarea
                        name="description"
                        placeholder="Enter product description"
                        value={formData.description}
                        onChange={handleChange}
                    ></textarea>
                </div>

                <div className={styles.formGroup}>
                    <label>Price:</label>
                    <input
                        type="number"
                        name="price"
                        placeholder="Enter product price"
                        value={formData.price}
                        onChange={handleChange}
                    />
                </div>

                {['size', 'color', 'material', 'quantity', 'shipping'].map((field) => (
                    <div className={styles.formGroup} key={field}>
                        <label>{field.charAt(0).toUpperCase() + field.slice(1)}:</label>
                        <input
                            type="text"
                            name={field}
                            placeholder={`Enter product ${field}`}
                            value={formData[field]}
                            onChange={handleChange}
                        />
                    </div>
                ))}

                <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
                    {isSubmitting ? 'Submitting...' : prefillData ? 'Update Product' : 'Submit Product'}
                </button>
            </form>
        </>
    );
}
