import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ContinuanceReview } from './ContinuanceReview';
import './tokens.css';
const root = document.getElementById('continuance-next-review');
if (!root) throw new Error('Continuance review root is missing.');
createRoot(root).render(<StrictMode><ContinuanceReview/></StrictMode>);
