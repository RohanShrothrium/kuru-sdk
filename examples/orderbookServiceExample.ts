import fs from 'fs';

import OrderbookService from '../src/orderbookService';
import { Order } from '../src/orderbookService';
import { error } from 'console';

const mapToObject = (map: Map<number, Order[]>) => {
    const obj: { [key: string]: Order[] } = {};
    for (let [key, value] of map) {
        obj[key] = value;
    }
    return obj;
};

const dbConfig = {
    user: 'username',
    host: 'localhost', // or the database server's address
    database: 'orderbook',
    password: 'password',
    port: 5432,
};

const sdkService = new OrderbookService(dbConfig);

// Example usage
(async () => {
    const L3Orderbook = await sdkService.getL3OrderBook();

    fs.writeFileSync('./tmp/L3Orderbook.json', JSON.stringify({
        buyOrders: mapToObject(L3Orderbook.buyOrders),
        sellOrders: mapToObject(L3Orderbook.sellOrders),
    }));

    const L2Orderbook = await sdkService.getL2OrderBook();

    fs.writeFileSync('./tmp/L2Orderbook.json', JSON.stringify({L2Orderbook}));

    const userOrders = await sdkService.getOrderForUser("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    if (userOrders.length == 0) {
        throw error("user order has to be positive");
    }

    const zeroOrders = await sdkService.getOrderForUser("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92267");
    if (zeroOrders.length != 0) {
        throw error("zero order has to be zero");
    }

    const activeOrder = await sdkService.isOrderActive(167);
    if (!activeOrder) {
        throw error("order has to be active");
    }

    const inactiveOrder = await sdkService.isOrderActive(1);
    if (inactiveOrder) {
        throw error("order has to be inactive");
    }

    const orderIdsForSize = await sdkService.getBuyOrdersForSize(1000000000, 30);
    console.log(orderIdsForSize);
})();
