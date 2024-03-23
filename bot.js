
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const data = require('./data');
const { createConnection } = require('mysql2/promise');
require('dotenv').config();

let currentOption;
let previousOption;
let keyboardOptions;
let selectedSellerId;
let selectedSeller;
let bot;
let customer_information = false;
const customer_info = {
    "name": "name",
    "contact": "contact",
    "delivery address": "address",
    "payment method": "paymentMethod",
    "collection method": "collectionMethod"
};
const customer_query = ["name", "contact", "delivery address", "payment method", "collection method"];
let customerInfo = {};
let customer_information_count = 0;
let purchase_information = false;
let quantity_check = false;
let item_chosen;
let quantity_chosen;
let order = [];
let itemMap = {};
let itemCount = 0;
let note = "";
let cartOut = false;
let view_purchase = false;
let view_order_id;
const token = process.env.API_KEY;




(async () => {
    const sellersData = await data.getSellersData();
    const sellerMap = {};
    const sellerList = sellersData.map((seller) => {
        sellerMap[seller.name] = seller.sellerId;
        return seller.name;
    });
    keyboardOptions = sellerList.map((seller) => [{ text: seller }]);
    keyboardOptions.push([{ text: "Back" }]);
    keyboardOptions.push([{ text: "Exit" }]);

    if (process.env.NODE_ENV === "SERVER") {
        bot = new TelegramBot(token);
        bot.setWebHook(process.env.SERVER + token);
        console.log("Bot is live")
    } else {
        bot = new TelegramBot(token, {polling: true})
    }

    console.log(`Bot is started in the ${process.env.NODE_ENV} mode`);


    bot.on('text', async(msg) => {
        previousOption = currentOption;
        currentOption = msg.text;
        if (msg.text == '/start') {
            resetCustomerInformation();
            purchase_information = false;
            await start(msg);

        } else if (currentOption == "Make a purchase") {
            resetCustomerInformation();
            purchase_information = false;
            await purchase(msg);

        } else if (currentOption == "View purchase") {
            resetCustomerInformation();
            purchase_information = false;
            await displayViewPurchase(msg);
            view_purchase = true;
        } else if (sellerList.includes(currentOption)) {
            resetCustomerInformation();
            purchase_information = false;
            selectedSeller = currentOption;
            selectedSellerId = sellerMap[selectedSeller];

            await onSellerClick(msg, selectedSeller);

        } else if (currentOption == "View seller profile") {
            if (selectedSellerId){
                resetCustomerInformation();
                purchase_information = false;
                await onViewProfileClick(msg);   
            } 
        } else if (currentOption == "View products"){
            if (selectedSellerId){
                resetCustomerInformation();
                purchase_information = false;
                await onViewProductsClick(msg);
            }
        } else if (currentOption == "Place order"){
            if (selectedSellerId){
                customer_information = true;
                purchase_information = false;
                await onPlaceOrderClick(msg, customer_information_count);
            }
        } else if (customer_information){
            currentOption = "Place order";
            customerInfo[customer_info[customer_query[customer_information_count]]] = msg.text;
            customer_information_count += 1;
            if (customer_information_count == 5) {
                resetCustomerInformation();
                purchase_information = true;
                await onSelectItem(msg);
            } else {
                await onPlaceOrderClick(msg, customer_information_count);
            }
        } else if (currentOption == "Cart out"){
            await onCartOutClick(msg);
            cartOut = true;
        } else if (currentOption == "Submit"){
            purchase_information = false;
            quantity_check = false;
            await sendOrder();
        } else if (cartOut & currentOption == "Add a note") {
            await addNoteMessage(msg);
        } else if (cartOut & currentOption != "Add a note") {
            note = msg.text;
            await submitMessage(msg);
        } else if (purchase_information & currentOption != "Submit"){
            if (!quantity_check) {
                item_chosen = parseInt(itemMap[msg.text]);
                await onItemClick(msg);
                quantity_check = true;
            } else {
                quantity_chosen = parseInt(msg.text);
                order.push([item_chosen, quantity_chosen])
                itemCount += 1;
                await onSelectItem(msg);
                quantity_check = false;
            }
        } else if (view_purchase){
            view_order_id = msg.text;
            if (view_order_id){
                await displayPurchase(msg);
                view_purchase = null;
            }
        }
        
        
        
        
        
        
        
        else if (currentOption == "Back") {
            resetCustomerInformation();
            view_purchase = false;

            currentOption = previousOption;
            
            if (currentOption == "View seller profile") {
                currentOption = selectedSeller;
                await onSellerClick(msg, selectedSeller);

            } else if (currentOption == "Make a purchase") {
                await start(msg);

            } else if (sellerList.includes(currentOption)) {
                currentOption = "Make a purchase";
                await purchase(msg);
                
            } else if (currentOption == "View products") {
                currentOption = selectedSeller;
                await onSellerClick(msg, selectedSeller);
            } else {
                await start(msg);
            }
        }     
        else if (currentOption == "Exit"){
            resetCustomerInformation();
            bot.sendMessage(
                msg.chat.id, `You have exited. Please type /start to begin again`
            )
        } else {
            resetCustomerInformation();
            bot.sendMessage(
                msg.chat.id, `Please type /start to begin`
            )
        }
    })

    
})();





