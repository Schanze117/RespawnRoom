import express from 'express';
import { User, VideoGame } from '../../models/index.js';

const router = express.Router();

// Get all videogames
router.get('/', async (_req, res) => {
    try {
        const videogames = await VideoGame.findAll({
            include: [{ model: User, as: 'user', attributes: ['userName'] }],
        });
        res.json(videogames);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Get a single videogame by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const videogame = await VideoGame.findByPk(id, {
            include: [{ model: User, as: 'user', attributes: ['userName'] }],
        });
        if (!videogame) {
            res.status(404).json({ message: 'Video game not found' });
            return;
        }
        res.json(videogame);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Create a new videogame
router.post('/', async (req, res) => {
    const { cover, name, genres, player_perspectives, summary, userId } = req.body;
    try {
        // Validate and transform genres and player_perspectives to arrays if necessary
        const genresArray = Array.isArray(genres) ? genres : genres.split(',').map(genre => genre.trim());
        const playerPerspectivesArray = Array.isArray(player_perspectives) ? player_perspectives : player_perspectives.split(',').map(perspective => perspective.trim());

        const newVideogame = await VideoGame.create({
            cover,
            name,
            genres: genresArray,
            player_perspectives: playerPerspectivesArray,
            summary,
            userId,
        });
        res.status(201).json(newVideogame);
    } catch (err) {
        console.log(err);
        res.status(400).json(err);
    }
});

// Delete a videogame by ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const videogame = await VideoGame.findByPk(id);
        if (!videogame) {
            res.status(404).json({ message: 'Videogame not found' });
            return;
        }
        await videogame.destroy();
        res.json({ message: 'Video game deleted successfully' });
    } catch (err) {
        res.status(500).json(err);
    }
});

export { router as videoGameRoutes };