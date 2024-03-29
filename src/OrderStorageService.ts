import { ethers } from 'ethers';
import { Pool } from 'pg';

class OrderStorageService {
    private contract: ethers.Contract;
    private db: Pool;

    constructor(rpcUrl: string, contractAddress: string, contractABI: any, dbConfig: any) {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        this.contract = new ethers.Contract(contractAddress, contractABI, provider);

        // Initialize the database connection
        this.db = new Pool(dbConfig);

        // TODO: fetch historic event data and populate db
    }

    async saveOrder(orderId: number, ownerAddress: string, price: number, size: number, acceptableRange: number, isBuy: boolean) {
        const query = `
            INSERT INTO orderbook (order_id, owner_address, price, size, acceptable_range, is_buy)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (order_id) DO UPDATE
            SET owner_address = EXCLUDED.owner_address, price = EXCLUDED.price, size = EXCLUDED.size, acceptable_range = EXCLUDED.acceptable_range, is_buy = EXCLUDED.is_buy;
        `;

        await this.db.query(query, [orderId, ownerAddress, price, size, acceptableRange, isBuy]);
    }

    async deleteOrders(orderIds: number[]) {
        const query = `DELETE FROM orderbook WHERE order_id = ANY($1);`;
        await this.db.query(query, [orderIds]);
    }
    
    async listenForOrderEvents() {
        this.contract.on('OrderCreated', async (orderId: number, ownerAddress: string, price: number, size: number, acceptableRange: number, isBuy: boolean) => {
            console.log(`OrderCreated event detected for orderId: ${orderId} owner: ${ownerAddress} price: ${price} size: ${size} isBuy: ${isBuy}`);

            await this.saveOrder(orderId, ownerAddress, price, size, acceptableRange, isBuy);
            console.log(`Order Saved: ${orderId}`);
        });
        
        this.contract.on('OrderUpdated', async (orderId: number, ownerAddress: string, price: number, size: number, acceptableRange: number, isBuy: boolean) => {
            console.log(`OrderUpdated event detected for orderId: ${orderId} owner: ${ownerAddress} price: ${price} size: ${size} isBuy: ${isBuy}`);

            await this.saveOrder(orderId, ownerAddress, price, size, acceptableRange, isBuy);
            console.log(`Order Updated: ${orderId}`);
        });
        
        this.contract.on('OrdersCompletedOrCanceled', async (orderIds: number[]) => {
            console.log(`OrderCompletedOrCanceled event detected for orderId: ${orderIds}`);

            await this.deleteOrders(orderIds);
            console.log(`Order Deleted: ${orderIds}`);
        });
        
    }
}

export default OrderStorageService;