// START
function start(msg) {
    bot.sendMessage(
        msg.chat.id,
        "Please select what you like to do",
        {
            reply_markup: {
                keyboard: [
                    [{ text: "Make a purchase" }], 
                    [{ text: "View purchase" }],
                    [{ text: "Exit" }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        }
    )
}

// PURCHASE
function purchase(msg) {
    bot.sendMessage(
        msg.chat.id,
        "Please select the seller you like to place an order with",
        {
            reply_markup: { 
                keyboard: keyboardOptions,
                resize_keyboard: true,
                one_time_keyboard: true
            }
        }
    )
}


// EDIT
function displayViewPurchase(msg) {
    bot.sendMessage(
        msg.chat.id,
        "Please key in the order number"
    )
}


// CHOSEN SELLER
function onSellerClick(msg, selectedSeller) {
    bot.sendMessage(
        msg.chat.id,
        `You have selected ${selectedSeller}, please select what you like to view.`,
        {
            reply_markup: {
                keyboard: [
                    [{ text: "View seller profile" }], 
                    [{ text: "View products" }],
                    [{ text: "Place order" }],
                    [{ text: "Back" }],
                    [{ text: "Exit" }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        }
    );
}


// VIEW PROFILE
async function onViewProfileClick(msg) {
    const sellerData = await data.getSellerData(selectedSellerId);

    await bot.sendMessage(
        msg.chat.id,
        `Instagram: ${sellerData.instagram}\nTikTok: ${sellerData.tiktok}\nCarousell: ${sellerData.carousell}`,
        {
            reply_markup: {
                keyboard: [
                    [{ text: "Back" }], 
                    [{ text: "Exit" }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        }
    );
}




// VIEW PRODUCTS
async function onViewProductsClick(msg) {
    const sellerItems = await data.getSellerItemsData(selectedSellerId);
    const itemList = sellerItems.map((item) => {
        itemMap[item.name] = item.itemId;
        return item.name;
    });

    let message = '';
    sellerItems.forEach(item => {
        message += `Product: ${item.name}\n`;
        message += `Cost: ${item.cost}\n`;
        message += `Description: ${item.description}\n`;
        message += `Reference: ${item.reference}\n`;
        message += `Available Stocks: ${item.stock_on_hand}\n\n`;
    });

    await bot.sendMessage(
        msg.chat.id,
        message,
        {
            reply_markup: {
                keyboard: [
                    [{ text: "Back" }], 
                    [{ text: "Exit" }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        }
    );
}


// PLACE ORDER
async function onPlaceOrderClick(msg, count){
    if (count < 2){
        await bot.sendMessage(msg.chat.id, `Please enter your ${customer_query[count]}`);
    } else if (count == 2) {
        await bot.sendMessage(msg.chat.id, `Please enter your delivery ${customer_query[count]} if applicable, else indicate NA`);
    } else if (count == 3) {
        await bot.sendMessage(
            msg.chat.id,
            `Please choose your ${customer_query[count]}`,
            {
                reply_markup: {
                    keyboard: [
                        [{ text: "PayNow" }], 
                        [{ text: "Cash" }]
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: true
                }
            }
        );
    } else {
        await bot.sendMessage(
            msg.chat.id,
            `Please choose your ${customer_query[count]}`,
            {
                reply_markup: {
                    keyboard: [
                        [{ text: "Meet up" }], 
                        [{ text: "Delivery" }]
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: true
                }
            }
        );
    }
}


// RESET CUSTOMER INFORMATION
function resetCustomerInformation(){
    customer_information = false;
    customer_information_count = 0;
}


// CHOOSE ITEM
async function onSelectItem(msg){
    const sellerItems = await data.getSellerItemsData(selectedSellerId);
    const itemList = sellerItems.map((item) => {
        itemMap[item.name] = item.itemId;
        return item.name;
    });

    const itemOptions = sellerItems.map((item) => [{ text: item.name }]);

    if (itemCount == 0){
        bot.sendMessage(
            msg.chat.id,
            `Please select the item you like to purchase`,
            {
                reply_markup: {
                    keyboard: itemOptions,
                    resize_keyboard: true,
                    one_time_keyboard: true
                }
            }
        );
    } else {
        itemOptions.push([{ text: "Cart out" }]);
        bot.sendMessage(
            msg.chat.id,
            `Please select the next item you like to purchase if any`,
            {
                reply_markup: {
                    keyboard: itemOptions,
                    resize_keyboard: true,
                    one_time_keyboard: true
                }
            }
        );
    }
}


// CHOOSE QUANTITY
function onItemClick(msg){
    bot.sendMessage(msg.chat.id, `Please indicate the quantity`);
}

function onCartOutClick(msg) {
    bot.sendMessage(
        msg.chat.id,
        `Please add a note if you have any remark for the seller, else click Submit`,
        {
            reply_markup: {
                keyboard: [
                    [{ text: "Add a note" }],
                    [{ text: "Submit" }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        }
    );
}

function addNoteMessage(msg) {
    bot.sendMessage(
        msg.chat.id,
        `Please add a remark for your order`,
    );
}

function submitMessage(msg){
    bot.sendMessage(
        msg.chat.id,
        `Click submit to send your order`,
        {
            reply_markup: {
                keyboard: [
                    [{ text: "Submit" }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        }
    );
}

async function sendOrder() {
    // insert customer info
    const responseCustomer = await data.postCustomerData(customerInfo);
    const customerIdIndex = responseCustomer.data.lastIndexOf(' ');
    const customerId = responseCustomer.data.substring(customerIdIndex + 1);

    // insert order info
    const responseOrder = await data.postOrderData({
        "note": note,
        "paid": "No",
        "status": "Pending",
        "customer": {
            "customerId": customerId
        },
        "seller": {
            "sellerId": selectedSellerId
        }
    });
    const orderIdIndex = responseOrder.data.lastIndexOf(' ');
    const orderId = responseOrder.data.substring(orderIdIndex + 1);

    // insert order [[itemId, quantity]]
    for (let item of order){
        await data.postPurchaseData({
            "quantity": item[1],
            "item": {
                "itemId": item[0]
            },
            "order": {
                "orderId": orderId
            }
        });
    }
}

async function displayPurchase(msg){
    const purchaseData = await data.getOrder(view_order_id);
    await bot.sendMessage(
        msg.chat.id,
        `Purchased from: ${purchaseData[0].order.seller.name}\nItem: ${purchaseData[0].item.name}\nQuantity: ${purchaseData[0].quantity}`,
        {
            reply_markup: {
                keyboard: [
                    [{ text: "Back" }], 
                    [{ text: "Exit" }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        }
    );
}



module.exports = bot;