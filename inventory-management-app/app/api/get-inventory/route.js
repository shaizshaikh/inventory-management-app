import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { sellerId } = await req.json();

        // Mock Inventory Data (replace this with your database query)
        const inventoryData = {
            totalItems: 50,
            categories: ['Clothing', 'Accessories', 'Shoes'],
            lowStockItems: 5,
            recentActivity: [
                'Added a new product: "The Master\'s Shirt"',
                'Updated stock for "Blue Jeans"',
            ],
        };

        // Return the inventory data
        return NextResponse.json(inventoryData);
    } catch (error) {
        console.error('Error fetching inventory data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch inventory data' },
            { status: 500 }
        );
    }
}
