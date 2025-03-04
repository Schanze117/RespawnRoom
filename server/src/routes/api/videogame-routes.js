import express from 'express';
import { User, Videogame } from '../../models/index.js';

const router = express.Router();

//Get all videogames
router.get('/', async (req, res) => {
    try {
        const videogames = await Videogame.findAll({
            include : [{ model: User, as: 'assignedUser', attributes: ['userName'] }],
        });
        res.json(videogames);
    } catch (err) {
        res.status(500).json(err);
    }
});

//Get a single videogame by ID
router.get('/:id', async (req, res) => {
    try {
        const videogame = await Videogame.findByPk(req.params.id, {
            include : [{ model: User, as: 'assignedUser', attributes: ['userName'] }],
        });
        if (!videogame) {
            res.status(404).json({ message: 'Videogame not found' });
            return;
        }
        res.json(videogame);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Create a new videogame
router.post('/', async (req, res) => {
    try {
        const newVideogame = await Videogame.create(req.body);
        res.status(201).json(newVideogame);
    } catch (err) {
        res.status(400).json(err);
    }
});