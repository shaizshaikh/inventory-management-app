# Inventory Management Event Processor

This project is an Event Processor microservice designed to handle events from an Azure Event Hub. It processes three types of events: 
- `seller_added_product`: Generates a thumbnail for a product image and updates Azure Table Storage with the thumbnail URL.
- `view_cart`: Deducts product quantities when users add items to their cart.
- `leave_cart`: Restores product quantities when users remove items from their cart.

## Features

- **Thumbnail Processing**: Creates a 100x100 thumbnail for product images and uploads them to Azure Blob Storage.
- **Real-Time Inventory Management**: Updates product quantities dynamically in Azure Table Storage based on user cart actions.
- **Scalable Architecture**: Built to process high-throughput events from Azure Event Hub.

---

## Prerequisites

Ensure you have the following installed and configured:

1. **Node.js** (v16+)
2. **Azure Resources**:
   - Azure Event Hub
   - Azure Blob Storage
   - Azure Table Storage
3. **Environment Variables**: Set up a `.env` file in the root directory with the following:

   ```env
   AZURE_EVENT_HUB_CONNECTION_STRING=<Your Event Hub Connection String>
   AZURE_EVENT_HUB_NAME=<Your Event Hub Name>
   AZURE_STORAGE_CONNECTION_STRING=<Your Blob Storage Connection String>
   AZURE_TABLES_CONNECTION_STRING=<Your Table Storage Connection String>
   AZURE_TABLES_NAME=<Your Table Name>
   AZURE_STORAGE_CONTAINER_NAME=<Your Blob Storage Container Name>
