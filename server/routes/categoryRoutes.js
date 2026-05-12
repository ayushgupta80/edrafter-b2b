const express = require('express');
const Category = require('../models/Category');
const { protect } = require('../middleware/authMiddleware');
const { adminCheck } = require('../middleware/adminMiddleware');
const router = express.Router();

// Add a new category (Admin only)
router.post('/', protect, adminCheck, async (req, res) => {
  const { name, img, description } = req.body;
  
  try {
    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = new Category({ name, img, description });
    await category.save();

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Error adding category', error });
  }
});



// Get all categories with the number of products in each category
router.get('/', async (req, res) => {
  try {
    // Use aggregation to fetch categories and count products in each
    const categoriesWithProductCount = await Category.aggregate([
      {
        $lookup: {
          from: 'products', // Collection to join with (name of the Product collection in MongoDB)
          localField: '_id', // Field from the Category collection
          foreignField: 'category', // Field from the Product collection
          as: 'products', // Output array containing the products
        },
      },
      {
        $addFields: {
          productCount: { $size: '$products' }, // Add a new field with the count of products
        },
      },
      {
        $project: {
          name: 1,
          img: 1,
          description: 1,
          productCount: 1, // Only return the needed fields
        },
      },
    ]);

    res.json(categoriesWithProductCount);
  } catch (error) {
    console.error("Error fetching categories with product count:", error);
    res.status(500).json({ message: 'Error fetching categories', error });
  }
});



// Get a single category by ID
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching category', error });
  }
});

// Update a category (Admin only)
router.put('/:id', protect, adminCheck, async (req, res) => {
  const { name, description } = req.body;

  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    category.name = name || category.name;
    category.description = description || category.description;

    await category.save();
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Error updating category', error });
  }
});

// Delete a category (Admin only)
router.delete('/:id', protect, adminCheck, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await category.remove();
    res.json({ message: 'Category removed' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting category', error });
  }
});

module.exports = router;
