/** Admin uses the same Shekor token preset as the storefront. */
import preset from '../web/tailwind.config.js';

export default { ...preset, content: ['./index.html', './src/**/*.{ts,tsx}'] };
