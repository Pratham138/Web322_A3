const express = require('express');
const router = express.Router();
const Image = require('./image_schema');

// render the order and purchase page
router.get('/', (req, res) => {
  const selectedImageId = req.query.imageId;
  if (!selectedImageId) {
    return res.status(400).send('Bad Request: Image ID is required');
  }

  Image.findById(selectedImageId).lean()
    .then(image => {
      if (!image) {
        return res.status(404).send('Image not found');
      }

      // render the order and purchase page with image details
      res.render('order_purchase', { image: image });
    })
    .catch(err => {
      console.error('Error fetching image:', err);
      res.status(500).send('Internal Server Error');
    });
});

// handle the purchase action
router.post('/purchase', (req, res) => {
  const selectedImageId = req.body.imageId;
  if (!selectedImageId) {
    return res.status(400).send('Bad Request: Image ID is required');
  }

  Image.findByIdAndUpdate(selectedImageId, { status: 'S' }, { new: true })
    .then(updatedImage => {
      if (!updatedImage) {
        return res.status(404).send('Image not found');
      }

      // redirect back to the gallery page after successful purchase
      res.send('<script>alert("SOLD"); window.location="/";</script>');
    })
    .catch(err => {
      console.error('Error updating image status:', err);
      res.status(500).send('Internal Server Error');
    });
});

// handle canceling the purchase
router.post('/cancel', (req, res) => {
  res.send('<script>alert("MAYBE NEXT TIME"); window.location="/";</script>');
});

module.exports = router;
