import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
export function getRouter(){return createRouter({routeTree,basepath:import.meta.env.BASE_URL.replace(/\/$/,'')||'/'})}
declare module '@tanstack/react-router' { interface Register {router:ReturnType<typeof getRouter>} }
