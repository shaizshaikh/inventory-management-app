import React from 'react';
import CreateProduct from './ProductForm';
import styles from '../styles/Modal.module.css';

export default function CreateProductModal({ onClose, onCreate }) {
    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <button className={styles.closeButton} onClick={onClose}>✖</button>
                <CreateProduct onClose={onClose} onCreate={onCreate} />
            </div>
        </div>
    );
}
