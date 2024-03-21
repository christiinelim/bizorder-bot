const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const { createConnection } = require('mysql2/promise');
require('dotenv').config();

let currentOption;
let previousOption;
let keyboardOptions;
let selectedSellerId;
let selectedSeller;
let bot;
const token = process.env.API_KEY;

async function fetchSellersData() {
    const response = await axios.get("http://localhost:8080/seller");
    const data = response.data.data;
    return data;
}

async function fetchSellerData(sellerId) {
    const response = await axios.get(`http://localhost:8080/seller/${sellerId}`);
    const data = response.data.data;
    return data;
}

async function fetchSellerItemsData(sellerId){
    const response = await axios.get(`http://localhost:8080/item/seller/${sellerId}`);
    const data = response.data.data;
    return data;
}



(async () => {
    const data = await fetchSellersData();
    const sellerMap = {};
    const sellerList = data.map((seller) => {
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
            await start(msg);

        } else if (currentOption == "Make a purchase") {
            await purchase(msg);

        } else if (currentOption == "Edit a purchase") {
            await editPurchase(msg);

        } else if (sellerList.includes(currentOption)) {
            selectedSeller = currentOption;
            selectedSellerId = sellerMap[selectedSeller];

            await onSellerClick(msg, selectedSeller);

        } else if (currentOption == "View seller profile") {
            if (selectedSellerId){
                await onViewProfileClick(msg);   
            } 
        } else if (currentOption == "View products"){
            if (selectedSellerId){
                await onViewProductsClick(msg);
            }
        } else if (currentOption == "Back") {

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
            }
        }
        
        
        
        
        
        else if (currentOption == "Exit"){
            bot.sendMessage(
                msg.chat.id, `You have exited. Please type /start to begin again`
            )
        } else {
            bot.sendMessage(
                msg.chat.id, `Please type /start to begin`
            )
        }
    })

    
})();

module.exports = bot;



// START
function start(msg) {
    bot.sendMessage(
        msg.chat.id,
        "Please select what you like to do",
        {
            reply_markup: {
                keyboard: [
                    [{ text: "Make a purchase" }], 
                    [{ text: "Edit a purchase" }],
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
function editPurchase(msg) {
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
    const sellerData = await fetchSellerData(selectedSellerId);

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
    const sellerItems = await fetchSellerItemsData(selectedSellerId);
    const itemMap = {};
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