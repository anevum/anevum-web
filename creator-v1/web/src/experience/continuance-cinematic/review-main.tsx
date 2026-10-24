import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CinematicReactReview } from './CinematicReactReview';

const mount = document.getElementById('continuance-cinematic-react-review');
if (!mount) throw new Error('Cinematic React review root is missing.');
createRoot(mount).render(<StrictMode><CinematicReactReview/></StrictMode>);
