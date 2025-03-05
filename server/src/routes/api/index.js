import { Router } from 'express';
import { userRoutes } from './user-routes.js';
import { videoGameRoutes } from './videogame-routes.js';

const router = Router();

router.use('/users', userRoutes);
router.use('/videogames', videoGameRoutes);

export default router;