import express from 'express';
import { User, VideoGame } from '../../models/index.js';

const router = express.Router();

// Get all users
router.get('/', async (_req, res) => {
    try {
        const users = await User.findAll({
                include : [{ model: VideoGame, as: 'videoGames', }],
            });
        res.json(users);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Get a single user by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findByPk(id, {
            include : [{ model: VideoGame, as: 'videoGames', }],
        });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json(user);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Create a new user
router.post('/', async (req, res) => {
    const { userName } = req.body;
    try {
        const newUser = await User.create({ userName });
        res.status(201).json(newUser);
    } catch (err) {
        res.status(400).json(err);
    }
});

// Update a user by ID
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { userName } = req.body;
    try {
        const user = await User.findByPk(id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        await user.update({ userName });
        res.json(user);
    } catch (err) {
        res.status(400).json(err);
    }
});

// Delete a user by ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findByPk(id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        await user.destroy();
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json(err);
    }
});

export { router as userRoutes };