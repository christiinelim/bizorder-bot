const axios = require('axios');
require('dotenv').config();

let jwtToken;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

async function getToken() {
    try {
        const response = await axios.post("http://localhost:8080/auth/login", {
            "email": email,
            "password": password
        });
        jwtToken = response.data.token;
        tokenExpirationTime = new Date().getTime() + response.data.expiresIn;
    } catch (error) {
        console.error('Error fetching token:', error);
        throw error;
    }
}

async function refreshTokenIfNeeded() {
    const currentTime = new Date().getTime();
    if (!jwtToken || currentTime >= tokenExpirationTime) {
        await getToken();
    }
}

async function getSellersData() {
    await refreshTokenIfNeeded();
    const response = await axios.get("http://localhost:8080/seller", {
        headers: {
            'Authorization': `Bearer ${jwtToken}`
        }
    });
    const data = response.data.data;
    return data;
}

async function getSellerData(sellerId) {
    await refreshTokenIfNeeded();
    const response = await axios.get(`http://localhost:8080/seller/${sellerId}`, {
        headers: {
            'Authorization': `Bearer ${jwtToken}`
        }
    });
    const data = response.data.data;
    return data;
}

async function getSellerItemsData(sellerId){
    await refreshTokenIfNeeded();
    const response = await axios.get(`http://localhost:8080/item/seller/${sellerId}`, {
        headers: {
            'Authorization': `Bearer ${jwtToken}`
        }
    });
    const data = response.data.data;
    return data;
}


async function postCustomerData(customerInfo){
    await refreshTokenIfNeeded();
    const apiUrl = 'http://localhost:8080/customer';
    try {
        const response = await axios.post(apiUrl, customerInfo, {
            headers: {
                'Authorization': `Bearer ${jwtToken}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

async function postOrderData(orderInfo){
    await refreshTokenIfNeeded();
    const apiUrl = 'http://localhost:8080/order';
    try {
        const response = await axios.post(apiUrl, orderInfo, {
            headers: {
                'Authorization': `Bearer ${jwtToken}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

async function postPurchaseData(purchaseInfo){
    await refreshTokenIfNeeded();
    const apiUrl = 'http://localhost:8080/purchase';
    try {
        const response = await axios.post(apiUrl, purchaseInfo, {
            headers: {
                'Authorization': `Bearer ${jwtToken}`
            }
        });
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

async function getOrder(orderId){
    await refreshTokenIfNeeded();
    try {
        const response = await axios.get(`http://localhost:8080/purchase/order/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${jwtToken}`
            }
        });
        const data = response.data.data;
        return data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

getToken();

module.exports = {
    getSellersData,
    getSellerData,
    getSellerItemsData,
    postCustomerData,
    postOrderData,
    postPurchaseData,
    getOrder
};