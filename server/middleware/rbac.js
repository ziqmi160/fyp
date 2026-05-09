import { requireRole } from './auth.js';

export const studentOnly = requireRole('student');
export const supervisorOnly = requireRole('supervisor');
export const coordinatorOnly = requireRole('coordinator');
