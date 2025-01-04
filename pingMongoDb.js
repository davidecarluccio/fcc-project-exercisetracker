const mongoose = require('mongoose');

const pingMongodb = async (uri, options) => {
    try {
        await mongoose.connect(uri, options);
        await mongoose.connection.db.admin().command({ ping: 1 });
        console.log("Ping successful. MongoDB connected");
    } catch(err) {
        console.error("[ERR]:", err);
    } finally {
        await mongoose.disconnect();
    }
};

module.exports = { pingMongodb };