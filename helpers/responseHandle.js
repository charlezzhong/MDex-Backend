exports.response = (status, message, data = null, res) => {
    return res.status(status).json({
        message,
        data,
        status
    });
}

