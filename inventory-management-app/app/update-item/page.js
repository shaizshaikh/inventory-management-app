'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CreateProduct from '../components/ProductForm';


export default function UpdateProductPage() {
    const [productData, setProductData] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Simulate fetching product data based on a query parameter (e.g., productId)
        const fetchProductData = async () => {
            const productId = new URLSearchParams(window.location.search).get('id');
            if (!productId) {
                router.push('/dashboard'); // Redirect if no product ID is provided
                return;
            }

            try {
                // Simulated fetch call for product data
                const mockData = {
                    id: productId,
                    gender: 'Male',
                    productTitle: 'Sample Product',
                    description: 'This is a sample product description.',
                    price: '99.99',
                    size: 'M',
                    color: 'Blue',
                    material: 'Cotton',
                    quantity: '10',
                    shipping: 'Standard',
                };
                setProductData(mockData);
            } catch (error) {
                console.error('Error fetching product data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProductData();
    }, [router]);

    if (loading) return <p>Loading...</p>;
    if (!productData) return <p>Error: Product not found</p>;

    return (
        <main>
            <h1>Update Product</h1>
            <CreateProduct prefillData={productData} />
        </main>
    );
}
