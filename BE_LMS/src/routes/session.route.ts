import { Router } from 'express';
import {
  deleteAllSessionOfUserHandler,
  deleteSessionHandler,
  getSessionHandler,
} from '../controller/session.controller';

const sessionRoutes = Router();

//prefix: /sessions
sessionRoutes.get('/', getSessionHandler);
sessionRoutes.delete('/:id', deleteSessionHandler);
sessionRoutes.delete('/user/:userId', deleteAllSessionOfUserHandler);

export default sessionRoutes;
