const axios = require('axios');

async function getSellersData() {
    const response = await axios.get("http://localhost:8080/seller");
    const data = response.data.data;
    return data;
}

async function getSellerData(sellerId) {
    const response = await axios.get(`http://localhost:8080/seller/${sellerId}`);
    const data = response.data.data;
    return data;
}

async function getSellerItemsData(sellerId){
    const response = await axios.get(`http://localhost:8080/item/seller/${sellerId}`);
    const data = response.data.data;
    return data;
}


async function postCustomerData(customerInfo){
    const apiUrl = 'http://localhost:8080/customer';
    try {
        const response = await axios.post(apiUrl, customerInfo);
        return response.data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

async function postOrderData(orderInfo){
    const apiUrl = 'http://localhost:8080/order';
    try {
        const response = await axios.post(apiUrl, orderInfo);
        return response.data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

async function postPurchaseData(purchaseInfo){
    const apiUrl = 'http://localhost:8080/purchase';
    try {
        const response = await axios.post(apiUrl, purchaseInfo);
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

module.exports = {
    getSellersData,
    getSellerData,
    getSellerItemsData,
    postCustomerData,
    postOrderData,
    postPurchaseData
};