import { Router } from 'express';
import { PlantController } from '../controllers/plantController';
import { authenticate, authorize } from '../middleware/auth';
import { ROLES } from '../constants/roles';

const router = Router();
const plantController = new PlantController();

router.post(
    '/',
    authenticate,
    authorize(ROLES.SUPER_ADMIN),
    plantController.createPlant
);

router.get(
    '/',
    authenticate,
    authorize(ROLES.SUPER_ADMIN, ROLES.PLANT_ADMIN),
    plantController.getAllPlants
);

router.get(
    '/:id',
    authenticate,
    plantController.getPlantById
);

router.put(
    '/:id',
    authenticate,
    authorize(ROLES.SUPER_ADMIN, ROLES.PLANT_ADMIN),
    plantController.updatePlant
);

router.delete(
    '/:id',
    authenticate,
    authorize(ROLES.SUPER_ADMIN),
    plantController.deletePlant
);

export default router;