
exports.uploadImage = async (req, res) => {

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
  
    // Extract the file path of the uploaded image
    const filePath = req.picture;
  
    // You can now save the 'filePath' in the MongoDB database if needed or perform any other operation with it
    // For simplicity, we'll just send the file path back as a response
    res.json({ filePath });
};